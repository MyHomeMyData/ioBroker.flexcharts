/* jshint -W097 */
/* jshint strict: false */
/* jslint node: true */
/* jshint -W061 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { demoChart, demoChartGauge } = require('./demoCharts');

/**
 * Proxy class
 *
 * Implement functionality to evaluate and forward users definition of diagram to eChart-script
 *
 */
class ExtensionFlexcharts {
    /**
     * @param {object} server http or https node.js object
     * @param {object} webSettings settings of the web server, like <pre><code>{secure: settings.secure, port: settings.port}</code></pre>
     * @param {object} adapter web adapter object
     * @param {object} instanceSettings instance object with common and native
     * @param {object} app express application
     */
    constructor(server, webSettings, adapter, instanceSettings, app) {
        this.app = app;
        this.config = instanceSettings ? instanceSettings.native : {};
        this.namespace = instanceSettings ? instanceSettings._id.substring('system.adapter.'.length) : 'flexcharts.0';
        this.name = this.namespace.split('.')[0];
        this.pd = String(os.platform) == 'win32' ? '\\' : '/'; // Path delimiter
        this.path = __dirname
            .replace(`/.dev-server/default/node_modules/iobroker.${this.name}`, '')
            .replace(`${this.pd}lib`, '');
        this.rxChart = /\{ \/\* chartOptions \*\/ \}/; // Regular Expression to replace '{ /* chartOptions */ }' in echarts.html
        this.rxUserFct = /\/\* userFunctions\(\) \*\//; // Regular Expression to replace '/* userFunctions() */' in echarts.html
        this.rxUserFctPlain = '/* userFunctions() */'; // Plain version of replacement text in echarts.html
        this.rxDMdefault = /myDarkMode = 'default'/; // Regular Expression to switch darkmode in echarts.html to update according to system setting
        this.strDMdark = "myDarkMode = 'dark'"; // Replacement for above RegEx to activate dark mode permanently
        this.strDMauto = "myDarkMode = 'auto'"; // Replacement for above RegEx to activate dynamic switching
        this.rxRefresh = /http-equiv="refresh" content="-3600"/; // Regular Expression to add refresh value in echarts.html
        this.strRefresh = 'http-equiv="refresh" content="'; // Replacement for above RegEx

        // Replacement to set Apache ECharts default theme to 'v5' - refer to https://echarts.apache.org/handbook/en/basics/release-note/v6-upgrade-guide/ chapter "Default Theme"
        this.strThemeV5 =
            'var colorPalette=["#5470c6","#91cc75","#fac858","#ee6666","#73c0de","#3ba272","#fc8452","#9a60b4","#ea7ccc"],axisCommon=function(){return{axisLine:{lineStyle:{color:"#6E7079"}},axisLabel:{color:null},splitLine:{lineStyle:{color:["#E0E6F1"]}},splitArea:{areaStyle:{color:["rgba(250,250,250,0.2)","rgba(210,219,238,0.2)"]}},minorSplitLine:{color:"#F4F7FD"}}},gradientColor=["#f6efa6","#d88273","#bf444c"],light_theme={color:colorPalette,gradientColor:gradientColor,loading:{textColor:"red"},bar:{defaultBarGap:"20%",select:{itemStyle:{borderColor:"#212121",borderWidth:1}}},boxplot:{emphasis:{itemStyle:{shadowColor:"rgba(0,0,0,0.2)"}}},funnel:{bottom:60,select:{itemStyle:{borderColor:"#212121",borderWidth:1}},label:{color:"inherit"}},gauge:{axisLine:{lineStyle:{color:[[1,"#E6EBF8"]]}},splitLine:{lineStyle:{color:"#63677A"}},axisTick:{lineStyle:{color:"#63677A"}},axisLabel:{color:"#464646"},anchor:{itemStyle:{color:"#fff",borderColor:"#5470c6"}},title:{color:"#464646"},detail:{backgroundColor:"rgba(0,0,0,0)",borderColor:"#ccc",color:"#464646"}},graph:{lineStyle:{color:"#aaa"},select:{itemStyle:{borderColor:"#212121"}}},heatmap:{select:{itemStyle:{borderColor:"#212121"}}},line:{symbolSize:4},pictorialBar:{select:{itemStyle:{borderColor:"#212121",borderWidth:1}}},pie:{radius:[0,"75%"],labelLine:{length2:15}},map:{defaultItemStyleColor:"#eee",label:{color:"#000"},itemStyle:{borderColor:"#444",areaColor:"#eee"},emphasis:{label:{color:"rgb(100,0,0)"},itemStyle:{areaColor:"rgba(255,215,0,0.8)"}},select:{label:{color:"rgb(100,0,0)"},itemStyle:{color:"rgba(255,215,0,0.8)"}}},sankey:{lineStyle:{color:"#314656"},select:{itemStyle:{borderColor:"#212121"}}},scatter:{select:{itemStyle:{borderColor:"#212121"}}},tree:{lineStyle:{color:"#ccc"}},treemap:{left:"center",top:"middle",width:"80%",height:"80%",scaleLimit:{max:null,min:null},breadcrumb:{top:"bottom",bottom:null,itemStyle:{color:"rgba(0,0,0,0.7)",textStyle:{color:"#fff"}},emphasis:{itemStyle:{color:"rgba(0,0,0,0.9)"}}}},timeAxis:axisCommon(),logAxis:axisCommon(),valueAxis:axisCommon(),categoryAxis:(()=>{const o=axisCommon();return o.axisTick={show:!0},o})(),axisPointer:{lineStyle:{color:"#B9BEC9"},shadowStyle:{color:"rgba(210,219,238,0.2)"},label:{backgroundColor:"auto",color:"#fff"},handle:{color:"#333",shadowBlur:3,shadowColor:"#aaa",shadowOffsetX:0,shadowOffsetY:2}},brush:{brushStyle:{color:"rgba(210,219,238,0.3)",borderColor:"#D2DBEE"},defaultOutOfBrushColor:"#ddd"},calendar:{splitLine:{lineStyle:{color:"#000"}},itemStyle:{borderColor:"#ccc"},dayLabel:{margin:"50%",color:"#000"},monthLabel:{margin:5,color:"#000"},yearLabel:{margin:30,color:"#ccc"}},dataZoom:{borderColor:"#d2dbee",borderRadius:3,backgroundColor:"rgba(47,69,84,0)",dataBackground:{lineStyle:{color:"#d2dbee",width:.5},areaStyle:{color:"#d2dbee",opacity:.2}},selectedDataBackground:{lineStyle:{color:"#8fb0f7",width:.5},areaStyle:{color:"#8fb0f7",opacity:.2}},handleStyle:{color:"#fff",borderColor:"#ACB8D1"},moveHandleStyle:{color:"#D2DBEE",opacity:.7},textStyle:{color:"#6E7079"},brushStyle:{color:"rgba(135,175,274,0.15)"},emphasis:{handleStyle:{borderColor:"#8FB0F7"},moveHandleStyle:{color:"#8FB0F7",opacity:.7}},defaultLocationEdgeGap:7},geo:{defaultItemStyleColor:"#eee",label:{color:"#000"},itemStyle:{borderColor:"#444"},emphasis:{label:{color:"rgb(100,0,0)"},itemStyle:{color:"rgba(255,215,0,0.8)"}},select:{label:{color:"rgb(100,0,0)"},itemStyle:{color:"rgba(255,215,0,0.8)"}}},grid:{left:"10%",top:60,bottom:70,borderColor:"#ccc"},legend:{top:0,bottom:null,backgroundColor:"rgba(0,0,0,0)",borderColor:"#ccc",itemGap:10,inactiveColor:"#ccc",inactiveBorderColor:"#ccc",lineStyle:{inactiveColor:"#ccc"},textStyle:{color:"#333"},selectorLabel:{color:"#666",borderColor:"#666"},emphasis:{selectorLabel:{color:"#eee",backgroundColor:"#666"}},pageIconColor:"#2f4554",pageIconInactiveColor:"#aaa",pageTextStyle:{color:"#333"}},radar:(()=>{const o=axisCommon();return o.radius="75%",o.axisName={color:"#bbb"},o.axisLine.lineStyle.color="#bbb",o})(),timeline:{padding:5,borderColor:"#ccc",lineStyle:{color:"#DAE1F5"},label:{color:"#A4B1D7"},itemStyle:{color:"#A4B1D7",borderWidth:1},checkpointStyle:{color:"#316bf3",borderColor:"#fff",borderWidth:2,shadowBlur:2,shadowOffsetX:1,shadowOffsetY:1,shadowColor:"rgba(0, 0, 0, 0.3)"},controlStyle:{playIcon:"path://M31.6,53C17.5,53,6,41.5,6,27.4S17.5,1.8,31.6,1.8C45.7,1.8,57.2,13.3,57.2,27.4S45.7,53,31.6,53z M31.6,3.3 C18.4,3.3,7.5,14.1,7.5,27.4c0,13.3,10.8,24.1,24.1,24.1C44.9,51.5,55.7,40.7,55.7,27.4C55.7,14.1,44.9,3.3,31.6,3.3z M24.9,21.3 c0-2.2,1.6-3.1,3.5-2l10.5,6.1c1.899,1.1,1.899,2.9,0,4l-10.5,6.1c-1.9,1.1-3.5,0.2-3.5-2V21.3z",stopIcon:"path://M30.9,53.2C16.8,53.2,5.3,41.7,5.3,27.6S16.8,2,30.9,2C45,2,56.4,13.5,56.4,27.6S45,53.2,30.9,53.2z M30.9,3.5C17.6,3.5,6.8,14.4,6.8,27.6c0,13.3,10.8,24.1,24.101,24.1C44.2,51.7,55,40.9,55,27.6C54.9,14.4,44.1,3.5,30.9,3.5z M36.9,35.8c0,0.601-0.4,1-0.9,1h-1.3c-0.5,0-0.9-0.399-0.9-1V19.5c0-0.6,0.4-1,0.9-1H36c0.5,0,0.9,0.4,0.9,1V35.8z M27.8,35.8 c0,0.601-0.4,1-0.9,1h-1.3c-0.5,0-0.9-0.399-0.9-1V19.5c0-0.6,0.4-1,0.9-1H27c0.5,0,0.9,0.4,0.9,1L27.8,35.8L27.8,35.8z",nextIcon:"M2,18.5A1.52,1.52,0,0,1,.92,18a1.49,1.49,0,0,1,0-2.12L7.81,9.36,1,3.11A1.5,1.5,0,1,1,3,.89l8,7.34a1.48,1.48,0,0,1,.49,1.09,1.51,1.51,0,0,1-.46,1.1L3,18.08A1.5,1.5,0,0,1,2,18.5Z",prevIcon:"M10,.5A1.52,1.52,0,0,1,11.08,1a1.49,1.49,0,0,1,0,2.12L4.19,9.64,11,15.89a1.5,1.5,0,1,1-2,2.22L1,10.77A1.48,1.48,0,0,1,.5,9.68,1.51,1.51,0,0,1,1,8.58L9,.92A1.5,1.5,0,0,1,10,.5Z",color:"#A4B1D7",borderColor:"#A4B1D7",borderWidth:1},emphasis:{label:{color:"#6f778d"},itemStyle:{color:"#316BF3"},controlStyle:{color:"#316BF3",borderColor:"#316BF3",borderWidth:2}},progress:{lineStyle:{color:"#316BF3"},itemStyle:{color:"#316BF3"},label:{color:"#6f778d"}}},title:{left:0,top:0,backgroundColor:"rgba(0,0,0,0)",borderColor:"#ccc",textStyle:{color:"#464646"},subtextStyle:{color:"#6E7079"}},toolbox:{borderColor:"#ccc",padding:5,itemGap:8,iconStyle:{borderColor:"#666"},emphasis:{iconStyle:{borderColor:"#3E98C5"}}},tooltip:{axisPointer:{crossStyle:{color:"#999"}},textStyle:{color:"#666"},backgroundColor:"#fff",borderWidth:1,defaultBorderColor:"#fff"},visualMap:{color:[gradientColor[2],gradientColor[1],gradientColor[0]],inactive:["rgba(0,0,0,0)"],indicatorStyle:{shadowColor:"rgba(0,0,0,0.2)"},backgroundColor:"rgba(0,0,0,0)",borderColor:"#ccc",contentColor:"#5793f3",inactiveColor:"#aaa",padding:5,textStyle:{color:"#333"}}};echarts.registerTheme("default",light_theme);';

        this.strThemeV5Dark =
            'var dark_colorPalette=["#4992ff","#7cffb2","#fddd60","#ff6e76","#58d9f9","#05c091","#ff8a45","#8d48e3","#dd79ff"],dark_contrastColor="#B9B8CE",dark_backgroundColor="#100C2A",dark_axisCommon=function(){return{axisLine:{lineStyle:{color:dark_contrastColor}},axisLabel:{color:null},splitLine:{lineStyle:{color:"#484753"}},splitArea:{areaStyle:{color:["rgba(255,255,255,0.02)","rgba(255,255,255,0.05)"]}},minorSplitLine:{lineStyle:{color:"#20203B"}}}},dark_theme={darkMode:!0,color:dark_colorPalette,backgroundColor:dark_backgroundColor,timeAxis:dark_axisCommon(),logAxis:dark_axisCommon(),valueAxis:dark_axisCommon(),categoryAxis:(()=>{const o=dark_axisCommon();return o.axisTick={show:!0},o})(),axisPointer:{lineStyle:{color:"#817f91"},crossStyle:{color:"#817f91"},label:{color:"#fff"},handle:{shadowBlur:3,shadowOffsetX:0,shadowOffsetY:2}},grid:{left:"10%",top:60,bottom:70,borderColor:"#ccc"},legend:{top:0,bottom:null,itemGap:10,textStyle:{color:dark_contrastColor}},textStyle:{color:dark_contrastColor},title:{left:0,top:0,textStyle:{color:"#EEF1FA"},subtextStyle:{color:"#B9B8CE"}},toolbox:{iconStyle:{borderColor:dark_contrastColor},padding:5,itemGap:8},dataZoom:{defaultLocationEdgeGap:7,borderRadius:3,borderColor:"#71708A",textStyle:{color:dark_contrastColor},brushStyle:{color:"rgba(135,163,206,0.3)"},handleStyle:{color:"#353450",borderColor:"#C5CBE3"},moveHandleStyle:{color:"#B0B6C3",opacity:.3},fillerColor:"rgba(135,163,206,0.2)",emphasis:{handleStyle:{borderColor:"#91B7F2",color:"#4D587D"},moveHandleStyle:{color:"#636D9A",opacity:.7}},dataBackground:{lineStyle:{color:"#71708A",width:.5},areaStyle:{color:"#71708A",opacity:.2}},selectedDataBackground:{lineStyle:{color:"#87A3CE",width:.5},areaStyle:{color:"#87A3CE",opacity:.2}}},visualMap:{textStyle:{color:dark_contrastColor},padding:5},timeline:{padding:5,itemStyle:{borderWidth:1},lineStyle:{color:dark_contrastColor},label:{color:dark_contrastColor},checkpointStyle:{borderWidth:2,shadowBlur:2,shadowOffsetX:1,shadowOffsetY:1},controlStyle:{color:dark_contrastColor,borderColor:dark_contrastColor,playIcon:"path://M31.6,53C17.5,53,6,41.5,6,27.4S17.5,1.8,31.6,1.8C45.7,1.8,57.2,13.3,57.2,27.4S45.7,53,31.6,53z M31.6,3.3 C18.4,3.3,7.5,14.1,7.5,27.4c0,13.3,10.8,24.1,24.1,24.1C44.9,51.5,55.7,40.7,55.7,27.4C55.7,14.1,44.9,3.3,31.6,3.3z M24.9,21.3 c0-2.2,1.6-3.1,3.5-2l10.5,6.1c1.899,1.1,1.899,2.9,0,4l-10.5,6.1c-1.9,1.1-3.5,0.2-3.5-2V21.3z",stopIcon:"path://M30.9,53.2C16.8,53.2,5.3,41.7,5.3,27.6S16.8,2,30.9,2C45,2,56.4,13.5,56.4,27.6S45,53.2,30.9,53.2z M30.9,3.5C17.6,3.5,6.8,14.4,6.8,27.6c0,13.3,10.8,24.1,24.101,24.1C44.2,51.7,55,40.9,55,27.6C54.9,14.4,44.1,3.5,30.9,3.5z M36.9,35.8c0,0.601-0.4,1-0.9,1h-1.3c-0.5,0-0.9-0.399-0.9-1V19.5c0-0.6,0.4-1,0.9-1H36c0.5,0,0.9,0.4,0.9,1V35.8z M27.8,35.8 c0,0.601-0.4,1-0.9,1h-1.3c-0.5,0-0.9-0.399-0.9-1V19.5c0-0.6,0.4-1,0.9-1H27c0.5,0,0.9,0.4,0.9,1L27.8,35.8L27.8,35.8z",nextIcon:"M2,18.5A1.52,1.52,0,0,1,.92,18a1.49,1.49,0,0,1,0-2.12L7.81,9.36,1,3.11A1.5,1.5,0,1,1,3,.89l8,7.34a1.48,1.48,0,0,1,.49,1.09,1.51,1.51,0,0,1-.46,1.1L3,18.08A1.5,1.5,0,0,1,2,18.5Z",prevIcon:"M10,.5A1.52,1.52,0,0,1,11.08,1a1.49,1.49,0,0,1,0,2.12L4.19,9.64,11,15.89a1.5,1.5,0,1,1-2,2.22L1,10.77A1.48,1.48,0,0,1,.5,9.68,1.51,1.51,0,0,1,1,8.58L9,.92A1.5,1.5,0,0,1,10,.5Z",borderWidth:1}},calendar:{itemStyle:{color:dark_backgroundColor},dayLabel:{margin:"50%",color:dark_contrastColor},monthLabel:{margin:5,color:dark_contrastColor},yearLabel:{margin:30,color:dark_contrastColor}},bar:{defaultBarGap:"20%",select:{itemStyle:{borderWidth:1}}},funnel:{bottom:60,select:{itemStyle:{borderWidth:1}}},line:{symbolSize:4,symbol:"circle"},pictorialBar:{select:{itemStyle:{borderWidth:1}}},pie:{radius:[0,"75%"],labelLine:{length2:15}},treemap:{left:"center",top:"middle",width:"80%",height:"80%",scaleLimit:{max:null,min:null},breadcrumb:{top:"bottom",bottom:null}},graph:{color:dark_colorPalette},gauge:{axisLine:{lineStyle:{color:[[1,"#35334d"]]}},title:{color:dark_contrastColor}},candlestick:{itemStyle:{color:"#FD1050",color0:"#0CF49B",borderColor:"#FD1050",borderColor0:"#0CF49B"}}};dark_theme.categoryAxis.splitLine.show=!1,echarts.registerTheme("dark",dark_theme);';

        this.adapter = adapter;

        // SSE client registry: stateId -> Set of active response objects
        this.sseClients = new Map();
        // SSE polling intervals: stateId -> interval handle
        this.ssePollingIntervals = new Map();

        this.adapter.log.info(`Install extension on /${this.name}`);

        this.app.use(`/${this.name}`, (req, res) => {
            this.eCharts(req, res);
        });
    }

    /**
     * Returns the MIME type for a given file path based on its extension.
     *
     * @param {string} filePath Path to the file
     * @returns {string} MIME type string
     */
    static getMimeType(filePath) {
        switch (path.extname(filePath)) {
            case '.html':
                return 'text/html';
            case '.js':
                return 'application/javascript';
            case '.css':
                return 'text/css';
            case '.json':
                return 'application/json';
            case '.png':
                return 'image/png';
            case '.jpg':
                return 'image/jpg';
            case '.gif':
                return 'image/gif';
            case '.svg':
                return 'image/svg+xml';
            default:
                return 'application/octet-stream';
        }
    }

    /**
     * @param {Buffer} content  html content
     * @param {string} queryDM  dark mode setting: 'off', 'on', or 'auto'
     * @returns {Buffer} modified html content
     */
    applyDarkmode(content, queryDM) {
        if (queryDM == 'on') {
            // Switch to dark mode permanently
            content = Buffer.from(content.toString().replace(this.rxDMdefault, this.strDMdark));
        }
        if (queryDM == 'auto') {
            // Align dark mode to system setting
            content = Buffer.from(content.toString().replace(this.rxDMdefault, this.strDMauto));
        }
        return content;
    }

    /**
     * @param {Buffer} content html content
     * @param {string} userFct Definition of user function
     */
    applyUserFunctions(content, userFct) {
        const r = userFct.replaceAll(/\$/g, '$$$$'); // Mask '$' (by replacing it with $$) to avoid evaluation in following replacement action
        if (r.length > 0) {
            content = Buffer.from(content.toString().replace(this.rxUserFct, r + this.rxUserFctPlain));
        }
        return content;
    }

    /**
     * @param {Buffer} content html content
     * @param {Array}  themeDef Definition of theme: [name, stringifiedThemeJson]
     */
    applyTheme(content, themeDef) {
        if (typeof themeDef[0] == 'string' && typeof themeDef[1] == 'string') {
            const r = themeDef[1].replaceAll(/\$/g, '$$$$'); // Mask '$' (by replacing it with $$) to avoid evaluation in following replacement action
            const themeName = themeDef[0];
            if (r.length > 0) {
                if (r.includes('registerTheme')) {
                    // Full definition and registration of theme received
                    content = Buffer.from(content.toString().replace(this.rxUserFct, r + this.rxUserFctPlain));
                } else {
                    // JSON object of parameters of theme received
                    const f = `echarts.registerTheme("${themeName}",${r});`; // Function to register theme
                    content = Buffer.from(content.toString().replace(this.rxUserFct, f + this.rxUserFctPlain));
                }
            }
        } else {
            this.adapter.log.error(
                'Could not evaluate definition of theme (json). Pls. provide as array of Strings [nameOfTheme, themeAsStrignifiedJson]',
            );
        }
        return content;
    }

    /**
     * Process an array result (from script callback or parsed state value).
     * [0]  => stringified chart options
     * [>0] => string: definition of user function(s)
     * [>0] => array[2]: theme definition [name, stringifiedThemeJson]
     *
     * @param {Buffer} content html content
     * @param {Array}  arr     array of strings/arrays as described above
     */
    processArrayResult(content, arr) {
        if (arr.length > 0 && typeof arr[0] == 'string') {
            // Process chart options
            const r = arr[0].replaceAll(/\$/g, '$$$$'); // Mask '$' (by replacing it with $$) to avoid evaluation in following replacement action
            content = Buffer.from(content.toString().replace(this.rxChart, r));
        }
        for (let i = 1; i < arr.length; i++) {
            if (typeof arr[i] == 'string') {
                // Process definition of user defined functions
                content = this.applyUserFunctions(content, arr[i]);
            } else if (Array.isArray(arr[i]) && arr[i].length == 2) {
                // Process definition of theme ([name, stringifiedThemeJson])
                content = this.applyTheme(content, arr[i]);
            } else {
                // Format of provided parameters is not supported
                this.adapter.log.error(
                    `Could not evaluate definition of user defined function(s). Parameter #${String(i)} Pls. refer to Readme.`,
                );
            }
        }
        return content;
    }

    /**
     * SSE handler: subscribes to a state and pushes a reload event to the browser when it changes.
     * Activated by URL /flexcharts/events?source=state&id=<stateId>
     * For source=script, use &triggerid=<stateId> to specify a dedicated trigger state.
     *
     * @param {object} req Express request object
     * @param {object} res Express response object
     */
    sseEvents(req, res) {
        const query = {};
        ((req.url || '').split('?')[1] || '').split('&').forEach(p => {
            const pp = p.split('=');
            if (pp[0]) {
                query[pp[0]] = decodeURIComponent(pp[1] || '');
            }
        });

        // Determine which state to monitor
        let stateId = null;
        if (query.source === 'state' && query.id) {
            stateId = query.id;
        } else if (query.triggerid) {
            stateId = query.triggerid;
        }

        if (!stateId) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('SSE requires source=state&id=<stateId> or &triggerid=<stateId>', 'utf-8');
            return;
        }

        // Set SSE headers and send initial heartbeat
        req.socket.setTimeout(0); // Disable socket timeout — SSE connections are intentionally long-lived
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no', // Disable nginx/proxy response buffering
        });
        res.write(': connected\n\n');
        if (typeof res.flush === 'function') {
            res.flush(); // Flush through any compression middleware
        }

        // Periodic heartbeat to keep connection alive through any idle-connection timeout
        const heartbeat = setInterval(() => {
            try {
                res.write(': ping\n\n');
                if (typeof res.flush === 'function') {
                    res.flush();
                }
            } catch {
                clearInterval(heartbeat);
            }
        }, 15000);

        // Register client
        if (!this.sseClients.has(stateId)) {
            this.sseClients.set(stateId, new Set());
            // Poll for state changes: adapter.on('stateChange') is not available in web extension context
            let lastTs = 0;
            const poll = setInterval(async () => {
                if (!this.sseClients.has(stateId)) {
                    clearInterval(poll);
                    return;
                }
                try {
                    const state = await this.adapter.getForeignStateAsync(stateId);
                    const ts = state ? state.ts : 0;
                    if (ts > lastTs && lastTs > 0) {
                        const clients = this.sseClients.get(stateId);
                        if (clients) {
                            this.adapter.log.debug(
                                `SSE: state ${stateId} changed (ts=${ts}), notifying ${clients.size} client(s)`,
                            );
                            for (const res2 of clients) {
                                try {
                                    res2.write('data: {}\n\n');
                                    if (typeof res2.flush === 'function') {
                                        res2.flush();
                                    }
                                } catch {
                                    // Client already disconnected — will be cleaned up by its 'close' event
                                }
                            }
                        }
                    }
                    lastTs = ts;
                } catch {
                    // ignore transient errors
                }
            }, 1000);
            this.ssePollingIntervals.set(stateId, poll);
            this.adapter.log.debug(`SSE: polling started for state ${stateId}`);
        }
        this.sseClients.get(stateId).add(res);
        this.adapter.log.debug(`SSE: client connected for ${stateId}, total: ${this.sseClients.get(stateId).size}`);

        // Clean up when client disconnects
        req.on('close', () => {
            clearInterval(heartbeat);
            const clients = this.sseClients.get(stateId);
            if (clients) {
                clients.delete(res);
                this.adapter.log.debug(`SSE: client disconnected from ${stateId}, remaining: ${clients.size}`);
                if (clients.size === 0) {
                    this.sseClients.delete(stateId);
                    const poll = this.ssePollingIntervals.get(stateId);
                    if (poll) {
                        clearInterval(poll);
                        this.ssePollingIntervals.delete(stateId);
                    }
                    this.adapter.log.debug(`SSE: polling stopped for state ${stateId}`);
                }
            }
        });
    }

    /**
     * Main request handler: evaluates URL parameters, fetches chart data, and serves the modified echarts.html.
     *
     * @param {object} req Express request object
     * @param {object} res Express response object
     */
    eCharts(req, res) {
        // Route SSE event requests to dedicated handler
        if (req.url && req.url.split('?')[0] === '/events') {
            this.sseEvents(req, res);
            return;
        }

        this.adapter.log.debug(`Request for ${req.url}`);

        const parts = (req.url || '').split('?');
        const url = parts[0].replace('/', this.pd);
        const query = {};
        let queryDM = 'off'; // Query for dark mode ('off', 'on' or 'auto'). 'auto' => Using system setting. Defaults to 'off'.
        let queryThemeV5 = false; // Query to use theme 'v5' as default theme. true => Use 'v5' theme

        (parts[1] || '').split('&').forEach(p => {
            const pp = p.split('=');
            if (pp[0]) {
                query[pp[0]] = decodeURIComponent(pp[1] || '');
            }
        });

        if (String(query.refresh) == '') {
            query.refresh = 60;
        } // Default value
        if (query.refresh && query.refresh >= 0 && query.refresh < 5) {
            query.refresh = 5;
        } // Minimum value

        // Evaluate query for dark mode. Maintain backward compatibility, i.e. apply dark mode if parameter "darkmode" is given w/o a value.
        if ('darkmode' in query) {
            switch (String(query.darkmode)) {
                case 'off':
                    queryDM = 'off';
                    break;
                case '':
                    queryDM = 'on';
                    break;
                case 'on':
                    queryDM = 'on';
                    break;
                case 'auto':
                    queryDM = 'auto';
                    break;
                default:
                    queryDM = 'off';
            }
        }

        if ('themev5' in query) {
            queryThemeV5 = true;
        }

        // Extract path of file from provided URL
        const filePath = `${this.path + this.pd}www${url}`;
        this.adapter.log.debug(`filePath = ${filePath}`);
        this.adapter.log.debug(`query    = ${JSON.stringify(query)}`);

        // Select MIME-type
        const contentType = ExtensionFlexcharts.getMimeType(filePath);

        // Read file
        fs.readFile(filePath, (error, content) => {
            if (error) {
                if (error.code == 'ENOENT') {
                    // File not found
                    this.adapter.log.debug(`File not found!`);
                    fs.readFile(`${this.path + this.pd}www${this.pd}404.html`, (error404, content404) => {
                        this.adapter.log.debug(`View 404-page ...`);
                        this.adapter.log.debug(JSON.stringify(error404));
                        res.writeHead(404, { 'Content-Type': 'text/html' });
                        res.end(content404, 'utf-8');
                    });
                } else {
                    // Unknown error
                    res.writeHead(500);
                    res.end(`Server Error: ${error.code}`);
                }
                return;
            }

            // Serve static files (js, css, ...) directly without any processing
            if (!req.url || !req.url.includes('echarts.html')) {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content, 'utf-8');
                return;
            }

            // Apply optional refresh and v5 theme to html content
            const applyCommonOptions = cnt => {
                if (query.refresh && query.refresh >= 5) {
                    cnt = Buffer.from(
                        cnt.toString().replace(this.rxRefresh, `${this.strRefresh + String(query.refresh)}"`),
                    );
                }
                if (queryThemeV5) {
                    cnt = this.applyUserFunctions(cnt, this.strThemeV5);
                    cnt = this.applyUserFunctions(cnt, this.strThemeV5Dark);
                }
                return cnt;
            };

            // echarts.html requested: process chart data based on source parameter
            if (!query.source) {
                // No source given: show default demo chart
                res.writeHead(200, { 'Content-Type': contentType });
                let cnt = Buffer.from(content.toString().replace(this.rxChart, JSON.stringify(demoChart())));
                cnt = this.applyDarkmode(cnt, queryDM);
                res.end(cnt, 'utf-8');
                return;
            }

            switch (query.source) {
                case 'script': {
                    const message = query.message || 'flexcharts';
                    this.adapter.sendTo(
                        'javascript.0',
                        'toScript',
                        { message: message, data: query },
                        result => {
                            if (result.error) {
                                // Callback returned an error => show a demo chart
                                this.adapter.log.debug(result.error);
                                res.writeHead(200, { 'Content-Type': contentType });
                                let cnt = Buffer.from(
                                    content.toString().replace(this.rxChart, JSON.stringify(demoChart())),
                                );
                                cnt = this.applyDarkmode(cnt, queryDM);
                                res.end(cnt, 'utf-8');
                            } else if (result && result == 'Error: Timeout exceeded') {
                                // sendTo timed out
                                res.writeHead(200, { 'Content-Type': contentType });
                                res.end(
                                    Buffer.from(
                                        'ERROR: Request to javascript.0 timed out! Is your script running? Is the "message" in onMessage() and html-request matching? Default-message is "flexcharts"',
                                    ),
                                    'utf-8',
                                );
                            } else {
                                // Callback ok => analyze its result
                                this.adapter.log.debug(result);
                                res.writeHead(200, { 'Content-Type': contentType });
                                let cnt = applyCommonOptions(content);
                                if (typeof result == 'string') {
                                    // Script returned stringified chart options.
                                    // It's possible to include functions by using javascript-stringify, see
                                    // https://github.com/blakeembrey/javascript-stringify
                                    const r = result.replaceAll(/\$/g, '$$$$'); // Mask '$' (by replacing it with $$) to avoid evaluation in following replacement action
                                    cnt = Buffer.from(cnt.toString().replace(this.rxChart, r));
                                } else if (Array.isArray(result)) {
                                    // Script returned an array => assumption: this is an array of strings containing additional elements:
                                    //   [0] => String formatted chart options
                                    //   [>0] => if type string: String formatted definition of dynamic function(s)
                                    //   [>0] => if type array: Definition of theme: [name, stringifiedThemeJson] (optional)
                                    cnt = this.processArrayResult(cnt, result);
                                } else {
                                    // Script returned chart options as JSON object.
                                    // Use standard JSON.stringify() to convert it to a String
                                    cnt = Buffer.from(cnt.toString().replace(this.rxChart, JSON.stringify(result)));
                                }
                                cnt = this.applyDarkmode(cnt, queryDM);
                                res.end(cnt, 'utf-8');
                            }
                        },
                        { timeout: 2000 },
                    );
                    break;
                }
                case 'state': {
                    if (!query.id) {
                        res.writeHead(400, { 'Content-Type': 'text/plain' });
                        res.end('Missing required parameter: id', 'utf-8');
                        break;
                    }
                    this.adapter.getForeignState(query.id, (error, result) => {
                        if (result && result.val) {
                            this.adapter.log.debug(result.val);
                            res.writeHead(200, { 'Content-Type': contentType });
                            let cnt = applyCommonOptions(content);
                            if (typeof result.val == 'string') {
                                const r = result.val.replaceAll(/\$/g, '$$$$'); // Mask '$' (by replacing it with $$) to avoid evaluation in following replacement action
                                let rp = null;
                                try {
                                    rp = JSON.parse(r);
                                } catch {
                                    this.adapter.log.debug(
                                        `Could not parse content of state ${query.id}. Using its content as String.`,
                                    );
                                    rp = r;
                                }
                                if (Array.isArray(rp)) {
                                    // State contains an array => assumption: this is an array of strings containing additional elements:
                                    //   [0] => String formatted chart options
                                    //   [>0] => if type string: String formatted definition of dynamic function(s)
                                    //   [>0] => if type array: Definition of theme: [name, stringifiedThemeJson] (optional)
                                    this.adapter.log.debug(
                                        `Content of state ${query.id} was parsed as Array. Assumption: Got Array of Strings.`,
                                    );
                                    cnt = this.processArrayResult(cnt, rp);
                                } else {
                                    // State contains a String and must not be parsed => use content of r
                                    cnt = Buffer.from(cnt.toString().replace(this.rxChart, r));
                                }
                            } else {
                                // State contains a JSON object
                                cnt = Buffer.from(cnt.toString().replace(this.rxChart, JSON.stringify(result.val)));
                            }
                            cnt = this.applyDarkmode(cnt, queryDM);
                            res.end(cnt, 'utf-8');
                        } else {
                            res.writeHead(200, { 'Content-Type': contentType });
                            res.end(Buffer.from(`Could not read state id ${query.id}`), 'utf-8');
                        }
                    });
                    break;
                }
                default: {
                    res.writeHead(200, { 'Content-Type': contentType });
                    let cnt = Buffer.from(content.toString().replace(this.rxChart, JSON.stringify(demoChartGauge())));
                    cnt = this.applyDarkmode(cnt, queryDM);
                    res.end(cnt, 'utf-8');
                    break;
                }
            }
        });
    }
}

module.exports = ExtensionFlexcharts;
