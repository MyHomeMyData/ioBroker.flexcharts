// flexchartsTemplate1.js

/*
   History chart — stacked bar with multiple series and time periods

   Reads data from the ioBroker history adapter and shows it as a stacked bar chart.
   Supports daily, monthly and yearly aggregation, selectable via URL parameter.

   Preconditions:
    * Adapter flexcharts is running
    * This script is running on instance 0 of javascript adapter (javascript.0)
    * ioBroker history adapter (history.0, sql.0, or influxdb.0) is running
      and recording the state values listed in mySeries below

   Open in browser (replace localhost and 8082 with your ioBroker address and port):
     Daily values, last 14 days:   http://localhost:8082/flexcharts/echarts.html?source=script&message=flexchartsdemo&chart=demoChart&params={"period":"daily","start":14}
     Monthly values, last 6 months: http://localhost:8082/flexcharts/echarts.html?source=script&message=flexchartsdemo&chart=demoChart&params={"period":"monthly","start":6}
     Yearly values, last 3 years:   http://localhost:8082/flexcharts/echarts.html?source=script&message=flexchartsdemo&chart=demoChart&params={"period":"yearly","start":3}

   Implemented periods: "daily", "monthly", "yearly"

   Uses Apache ECharts: https://echarts.apache.org/en/index.html
*/

// 06.11.2024   MyHomeMyData

// ============================================================
// STEP 1: Set your history adapter instance
// ============================================================
const instanceHistory = 'history.0';   // Change to 'sql.0' or 'influxdb.0' if needed

// ============================================================
// STEP 2: Register chart functions
// Add additional chart functions here and register them in chartsDict.
// Each function receives (params, callback) and must call callback(option).
// ============================================================
const chartsDict = { demoChart: { func: demoChart }
                   // Add additional charts here, e.g.:
                   // myOtherChart: { func: myOtherChart }
                   };

// ============================================================
// STEP 3: Define allowed URL parameters
// Only parameter keys listed here are accepted from the URL.
// ============================================================
const paramKeysAllowed = ['period', 'start'];

const DEBUG = 1;    // Set to 0 to suppress extra log entries

// The framework configuration above is complete.
// STEP 4: Define your series data inside demoChart() below.
// STEP 5 (optional): Adapt the chart layout in doChart() inside demoChart().

// flexcharts calls this function whenever the browser requests a chart.
// httpParams contains all URL parameters, e.g. &chart=demoChart&params={"period":"daily","start":14}.
onMessage('flexchartsdemo', (httpParams, callback) => {
    const chart  = httpParams.chart;
    const params = (httpParams.params ? JSON.parse(httpParams.params) : {});

    // Reject unknown URL parameter keys to prevent misuse
    for (const p of Object.keys(params)) {
        if (!paramKeysAllowed.includes(p)) {
            console.error('Received invalid parameter key "' + String(p) + '". Aborting.');
            if (DEBUG > 0) console.log('Received invalid parameter key. Created error chart. Received parameters: ' + JSON.stringify(params));
            errorChart(callback);
            return;
        }
    }

    if (chart in chartsDict) {
        chartsDict[chart].func(params, callback);
        if (DEBUG > 0) console.log('Created requested chart. Received parameters: ' + JSON.stringify(params));
    } else {
        demoChartDefault(callback);
        if (DEBUG > 0) console.log('Unknown chart type "' + String(chart) + '". Created default demo chart.');
    }
});

function demoChart(params, callback) {
    // ============================================================
    // STEP 4: Define your data series for each time period.
    // Each entry needs:
    //   stateID    — ioBroker state ID recorded by your history adapter
    //   name       — label shown in the legend
    //   type       — 'bar' or 'line'
    //   yAxisIndex — 0 = left y-axis, 1 = right y-axis
    //   color      — color as hex code
    //   stack      — bars with the same stack name are stacked on top of each other;
    //                set to '' for a standalone bar or line
    //   set        — internal key used to match loaded data to the series (must be unique)
    // ============================================================
    const mySeries = {
        daily: [
            { stateID: '0_userdata.0.flexcharts.a1.perDay', name: 'a1', type: 'bar',  yAxisIndex: 0, color: '#ff0000', stack: 'stack_a', set: 'a1'   },
            { stateID: '0_userdata.0.flexcharts.a2.perDay', name: 'a2', type: 'bar',  yAxisIndex: 0, color: '#a30000', stack: 'stack_a', set: 'a2'   },
            { stateID: '0_userdata.0.flexcharts.b1.perDay', name: 'b1', type: 'bar',  yAxisIndex: 0, color: '#00ff00', stack: 'stack_b', set: 'b1'   },
            { stateID: '0_userdata.0.flexcharts.b2.perDay', name: 'b2', type: 'bar',  yAxisIndex: 0, color: '#00a300', stack: 'stack_b', set: 'b2'   },
            { stateID: '0_userdata.0.flexcharts.c1.perDay', name: 'c1', type: 'line', yAxisIndex: 1, color: '#0000ff', stack: '',        set: 'line' }
        ],
        monthly: [
            { stateID: '0_userdata.0.flexcharts.a1.perMonth', name: 'a1', type: 'bar',  yAxisIndex: 0, color: '#ff0000', stack: 'stack_a', set: 'a1'   },
            { stateID: '0_userdata.0.flexcharts.a2.perMonth', name: 'a2', type: 'bar',  yAxisIndex: 0, color: '#a30000', stack: 'stack_a', set: 'a2'   },
            { stateID: '0_userdata.0.flexcharts.b1.perMonth', name: 'b1', type: 'bar',  yAxisIndex: 0, color: '#00ff00', stack: 'stack_b', set: 'b1'   },
            { stateID: '0_userdata.0.flexcharts.b2.perMonth', name: 'b2', type: 'bar',  yAxisIndex: 0, color: '#00a300', stack: 'stack_b', set: 'b2'   },
            { stateID: '0_userdata.0.flexcharts.c1.perMonth', name: 'c1', type: 'line', yAxisIndex: 1, color: '#0000ff', stack: '',        set: 'line' }
        ],
        yearly: [
            { stateID: '0_userdata.0.flexcharts.a1.perYear', name: 'a1', type: 'bar',  yAxisIndex: 0, color: '#ff0000', stack: 'stack_a', set: 'a1'   },
            { stateID: '0_userdata.0.flexcharts.a2.perYear', name: 'a2', type: 'bar',  yAxisIndex: 0, color: '#a30000', stack: 'stack_a', set: 'a2'   },
            { stateID: '0_userdata.0.flexcharts.b1.perYear', name: 'b1', type: 'bar',  yAxisIndex: 0, color: '#00ff00', stack: 'stack_b', set: 'b1'   },
            { stateID: '0_userdata.0.flexcharts.b2.perYear', name: 'b2', type: 'bar',  yAxisIndex: 0, color: '#00a300', stack: 'stack_b', set: 'b2'   },
            { stateID: '0_userdata.0.flexcharts.c1.perYear', name: 'c1', type: 'line', yAxisIndex: 1, color: '#0000ff', stack: '',        set: 'line' }
        ]
    };

    // normalizeDict maps each period name to:
    //   func — a function that normalizes a timestamp to the start of its period
    //   mult — the multiplier used when calculating the start date by offset
    const normalizeDict = {
        daily:   { func: getBeginOfDay,   mult: { year: 0, month: 0, day: 1  } },
        monthly: { func: getBeginOfMonth, mult: { year: 0, month: 1, day: 0  } },
        yearly:  { func: getBeginOfYear,  mult: { year: 1, month: 0, day: 0  } }
    };

    // Evaluate requested period. Defaults to 'daily' for missing or invalid values.
    const period = (params.period && params.period in normalizeDict) ? params.period : 'daily';
    // Number of periods to look back. Defaults to 14.
    const start  = params.start ? params.start : 14;
    const tStart = getDateByOffset(new Date(), -start, normalizeDict[period].mult);
    const tStop  = new Date();

    // We need to load history data for every series defined in mySeries[period].
    // Since getHistory() works asynchronously, we count completed loads and
    // only build the chart once ALL series have finished loading.
    const dataDict = { cnt: 0 };    // Stores loaded data, keyed by series 'set' name
    for (const dataset of Object.values(mySeries[period])) {
        getHistData(instanceHistory, dataset.stateID, dataset.set, tStart, tStop, normalizeDict[period].func, function(err, set, data) {
            if (!err) {
                dataDict[set] = data;
                dataDict.cnt++;
            } else {
                console.log(JSON.stringify(err));
            }
            if (dataDict.cnt == mySeries[period].length) {
                // All series loaded — build and return the chart definition.
                doChart(mySeries[period], dataDict, period, callback);
            }
        });
    }

    // ============================================================
    // STEP 5 (optional): Adapt the chart layout.
    // Assembles the ECharts option object from the loaded data and passes it to flexcharts.
    // For a full reference of available ECharts options see: https://echarts.apache.org/en/option.html
    // ============================================================
    function doChart(mySeries, data, period, callback) {
        const option = {
            tooltip:  { trigger: 'axis', axisPointer: { type: 'shadow' } },
            legend:   { top: '10%' },
            title:    { text: 'Chart "' + String(period) + '" created by ' + scriptName + ' - refer to https://github.com/MyHomeMyData/ioBroker.flexcharts', left: 'center' },
            toolbox:  { feature: { dataZoom: { yAxisIndex: 'none' }, restore: {}, saveAsImage: {} } },
            xAxis:    { type: 'time', max: 'dataMax' },
            yAxis: [
                { type: 'value', position: 'left',  name: 'y-Axis stacks (unit)', alignTicks: true, axisLine: { show: true } },
                { type: 'value', position: 'right', name: 'y-Axis line (unit)',   alignTicks: true, axisLine: { show: true, lineStyle: { color: '#0000ff' } } }
            ],
            dataZoom: [{ type: 'inside', start: 0, end: 100 }, { start: data['dataZoom'], end: 100 }],
            series: []
        };
        // Build the series array: one entry per series defined in mySeries.
        // The loaded data is assigned via data[s.set].
        for (const s of Object.values(mySeries)) {
            option.series.push({ name: s.name, type: s.type, yAxisIndex: s.yAxisIndex, color: s.color, stack: s.stack, data: data[s.set] });
        }
        callback(option);
    }
}

// Retrieves historical data from the history adapter for a single state.
// Returns an array of [normalizedDate, value] pairs as required by ECharts.
function getHistData(idHist, id, set, tStart, tStop, normalizeDate, callback) {
    getHistory(idHist, {
        id:        id,
        start:     tStart.getTime(),
        end:       tStop.getTime(),
        ack:       true,
        count:     1000000,
        aggregate: 'none'
    }, function(err, result) {
        const data = [];
        for (const itm of Object.values(result)) {
            // normalizeDate aligns each timestamp to the start of its period (day/month/year)
            // so that bars for the same period are grouped correctly on the time axis.
            data.push([normalizeDate(new Date(itm.ts)), itm.val]);
        }
        callback(err, set, data);
    });
}

// Calculates a start date offset from a reference date.
// mult selects the unit: {day:1} moves by days, {month:1} by months, {year:1} by years.
function getDateByOffset(d = new Date(), adder = 0, mult = { year: 0, month: 0, day: 1 }) {
    return new Date(d.getFullYear() + mult.year * adder, d.getMonth() + mult.month * adder, d.getDate() + mult.day * adder);
}

// These functions normalize a date to the beginning of its period.
// Used to align all data points within the same period to a single x-axis position.
function getBeginOfDay(d = new Date())   { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function getBeginOfMonth(d = new Date()) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function getBeginOfYear(d = new Date())  { return new Date(d.getFullYear(), 0, 1); }

// Fallback chart shown when no matching chart name was found in the URL
function demoChartDefault(callback) {
    const data = [];
    for (let i = 0; i <= 100; i++) { let theta = (i / 100) * 360; let r = 5 * (1 + Math.sin((theta / 180) * Math.PI)); data.push([r, theta]); }
    const option = {
        title:    { text: 'Demo Chart: Two Value-Axes in Polar', left: 'center' },
        legend:   { data: ['line'], top: '5%' },
        polar:    {},
        tooltip:  { trigger: 'axis', axisPointer: { type: 'cross' } },
        angleAxis: { type: 'value', startAngle: 0 },
        radiusAxis: {},
        series: [{ coordinateSystem: 'polar', name: 'line', type: 'line', data: data }]
    };
    callback(option);
}

// Error chart shown when the URL contains invalid parameters
function errorChart(callback) {
    const option = {
        title: { text: 'Error Chart: Received invalid http parameters. Check the log.', left: 'center' },
        data: []
    };
    callback(option);
}
