// flexchartsTemplate7.js

/*
   Gauge chart showing current state values — reactive update via SSE
   Beginner-friendly template: edit the CONFIGURATION section, then start the script.

   Suitable for displaying current readings such as:
   * Battery state of charge, PV power output
   * Heat pump temperatures, energy meter readings
   * Sensor values (temperature, humidity, pressure)

   How it works:
   1. This script subscribes to the state of each gauge value.
   2. Whenever a value changes, the script reads all current values and writes
      an updated chart definition to a single output state (chartStateId).
   3. flexcharts displays that output state. With &sse in the URL, the chart
      updates automatically in the browser whenever the output state changes —
      no page reload needed.

   Preconditions:
    * Adapter flexcharts is running
    * This script is running on instance 0 of javascript adapter (javascript.0)

   Open in browser (replace localhost and 8082 with your ioBroker address and port
   and chartStateId with the value you set in STEP 2):
     http://localhost:8082/flexcharts/echarts.html?source=state&id=0_userdata.0.flexcharts.gauges.chart&sse

   Multiple gauges are arranged automatically side by side.

   Uses Apache ECharts: https://echarts.apache.org/en/index.html
*/

// 2026-05-05   MyHomeMyData

// ============================================================
// STEP 1: Define your gauges
//
// For each gauge, set:
//   stateId — ioBroker state ID to read the current value from
//   name    — label shown below the gauge needle
//   min     — minimum value of the gauge scale
//   max     — maximum value of the gauge scale
//   unit    — unit shown inside the gauge (e.g. '%', 'kW', '°C')
//
//   color   — gauge arc color as hex code.
//              To use graduated colors depending on the value, replace the
//              color string with a thresholds array (see commented example below).
//              Each entry is [fraction of max, color]:
//              e.g. [[0.3, '#e05252'], [0.7, '#e0a030'], [1.0, '#52b452']]
//              → below 30 % of max: red, 30–70 %: orange, above 70 %: green
//
// Add or remove entries as needed. Up to 4 gauges fit well on one page.
// ============================================================
const myGauges = [
    { stateId: '0_userdata.0.battery.soc',       name: 'Battery',       min: 0, max: 100,   unit: '%',  color: '#52b452' },
    { stateId: '0_userdata.0.pv.power',          name: 'PV power',      min: 0, max: 10000, unit: 'W',  color: '#e0a030' },
    { stateId: '0_userdata.0.heatpump.flowtemp', name: 'Flow temp',     min: 0, max: 70,    unit: '°C', color: '#e05252' },
    // Example with graduated color thresholds:
    // { stateId: '0_userdata.0.battery.soc', name: 'Battery', min: 0, max: 100, unit: '%',
    //   thresholds: [[0.2, '#e05252'], [0.5, '#e0a030'], [1.0, '#52b452']] },
];

// ============================================================
// STEP 2: Set the output state where the chart definition is stored.
// This state is created automatically when the script starts.
// Use this state ID in the flexcharts URL above.
// ============================================================
const chartStateId = '0_userdata.0.flexcharts.gauges.chart';

// ============================================================
// STEP 3 (optional): Customize chart appearance
// ============================================================
const chartTitle = '';    // Chart title shown at the top — set to '' to hide
const decimals   = 1;    // Number of decimal places shown inside the gauge

// ============================================================
// No changes needed below this line
// ============================================================

// Create the output state if it does not exist yet, then build the initial chart.
// The output state stores the complete ECharts option as a JSON string.
// flexcharts reads this state and renders the chart — SSE detects every update automatically.
createState(chartStateId, '', { name: 'Gauge chart definition', type: 'string', role: 'json', read: true, write: true }, () => {
    buildAndSaveChart();
});

// Subscribe to all gauge states.
// Whenever any of them receives an acknowledged update, the chart is rebuilt.
// ack: true means the value comes from the device/adapter, not set by a script.
// Change to ack: false if your states are written by a script without acknowledgement.
for (const g of myGauges) {
    on({ id: g.stateId, ack: true }, () => {
        buildAndSaveChart();
    });
}

// Reads the current value of all gauge states synchronously, builds the chart option,
// and writes it to the output state. SSE will then notify the browser automatically.
function buildAndSaveChart() {
    const values = {};
    for (const g of myGauges) {
        // getState() reads the current value of a state synchronously.
        const state = getState(g.stateId);
        values[g.stateId] = (state && state.val !== null && state.val !== undefined) ? state.val : 0;
    }
    const option = buildChart(values);
    // Write the updated chart definition to the output state.
    // SSE detects this change and triggers a setOption() update in the browser.
    setState(chartStateId, JSON.stringify(option), true);
}

// Assembles the ECharts option object from the current gauge values.
// For a full reference of all available ECharts options see:
//   https://echarts.apache.org/en/option.html
function buildChart(values) {
    const n = myGauges.length;

    // Calculate position and size for each gauge so they fit side by side.
    // With 1 gauge: full width. With more gauges: split evenly across the page.
    const radius = Math.round(Math.min(42, 90 / n)) + '%';

    // Build one ECharts gauge series per entry in myGauges.
    const series = myGauges.map((g, i) => {
        const centerX = Math.round(100 * (i + 0.5) / n) + '%';
        const rawVal  = values[g.stateId];
        const val     = rawVal !== null ? +Number(rawVal).toFixed(decimals) : 0;

        // Color thresholds: if 'thresholds' is defined, use it for graduated coloring.
        // Otherwise use the single 'color' value for the full arc.
        // ECharts expects [[fraction_of_max, color], ...].
        const colorRanges = g.thresholds ? g.thresholds : [[1.0, g.color]];

        return {
            type:      'gauge',
            center:    [centerX, '60%'],
            radius:    radius,
            min:       g.min,
            max:       g.max,
            data:      [{ name: g.name, value: val }],
            axisLine:  { lineStyle: { width: 15, color: colorRanges } },  // Arc with color thresholds
            progress:  { show: true, width: 15 },                         // Filled arc up to current value
            pointer:   { show: true },                                     // Needle pointing to value
            detail:    { formatter: '{value} ' + g.unit, fontSize: 16, offsetCenter: [0, '70%'] },
            title:     { fontSize: 14, offsetCenter: [0, '95%'] },
            axisTick:  { distance: -18, length: 8 },
            splitLine: { distance: -22, length: 14 },
            axisLabel: { distance: -5, fontSize: 10 }
        };
    });

    return {
        title:  chartTitle ? { text: chartTitle, left: 'center' } : undefined,
        series: series
    };
}
