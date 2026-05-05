// flexchartsTemplate7.js

/*
   Gauge chart showing current state values
   Beginner-friendly template: edit the CONFIGURATION section, then start the script.

   Suitable for displaying current readings such as:
   * Fill levels (oil tank, water tank, battery)
   * Meter readings (power, gas, water)
   * Sensor values (temperature, humidity, pressure)

   Multiple gauges are arranged automatically side by side.

   Preconditions:
    * Adapter flexcharts is running
    * This script is running on instance 0 of javascript adapter (javascript.0)

   Open in browser (replace localhost and 8082 with your ioBroker address and port):
     http://localhost:8082/flexcharts/echarts.html?source=script&message=gaugechart

   Auto-update with SSE when a state changes:
     http://localhost:8082/flexcharts/echarts.html?source=script&message=gaugechart&sse&triggerid=0_userdata.0.gauges.trigger

   Uses Apache ECharts: https://echarts.apache.org/en/index.html
*/

// 2026-05-05   MyHomeMyData

// ============================================================
// STEP 1: Define your gauges
//
// For each gauge, set:
//   stateId — ioBroker state ID to read the current value from
//   name    — label shown below the gauge
//   min     — minimum value of the gauge scale
//   max     — maximum value of the gauge scale
//   unit    — unit shown inside the gauge (e.g. '%', 'kW', '°C')
//
//   color   — gauge arc color as hex code.
//              To use multiple colors depending on the value (e.g. red/yellow/green),
//              replace the color string with a thresholds array:
//              thresholds: [[0.3, '#e05252'], [0.7, '#e0a030'], [1.0, '#52b452']]
//              Each entry is [fraction of max, color]. Values below 30% → red,
//              30–70% → orange, above 70% → green. Adapt to your needs.
//
// Add or remove entries as needed. Up to 4 gauges fit well on one page.
// ============================================================
const myGauges = [
    { stateId: '0_userdata.0.tanks.oil',      name: 'Oil tank',      min: 0, max: 100,  unit: '%',  color: '#e05252' },
    { stateId: '0_userdata.0.tanks.water',    name: 'Water tank',    min: 0, max: 100,  unit: '%',  color: '#5b8dd9' },
    { stateId: '0_userdata.0.meters.power',   name: 'Current power', min: 0, max: 5000, unit: 'W',  color: '#52b452' },
    // { stateId: '0_userdata.0.sensors.temp', name: 'Temperature',  min: -10, max: 50,  unit: '°C', color: '#e0a030' },
];

// ============================================================
// STEP 2 (optional): Customize chart appearance
// ============================================================
const chartTitle  = '';       // Chart title shown at the top — set to '' to hide
const decimals    = 1;        // Number of decimal places shown inside the gauge

// ============================================================
// No changes needed below this line
// ============================================================

// flexcharts calls this function whenever the browser requests the chart.
// It reads the current value of each gauge's state and then builds the chart.
onMessage('gaugechart', (httpParams, callback) => {
    const values = {};
    let loaded = 0;

    // Read the current value of each gauge's state.
    // getForeignState() works asynchronously: it returns immediately and calls
    // the callback later when the value is available. We count completed reads
    // and build the chart only once ALL states have been read.
    for (const g of myGauges) {
        getForeignState(g.stateId, (err, state) => {
            if (err || !state) {
                console.warn(`gaugechart: could not read state ${g.stateId}`);
                values[g.stateId] = null;
            } else {
                values[g.stateId] = state.val;
            }
            loaded++;
            if (loaded === myGauges.length) {
                // All states read — build and return the chart definition.
                buildChart(values, callback);
            }
        });
    }
});

// Assembles the ECharts option object and passes it back to flexcharts via callback().
// flexcharts forwards this object to Apache ECharts in the browser, which renders the chart.
// For a full reference of all available ECharts options see:
//   https://echarts.apache.org/en/option.html
function buildChart(values, callback) {
    const n = myGauges.length;

    // Calculate position and size for each gauge so they fit side by side.
    // With 1 gauge: full width. With more gauges: split evenly across the page.
    const radius = Math.round(Math.min(42, 90 / n)) + '%';

    // Build one ECharts gauge series per entry in myGauges.
    const series = myGauges.map((g, i) => {
        const centerX = Math.round(100 * (i + 0.5) / n) + '%';
        const rawVal  = values[g.stateId];
        const val     = rawVal !== null && rawVal !== undefined ? +rawVal.toFixed(decimals) : 0;

        // Color thresholds: if 'color' is a string, use it as a single solid color.
        // If 'thresholds' is defined, use it for graduated coloring.
        // ECharts expects thresholds as [[fraction_of_max, color], ...].
        const colorRanges = g.thresholds
            ? g.thresholds
            : [[1.0, g.color]];

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
            detail:    { formatter: `{value} ${g.unit}`, fontSize: 16, offsetCenter: [0, '70%'] },
            title:     { fontSize: 14, offsetCenter: [0, '95%'] },
            axisTick:  { distance: -18, length: 8 },
            splitLine: { distance: -22, length: 14 },
            axisLabel: { distance: -5, fontSize: 10 }
        };
    });

    const option = {
        title:  chartTitle ? { text: chartTitle, left: 'center' } : undefined,
        series: series
    };
    callback(option);
}
