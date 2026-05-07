// flexchartsTemplate4.js

/*
   Combined chart with event-driven interaction: line chart + dynamic pie chart

   Shows a line chart at the bottom and a pie chart at the top.
   When the user moves the mouse over the line chart, the pie chart updates
   to show the data distribution for the hovered time point.

   This template demonstrates two advanced flexcharts features:
   1. Shared dataset — multiple chart types reading from the same data source
   2. Event handler function — JavaScript code that reacts to chart interactions

   Preconditions:
    * Adapter flexcharts is running
    * This script is running on instance 0 of javascript adapter (javascript.0)
    * The npm module "javascript-stringify" has been added in the javascript adapter
      configuration under "Additional npm modules"
      (for further information see https://github.com/blakeembrey/javascript-stringify)

   Open in browser (replace localhost and 8082 with your ioBroker address and port):
     http://localhost:8082/flexcharts/echarts.html?source=script&message=demo_share_dataset

   Based on ECharts example "Share Dataset":
     https://echarts.apache.org/examples/en/editor.html?c=dataset-link

   Uses Apache ECharts: https://echarts.apache.org/en/index.html
*/

// 14.03.2025   MyHomeMyData

var strify = require('javascript-stringify');

// flexcharts calls this function whenever the browser requests the chart.
onMessage('demo_share_dataset', (httpParams, callback) => {
    demo_share_dataset(result => callback(result));
});

function demo_share_dataset(callback) {
    // ============================================================
    // STEP 1: Adapt the dataset to your own data.
    // The first row contains column headers, the remaining rows contain one data series each.
    // ============================================================
    // The chart option defines both chart types (line and pie) using a shared dataset.
    // The pie chart initially shows data for the year '2012'.
    // The event handler below updates it dynamically when the user hovers over the line chart.
    const option = {
        legend:  {},
        tooltip: { trigger: 'axis', showContent: false },
        dataset: {
            // First row contains column headers (years), remaining rows contain data per product.
            source: [
                ['product',         '2012', '2013', '2014', '2015', '2016', '2017'],
                ['Milk Tea',          56.5,   82.1,   88.7,   70.1,   53.4,   85.1],
                ['Matcha Latte',      51.1,   51.4,   55.1,   53.3,   73.8,   68.7],
                ['Cheese Cocoa',      40.1,   62.2,   69.5,   36.4,   45.2,   32.5],
                ['Walnut Brownie',    25.2,   37.1,   41.2,   18.0,   33.9,   49.1]
            ]
        },
        xAxis:  { type: 'category' },
        yAxis:  { gridIndex: 0 },
        grid:   { top: '55%' },
        series: [
            { type: 'line', smooth: true, seriesLayoutBy: 'row', emphasis: { focus: 'series' } },
            { type: 'line', smooth: true, seriesLayoutBy: 'row', emphasis: { focus: 'series' } },
            { type: 'line', smooth: true, seriesLayoutBy: 'row', emphasis: { focus: 'series' } },
            { type: 'line', smooth: true, seriesLayoutBy: 'row', emphasis: { focus: 'series' } },
            {
                type: 'pie', id: 'pie', radius: '30%', center: ['50%', '25%'],
                emphasis: { focus: 'self' },
                label: { formatter: '{b}: {@2012} ({d}%)' },
                encode: { itemName: 'product', value: '2012', tooltip: '2012' }
            }
        ]
    };

    // The event handler is JavaScript code that runs in the browser.
    // It listens for mouse movement over the line chart (updateAxisPointer event)
    // and updates the pie chart to show the data column matching the hovered x-axis position.
    //
    // This code must be passed as a string because it contains browser-side JavaScript
    // that references 'myChart' — a variable that only exists in the browser context.
    // flexcharts evaluates this string in the browser after the chart is initialized.
    //
    // Note: the code is minified to avoid issues with special characters in the string.
    const onEvent = 'myChart.on("updateAxisPointer",function(e){let t=e.axesInfo[0];if(t){let i=t.value+1;myChart.setOption({series:{id:"pie",label:{formatter:"{b}: {@["+i+"]} ({d}%)"},encode:{value:i,tooltip:i}}})}});';

    // flexcharts expects an array when both a chart option and event handlers are provided:
    //   [0] — the stringified chart option (via javascript-stringify to preserve functions)
    //   [1] — the event handler as a JavaScript string
    // flexcharts evaluates both in the browser after the chart is rendered.
    callback([strify.stringify(option), onEvent]);
}
