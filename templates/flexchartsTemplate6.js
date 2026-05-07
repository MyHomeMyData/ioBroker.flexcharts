// flexchartsTemplate6.js

/*
   Energy overview — stacked bar chart with data from history adapter
   Beginner-friendly template: edit the CONFIGURATION section, then start the script.

   Preconditions:
    * Adapter flexcharts is running
    * This script is running on instance 0 of javascript adapter (javascript.0)
    * ioBroker history adapter (history.0, sql.0, or influxdb.0) is running
      and recording your energy state values

   Open in browser (replace localhost and 8082 with your ioBroker address and port):
     http://localhost:8082/flexcharts/echarts.html?source=script&message=energychart

   Optional parameters:
     &days=30            Show the last 30 days (default: 30)
     &days=365           Show the last 365 days

   Auto-update with SSE when a state changes:
     http://localhost:8082/flexcharts/echarts.html?source=script&message=energychart&days=30&sse&triggerid=0_userdata.0.energy.trigger

   Uses Apache ECharts: https://echarts.apache.org/en/index.html
*/

// 2026-05-05   MyHomeMyData

// ============================================================
// STEP 1: Set your history adapter instance
// ============================================================
const historyInstance = 'history.0';    // Change to 'sql.0' or 'influxdb.0' if needed

// ============================================================
// STEP 2: Define your energy data series
//
// For each series, set:
//   stateId  — ioBroker state ID recorded by your history adapter
//   name     — label shown in the legend
//   color    — bar color as hex code
//   stack    — bars with the same stack name are stacked on top of each other.
//              Use the same stack name for supply sources and the same for loads.
//              Remove 'stack' or set it to '' to show a series as a standalone bar.
//
// Add or remove entries as needed.
// ============================================================
const mySeries = [
    { stateId: '0_userdata.0.energy.grid_import',   name: 'Grid import',  color: '#e05252', stack: 'supply'      },
    { stateId: '0_userdata.0.energy.pv_production', name: 'PV',           color: '#52b452', stack: 'supply'      },
    { stateId: '0_userdata.0.energy.household',     name: 'Household',    color: '#5b8dd9', stack: 'consumption' },
    { stateId: '0_userdata.0.energy.heat_pump',     name: 'Heat pump',    color: '#3a5fa0', stack: 'consumption' },
    // { stateId: '0_userdata.0.energy.wallbox',    name: 'Wallbox',      color: '#00a3a3', stack: 'consumption' },
    // { stateId: '0_userdata.0.energy.battery',    name: 'Battery',      color: '#e0a030', stack: ''            },
];

// ============================================================
// STEP 3 (optional): Customize chart appearance
// ============================================================
const chartTitle = 'Energy overview';
const yAxisUnit  = 'kWh';

// ============================================================
// No changes needed below this line
// ============================================================

// flexcharts calls this function whenever the browser requests the chart.
// httpParams contains the URL parameters, e.g. &days=30 becomes httpParams.days = '30'.
onMessage('energychart', (httpParams, callback) => {
    const days   = Math.max(1, parseInt(httpParams.days) || 30);
    const tStop  = new Date();
    const tStart = new Date(tStop.getFullYear(), tStop.getMonth(), tStop.getDate() - days);

    // We need to load history data for every series defined in mySeries above.
    // Since getHistory() works asynchronously (it returns immediately and calls
    // the callback later when the data is ready), we cannot simply wait in a loop.
    // Instead we count how many series have finished loading, and only build the
    // chart once ALL of them are done.
    const seriesData = {};  // Stores the loaded data, keyed by stateId
    let loaded = 0;         // Counts how many series have finished loading

    for (const s of mySeries) {
        // Request historical data from the history adapter for one series.
        // The result is an array of data points, each with a timestamp (ts) and a value (val).
        getHistory(historyInstance, {
            id:        s.stateId,
            start:     tStart.getTime(),    // Start of time range (milliseconds)
            end:       tStop.getTime(),     // End of time range (milliseconds)
            ack:       true,
            count:     100000,
            aggregate: 'none'              // Return raw values, no aggregation
        }, (err, result) => {
            if (err) {
                console.warn(`energychart: could not read history for ${s.stateId}: ${JSON.stringify(err)}`);
                seriesData[s.stateId] = [];
            } else {
                // Convert each data point from {ts, val} to [date, value] as required by ECharts.
                // startOfDay() normalizes the timestamp to midnight so that bars are aligned by day.
                seriesData[s.stateId] = result.map(p => [startOfDay(new Date(p.ts)), p.val]);
            }
            loaded++;
            if (loaded === mySeries.length) {
                // All series loaded — now build and return the chart definition.
                buildChart(seriesData, callback);
            }
        });
    }
});

// Assembles the ECharts option object and passes it back to flexcharts via callback().
// flexcharts forwards this object to Apache ECharts in the browser, which renders the chart.
// For a full reference of all available ECharts options see:
//   https://echarts.apache.org/en/option.html
function buildChart(seriesData, callback) {
    const option = {
        title:   { text: chartTitle, left: 'center' },
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },  // Tooltip on hover
        legend:  { top: '8%' },                                          // Legend below title
        toolbox: { feature: { dataZoom: { yAxisIndex: 'none' }, saveAsImage: {} } },  // Zoom and save buttons
        xAxis:   { type: 'time' },                                       // Time axis (dates)
        yAxis:   { type: 'value', name: yAxisUnit, axisLabel: { formatter: `{value} ${yAxisUnit}` } },
        dataZoom: [{ type: 'inside' }, { type: 'slider' }],             // Scrollable zoom

        // Build the series array from mySeries.
        // For each entry in mySeries, this creates one bar series for ECharts.
        // The historical data loaded above is assigned via seriesData[s.stateId].
        // Series sharing the same 'stack' value are stacked on top of each other.
        series: mySeries.map(s => ({
            name:  s.name,
            type:  'bar',
            color: s.color,
            stack: s.stack || '',
            data:  seriesData[s.stateId] || []  // Use empty array if loading failed
        }))
    };
    callback(option);
}

// Returns midnight of the given date — used to align all data points to the start of their day.
function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
