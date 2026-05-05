// flexchartsTemplate3.js

/*
   Stacked bar chart with a custom tooltip formatter function

   Demonstrates how to include JavaScript functions in the chart definition.
   Standard JSON.stringify() cannot serialize functions — this template uses the
   npm module "javascript-stringify" to include a valueFormatter function in the
   chart options, which formats tooltip values to 2 decimal places.

   Preconditions:
    * Adapter flexcharts is running
    * This script is running on instance 0 of javascript adapter (javascript.0)
    * The npm module "javascript-stringify" has been added in the javascript adapter
      configuration under "Additional npm modules"
      (for further information see https://github.com/blakeembrey/javascript-stringify)

   Open in browser (replace localhost and 8082 with your ioBroker address and port):
     http://localhost:8082/flexcharts/echarts.html?source=script&message=mystackedchart

   Uses Apache ECharts: https://echarts.apache.org/en/index.html
*/

// 05.01.2025   MyHomeMyData

// javascript-stringify serializes JavaScript objects including functions.
// This is needed whenever the ECharts option contains function values
// (e.g. formatter, label callbacks), which standard JSON.stringify() would drop.
var strify = require('javascript-stringify');

// flexcharts calls this function whenever the browser requests the chart.
onMessage('mystackedchart', (httpParams, callback) => {
    const myJsonParams = (httpParams.myjsonparams ? JSON.parse(httpParams.myjsonparams) : {});
    console.log(`httpParams = ${JSON.stringify(httpParams)}`);
    console.log(`myJsonParams = ${JSON.stringify(myJsonParams)}`);
    chart1(result => callback(result));
});

function chart1(callback) {
    // ============================================================
    // STEP 1: Adapt the chart option to your needs.
    // The valueFormatter is a JavaScript function — it formats
    // tooltip values to 2 decimal places. Because it is a real
    // function (not a string), javascript-stringify is required
    // to transmit it to the browser (see strify.stringify below).
    // For a full reference of ECharts options see:
    //   https://echarts.apache.org/en/option.html
    // ============================================================
    const option = {
        tooltip: {
            trigger: 'axis',
            valueFormatter: (value) => value.toFixed(2)   // Function: formats numbers to 2 decimal places
        },
        legend: {},
        xAxis:    [{ type: 'category', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] }],
        yAxis:    [{ type: 'value' }],
        dataZoom: [{ show: true, start: 0, end: 100 }],
        series: [
            { name: 'Grid',      type: 'bar', color: '#ff9999', stack: 'Supply',      data: [8,  19, 21, 50, 26,  0, 36] },
            { name: 'PV',        type: 'bar', color: '#ff0000', stack: 'Supply',      data: [30, 32, 20,  8, 33, 21, 36] },
            { name: 'Household', type: 'bar', color: '#66b3ff', stack: 'Consumption', data: [16, 12, 11, 13, 14,  9, 12] },
            { name: 'Heat pump', type: 'bar', color: '#006cd6', stack: 'Consumption', data: [22, 24, 30, 20, 22, 12, 25] },
            { name: 'Wallbox',   type: 'bar', color: '#0000ff', stack: 'Consumption', data: [0,  15,  0, 25, 23,  0, 35] }
        ]
    };

    // strify.stringify() serializes the option including the valueFormatter function.
    // flexcharts receives the result as a string, evaluates it in the browser,
    // and passes it to myChart.setOption() — this is how the function reaches ECharts.
    callback(strify.stringify(option));
}
