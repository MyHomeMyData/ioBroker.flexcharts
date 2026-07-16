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

    it('setThemeByMode() applies myChart.setTheme() for every myDarkMode value', () => {
        const fnStart = html.indexOf('function setThemeByMode()');
        const fnEnd = html.indexOf('\n      }', fnStart);
        assert.ok(fnStart >= 0 && fnEnd > fnStart, 'setThemeByMode() function body not found');
        const fnBody = html.slice(fnStart, fnEnd);

        assert.match(fnBody, /case 'default':\s*myChart\.setTheme\('default'\)/);
        assert.match(fnBody, /case 'dark':\s*myChart\.setTheme\('dark'\)/);
        assert.match(fnBody, /case 'auto':[\s\S]*?myChart\.setTheme\(isDarkMode \? 'dark' : 'default'\)/);
        assert.match(fnBody, /default:\s*myChart\.setTheme\('default'\)/);
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

    it('updateDarkMode() applies a plain setTheme() and returns early on its first call, before touching getOption()/setOption()', () => {
        // Risk-reduction design: on the very first call (from the bootstrap sequence below),
        // nothing has been rendered yet, so there is nothing the more elaborate save/restore dance
        // further down could lose - a plain theme switch (matching flexcharts' behavior before this
        // fix existed) is enough and confines the getOption()/setOption() round-trip to only run
        // when it is actually needed: on a later, real runtime theme change.
        const fnStart = html.indexOf('function updateDarkMode()');
        const fnEnd = html.indexOf('\n      }', fnStart);
        assert.ok(fnStart >= 0 && fnEnd > fnStart, 'updateDarkMode() function body not found');
        const fnBody = html.slice(fnStart, fnEnd);

        const idxGuard = fnBody.indexOf('if (!darkModeInitialized)');
        assert.ok(idxGuard >= 0, 'updateDarkMode() must guard its first call with an initialization flag');
        const guardBlockEnd = fnBody.indexOf('\n        }', idxGuard);
        const guardBlock = fnBody.slice(idxGuard, guardBlockEnd);

        assert.ok(guardBlock.includes('setThemeByMode()'), 'the first-call branch must apply the theme');
        assert.ok(guardBlock.includes('darkModeInitialized = true'), 'the first-call branch must record that it has run');
        assert.ok(guardBlock.includes('return'), 'the first-call branch must return before reaching the save/restore logic below');
        assert.ok(!guardBlock.includes('getOption'), 'the first-call branch must not touch getOption() - there is nothing to save yet');
    });

    it('updateDarkMode() saves the current option via getOption() and restores it via setOption() around setThemeByMode() on later calls', () => {
        // Regression test: myChart.setTheme() (called by setThemeByMode()) discards the currently
        // displayed option (see the preInitFunctions()/setTheme() ordering fix above). Later calls
        // to updateDarkMode() - only ever from the darkModeMediaQuery 'change' listener, i.e. a real
        // runtime theme change - can hit a chart that shows much more than the initial `option`
        // (e.g. userFunctions()-driven updates), so they must round-trip through
        // myChart.getOption()/setOption(), not just re-apply the initial `option` variable.
        const fnStart = html.indexOf('function updateDarkMode()');
        const fnEnd = html.indexOf('\n      }', fnStart);
        const fnBody = html.slice(fnStart, fnEnd);

        // Only look at the code after the first-call early return, so the guard block above (which
        // intentionally does NOT call getOption()) can't produce a false match here.
        const idxReturn = fnBody.indexOf('return;');
        assert.ok(idxReturn >= 0, 'first-call branch must contain a return statement');
        const laterBody = fnBody.slice(idxReturn);

        const idxGetOption = laterBody.indexOf('myChart.getOption()');
        assert.ok(idxGetOption >= 0, 'updateDarkMode() must call myChart.getOption() to save the current state on later calls');
        const idxSetTheme = laterBody.indexOf('setThemeByMode()', idxGetOption);
        const idxRestore = laterBody.indexOf('myChart.setOption(', idxGetOption);

        assert.ok(idxSetTheme >= 0, 'the later-call branch must apply the theme via setThemeByMode()');
        assert.ok(idxRestore >= 0, 'updateDarkMode() must call myChart.setOption() to restore the saved state');
        assert.ok(idxGetOption < idxSetTheme, 'getOption() must be called before setThemeByMode()');
        assert.ok(idxSetTheme < idxRestore, 'the saved state must be restored via setOption() after setThemeByMode()');
    });

    it('updateDarkMode() strips theme-owned global styling keys from the saved option before restoring it', () => {
        // Regression test: myChart.getOption() resolves the *previous* theme's global styling
        // defaults (series color palette, background, ...) into explicit values. Restoring the
        // saved option verbatim after setTheme() would freeze those at their old values instead of
        // letting the newly applied theme provide its own - e.g. the chart background updates on a
        // system theme change, but the series color palette silently stays stuck on the old theme's
        // colors. These keys must be deleted from the saved snapshot before it is restored.
        const fnStart = html.indexOf('function updateDarkMode()');
        const fnEnd = html.indexOf('\n      }', fnStart);
        const fnBody = html.slice(fnStart, fnEnd);
        const idxGetOption = fnBody.indexOf('myChart.getOption()');
        const idxRestore = fnBody.lastIndexOf('myChart.setOption(');

        for (const key of ['color', 'backgroundColor', 'gradientColor', 'textStyle']) {
            const idxDelete = fnBody.indexOf(`delete currentOption.${key}`);
            assert.ok(idxDelete >= 0, `updateDarkMode() must delete currentOption.${key} before restoring`);
            assert.ok(idxDelete > idxGetOption, `delete currentOption.${key} must happen after the option was saved`);
            assert.ok(idxDelete < idxRestore, `delete currentOption.${key} must happen before the option is restored`);
        }
    });

    it('updateDarkMode() restores the saved option without animation, then re-enables animation for later updates', () => {
        // Regression test: setTheme() clears all series before this function restores them again.
        // Without disabling animation for that specific restore, ECharts treats it as brand new
        // series appearing and plays their entrance animation (bars growing up from zero, etc.),
        // which visibly looks like the chart rebuilding instead of just recoloring in place.
        // Animation must be switched back on afterward so later updates (SSE, user interaction) keep
        // animating normally - this must not permanently disable animation for the whole chart.
        const fnStart = html.indexOf('function updateDarkMode()');
        const fnEnd = html.indexOf('\n      }', fnStart);
        const fnBody = html.slice(fnStart, fnEnd);
        const idxGetOption = fnBody.indexOf('myChart.getOption()');
        const idxDisable = fnBody.indexOf('currentOption.animation = false', idxGetOption);
        const idxRestore = fnBody.indexOf('myChart.setOption(currentOption)', idxGetOption);
        const idxReenable = fnBody.indexOf('myChart.setOption({ animation:', idxGetOption);

        assert.ok(idxDisable >= 0, 'updateDarkMode() must set currentOption.animation = false before restoring');
        assert.ok(idxRestore >= 0, 'updateDarkMode() must restore via myChart.setOption(currentOption)');
        assert.ok(idxReenable >= 0, 'updateDarkMode() must re-enable animation with a follow-up setOption() call');
        assert.ok(idxDisable < idxRestore, 'animation must be disabled before the option is restored');
        assert.ok(idxRestore < idxReenable, 'animation must be re-enabled only after the restore is applied');
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
