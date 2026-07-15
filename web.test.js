'use strict';

/**
 * Unit tests for lib/web.js, focused on the preInitFunctions()/userFunctions() split introduced to fix
 * the setTheme() ordering bug: myChart.setTheme() replays only the very first setOption() call it has
 * ever seen ("recreate"), so anything setTheme() itself depends on (e.g. echarts.registerTheme()) must
 * run in preInitFunctions() — which executes before setTheme() — while anything that calls setOption()
 * (e.g. registerMap() + setOption() event handlers) must run in userFunctions() — which executes after.
 *
 * These tests exercise the string-replacement logic in isolation (no docker / running adapter required).
 * The actual rendered-chart behavior is covered by test/integration/test_charts.sh against a live instance.
 */

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const ExtensionFlexcharts = require('./lib/web.js');

function makeExtension() {
    const stubAdapter = {
        log: { info: () => {}, debug: () => {}, error: () => {}, warn: () => {} },
    };
    const stubApp = { use: () => {} };
    const instanceSettings = { native: {}, _id: 'system.adapter.flexcharts.0' };
    return new ExtensionFlexcharts(null, {}, stubAdapter, instanceSettings, stubApp);
}

const echartsHtmlPath = path.join(__dirname, 'www', 'echarts.html');

describe('lib/web.js => echarts.html structure', () => {
    const html = fs.readFileSync(echartsHtmlPath, 'utf8');

    it('contains exactly one preInitFunctions() and one userFunctions() marker', () => {
        assert.strictEqual((html.match(/\/\* preInitFunctions\(\) \*\//g) || []).length, 1);
        assert.strictEqual((html.match(/\/\* userFunctions\(\) \*\//g) || []).length, 1);
    });

    it('runs preInitFunctions(), then the setTheme() bootstrap, then the real setOption(), then userFunctions() - in that order', () => {
        const idxPreInit = html.indexOf('/* preInitFunctions() */');
        const idxBootstrapSetOption = html.indexOf("myChart.setOption({});");
        const idxUpdateDarkMode = html.indexOf('updateDarkMode();', idxBootstrapSetOption);
        const idxRealSetOption = html.indexOf('myChart.setOption(option);');
        const idxUserFct = html.indexOf('/* userFunctions() */');

        assert.ok(idxPreInit >= 0, 'preInitFunctions() marker not found');
        assert.ok(idxBootstrapSetOption >= 0, 'bootstrap myChart.setOption({}) not found');
        assert.ok(idxUpdateDarkMode >= 0, 'updateDarkMode() call after bootstrap not found');
        assert.ok(idxRealSetOption >= 0, 'myChart.setOption(option) not found');
        assert.ok(idxUserFct >= 0, 'userFunctions() marker not found');

        assert.ok(idxPreInit < idxBootstrapSetOption, 'preInitFunctions() must run before the bootstrap setOption()');
        assert.ok(idxBootstrapSetOption < idxUpdateDarkMode, 'bootstrap setOption() must run before updateDarkMode()/setTheme()');
        assert.ok(idxUpdateDarkMode < idxRealSetOption, 'updateDarkMode()/setTheme() must run before the real setOption(option)');
        assert.ok(idxRealSetOption < idxUserFct, 'the real setOption(option) must run before userFunctions()');
    });
});

describe('lib/web.js => applyPreInitFunctions()', () => {
    it('inserts code into the preInitFunctions() slot and keeps the placeholder for chaining', () => {
        const ext = makeExtension();
        const content = Buffer.from('before /* preInitFunctions() */ after');
        const result = ext.applyPreInitFunctions(content, 'FOO();').toString();
        assert.strictEqual(result, 'before FOO();/* preInitFunctions() */ after');
    });

    it('does not touch the userFunctions() slot', () => {
        const ext = makeExtension();
        const content = Buffer.from('/* preInitFunctions() */ ... /* userFunctions() */');
        const result = ext.applyPreInitFunctions(content, 'FOO();').toString();
        assert.ok(result.includes('/* userFunctions() */'));
        assert.ok(!result.includes('FOO();/* userFunctions() */'));
    });

    it('masks literal "$" in the injected code so it is not misinterpreted as a replacement pattern', () => {
        const ext = makeExtension();
        const content = Buffer.from('/* preInitFunctions() */');
        const result = ext.applyPreInitFunctions(content, 'var x = "$&$1";').toString();
        assert.ok(result.startsWith('var x = "$&$1";'), `unexpected masking result: ${result}`);
    });

    it('leaves content unchanged for an empty string', () => {
        const ext = makeExtension();
        const content = Buffer.from('/* preInitFunctions() */');
        const result = ext.applyPreInitFunctions(content, '').toString();
        assert.strictEqual(result, '/* preInitFunctions() */');
    });
});

describe('lib/web.js => applyUserFunctions() (regression: must stay targeted at userFunctions())', () => {
    it('inserts code into the userFunctions() slot and does not touch preInitFunctions()', () => {
        const ext = makeExtension();
        const content = Buffer.from('/* preInitFunctions() */ ... /* userFunctions() */');
        const result = ext.applyUserFunctions(content, 'BAR();').toString();
        assert.ok(result.includes('BAR();/* userFunctions() */'));
        assert.ok(!result.includes('BAR();/* preInitFunctions() */'));
    });
});

describe('lib/web.js => applyTheme() (used by scripts returning [option, [themeName, themeJson]], e.g. template5)', () => {
    it('registers a JSON-object theme definition in the preInitFunctions() slot, not userFunctions()', () => {
        const ext = makeExtension();
        const content = Buffer.from('/* preInitFunctions() */ ... /* userFunctions() */');
        const result = ext.applyTheme(content, ['mytheme', '{"backgroundColor":"#111111"}']).toString();
        assert.ok(result.includes('echarts.registerTheme("mytheme",{"backgroundColor":"#111111"});/* preInitFunctions() */'));
        // The registration must appear before the preInitFunctions() marker, and userFunctions() must stay untouched
        assert.ok(result.indexOf('registerTheme') < result.indexOf('/* preInitFunctions() */'));
        assert.ok(result.includes('/* userFunctions() */'));
    });

    it('inserts a full theme definition (containing its own registerTheme call) into preInitFunctions(), not userFunctions()', () => {
        const ext = makeExtension();
        const content = Buffer.from('/* preInitFunctions() */ ... /* userFunctions() */');
        const themeCode = 'var x=1;echarts.registerTheme("dark",{color:["#e0e0e0"]});';
        const result = ext.applyTheme(content, ['dark', themeCode]).toString();
        assert.ok(result.includes(themeCode + '/* preInitFunctions() */'));
    });
});

describe('lib/web.js => processArrayResult() (full [option, userFunction, theme] contract)', () => {
    it('routes each array element to the correct slot and preserves preInit-before-userFunctions ordering', () => {
        const ext = makeExtension();
        const content = Buffer.from(
            'var option = { /* chartOptions */ };\n/* preInitFunctions() */\n...\n/* userFunctions() */',
        );
        const result = ext
            .processArrayResult(content, ['{"series":[]}', 'myChart.on("click",()=>{});', ['dark', '{"color":["#fff"]}']])
            .toString();

        assert.ok(result.includes('var option = {"series":[]};'), 'chart options not applied');
        assert.ok(result.includes('myChart.on("click",()=>{});/* userFunctions() */'), 'user function not routed to userFunctions()');
        assert.ok(
            result.includes('echarts.registerTheme("dark",{"color":["#fff"]});/* preInitFunctions() */'),
            'theme not routed to preInitFunctions()',
        );
        assert.ok(
            result.indexOf('registerTheme') < result.indexOf('myChart.on("click"'),
            'theme registration must end up before the user function code in the rendered page',
        );
    });
});
