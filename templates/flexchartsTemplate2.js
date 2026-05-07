// flexchartsTemplate2.js

/*
   Simple line chart with data from the history adapter

   Reads raw data from the ioBroker history adapter and shows it as a line chart.
   The time range shown is defined by getTsStart() — by default: 1 day before script start.

   Preconditions:
    * Adapter flexcharts is running
    * This script is running on instance 0 of javascript adapter (javascript.0)
    * ioBroker history adapter (history.0, sql.0, or influxdb.0) is running
      and recording the state values listed in mySeries below

   Open in browser (replace localhost and 8082 with your ioBroker address and port):
     http://localhost:8082/flexcharts/echarts.html?source=script&message=mylinechart

   Auto-update with SSE when the tracked state changes:
     http://localhost:8082/flexcharts/echarts.html?source=script&message=mylinechart&sse&triggerid=0_userdata.0.flexcharts.mylinechartdata

   With &sse&triggerid=<stateId>, the chart reloads its data automatically whenever the
   specified state changes — no page reload, ECharts animations work smoothly.
   Use the same stateId as in mySeries below. For multiple tracked states, use any one of them
   or a dedicated trigger state that you update whenever new data is available.

   Uses Apache ECharts: https://echarts.apache.org/en/index.html
*/

// 06.11.2024   MyHomeMyData

// ============================================================
// STEP 1: Set your history adapter instance
// ============================================================
const instanceHistory = 'influxdb.0';   // Change to 'history.0' or 'sql.0' if needed

const tsScriptStart = new Date().getTime();   // Remember when the script started (used by getTsStart)

// flexcharts calls this function whenever the browser requests the chart.
onMessage('mylinechart', (httpParams, callback) => {
    lineChart(callback);
});

function lineChart(callback) {
    // ============================================================
    // STEP 2: Define your data series.
    // Each entry needs:
    //   stateID — ioBroker state ID recorded by your history adapter
    //   set     — internal key used to match loaded data to the series (must be unique)
    //   name    — label shown in the legend
    //   type    — 'line' or 'bar'
    //   color   — color as hex code
    // ============================================================
    const mySeries = [
        { stateID: '0_userdata.0.flexcharts.mylinechartdata', set: 'line1', name: 'line 1', type: 'line', color: '#ff0000' }
        // Add more series here, e.g.:
        // { stateID: '0_userdata.0.flexcharts.myotherdata', set: 'line2', name: 'line 2', type: 'line', color: '#0000ff' }
    ];

    const tsStart = getTsStart();
    const tsStop  = new Date().getTime();

    // We need to load history data for every series defined above.
    // Since getHistory() works asynchronously, we count completed loads and
    // only build the chart once ALL series have finished loading.
    const dataDict = { cnt: 0 };    // Stores loaded data, keyed by series 'set' name
    for (let i = 0; i < mySeries.length; i++) {
        getHistData(instanceHistory, mySeries[i].stateID, mySeries[i].set, tsStart, tsStop, function(err, set, data) {
            if (!err) {
                dataDict[set] = data;
                dataDict.cnt++;
            } else {
                console.log(JSON.stringify(err));
            }
            if (dataDict.cnt == mySeries.length) {
                // All series loaded — build and return the chart definition.
                doChart(dataDict, callback);
            }
        });
    }

    // ============================================================
    // STEP 3 (optional): Adapt the chart layout.
    // For a full reference of available ECharts options see: https://echarts.apache.org/en/option.html
    // ============================================================
    function doChart(data, callback) {
        const option = {
            tooltip:  { trigger: 'axis', axisPointer: { type: 'shadow' } },
            legend:   { top: '10%' },
            title:    { text: 'My line chart created by ' + scriptName + ' - refer to https://github.com/MyHomeMyData/ioBroker.flexcharts', left: 'center' },
            toolbox:  { feature: { dataZoom: { yAxisIndex: 'none' }, restore: {}, saveAsImage: {} } },
            xAxis:    { type: 'time' },
            yAxis:    [{ type: 'value', position: 'left', name: 'y-Axis (unit)', axisLine: { show: true } }],
            dataZoom: [{ type: 'inside', start: 0, end: 100 }, { start: data['dataZoom'], end: 100 }],
            series:   []
        };
        // Build the series array: one entry per series defined in mySeries.
        for (const s of Object.values(mySeries)) {
            option.series.push({ name: s.name, type: s.type, yAxisIndex: s.yAxisIndex, color: s.color, stack: s.stack, data: data[s.set] });
        }
        callback(option);
    }
}

// ============================================================
// STEP 4 (optional): Adapt the time range of the chart.
// Change the return value to control how far back the chart looks.
// ============================================================
function getTsStart() {
    return tsScriptStart - 1 * 24 * 3600 * 1000;   // 1 day before the script started
}

// Retrieves historical data from the history adapter for a single state.
// Returns an array of [date, value] pairs as required by ECharts.
function getHistData(idHist, id, set, tsStart, tsStop, callback) {
    getHistory(idHist, {
        id:        id,
        start:     tsStart,
        end:       tsStop,
        ack:       true,
        count:     1000000,
        aggregate: 'none'    // Return raw values without any aggregation
    }, function(err, result) {
        const data = [];
        for (const itm of Object.values(result)) {
            data.push([new Date(itm.ts), itm.val]);
        }
        callback(err, set, data);
    });
}
