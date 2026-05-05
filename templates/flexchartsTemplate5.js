// flexchartsTemplate5.js

/*
   Stacked area chart with custom themes and dynamic dark mode

   Demonstrates how to define and apply custom ECharts themes for light and dark mode.
   The theme switches automatically when the system's color scheme changes (darkmode=auto).

   Preconditions:
    * Adapter flexcharts (version 0.6.0 or newer) is running
    * This script is running on instance 0 of javascript adapter (javascript.0)

   Open in browser (replace localhost and 8082 with your ioBroker address and port):
     http://localhost:8082/flexcharts/echarts.html?source=script&message=theme&darkmode=auto

   darkmode parameter:
     darkmode=auto  — follows the system's light/dark mode setting automatically
     darkmode=on    — always use dark theme
     darkmode=off   — always use light theme (default)

   Custom themes can be created with the ECharts Theme Builder:
     https://echarts.apache.org/en/theme-builder.html
     → Select "JSON version" tab → Copy → paste as JSON.stringify(...) below

   Based on ECharts example "Stacked Area Chart":
     https://echarts.apache.org/examples/en/editor.html?c=area-stack
   Dynamic dark mode: https://echarts.apache.org/handbook/en/basics/release-note/v6-feature chapter "3. Dark Mode Support"

   Uses Apache ECharts: https://echarts.apache.org/en/index.html
*/

// 13.10.2025   MyHomeMyData

// flexcharts calls this function whenever the browser requests the chart.
onMessage('theme', (httpParams, callback) => {
    demo_theme_chart(result => callback(result));
});

function demo_theme_chart(callback) {
    // ============================================================
    // STEP 1: Adapt the chart option to your needs.
    // For a full reference of available ECharts options see: https://echarts.apache.org/en/option.html
    // ============================================================
    const option = {title:{text:"Stacked Area Chart"},tooltip:{trigger:"axis",axisPointer:{type:"cross",label:{backgroundColor:"#6a7985"}}},legend:{data:["Email","Union Ads","Video Ads","Direct","Search Engine"]},toolbox:{feature:{saveAsImage:{}}},xAxis:[{type:"category",boundaryGap:!1,data:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]}],yAxis:[{type:"value"}],series:[{name:"Email",type:"line",stack:"Total",areaStyle:{},emphasis:{focus:"series"},data:[120,132,101,134,90,230,210]},{name:"Union Ads",type:"line",stack:"Total",areaStyle:{},emphasis:{focus:"series"},data:[220,182,191,234,290,330,310]},{name:"Video Ads",type:"line",stack:"Total",areaStyle:{},emphasis:{focus:"series"},data:[150,232,201,154,190,330,410]},{name:"Direct",type:"line",stack:"Total",areaStyle:{},emphasis:{focus:"series"},data:[320,332,301,334,390,330,320]},{name:"Search Engine",type:"line",stack:"Total",label:{show:!0,position:"top"},areaStyle:{},emphasis:{focus:"series"},data:[820,932,901,934,1290,1330,1320]}]};

    // ============================================================
    // STEP 2 (optional): Replace the themes with your own.
    // Create themes at https://echarts.apache.org/en/theme-builder.html
    // → Select "JSON version" tab → Copy → paste as JSON.stringify(...) below.
    // ============================================================
    // Custom themes exported from the ECharts Theme Builder.
    // Each theme is a JSON object — paste your own theme JSON here to replace these examples.
    // myThemeJsonMacarons is used as the light ('default') theme.
    // myThemeJsonChalk is used as the dark theme.
    const myThemeJsonMacarons = {color:["#2ec7c9","#b6a2de","#5ab1ef","#ffb980","#d87a80","#8d98b3","#e5cf0d","#97b552","#95706d","#dc69aa","#07a2a4","#9a7fd1","#588dd5","#f5994e","#c05050","#59678c","#c9ab00","#7eb00a","#6f5553","#c14089"],backgroundColor:"rgba(0,0,0,0)",textStyle:{},title:{textStyle:{color:"#008acd"},subtextStyle:{color:"#aaaaaa"}},line:{itemStyle:{borderWidth:1},lineStyle:{width:2},symbolSize:3,symbol:"emptyCircle",smooth:!0},radar:{itemStyle:{borderWidth:1},lineStyle:{width:2},symbolSize:3,symbol:"emptyCircle",smooth:!0},bar:{itemStyle:{barBorderWidth:0,barBorderColor:"#ccc"}},pie:{itemStyle:{borderWidth:0,borderColor:"#ccc"}},scatter:{itemStyle:{borderWidth:0,borderColor:"#ccc"}},boxplot:{itemStyle:{borderWidth:0,borderColor:"#ccc"}},parallel:{itemStyle:{borderWidth:0,borderColor:"#ccc"}},sankey:{itemStyle:{borderWidth:0,borderColor:"#ccc"}},funnel:{itemStyle:{borderWidth:0,borderColor:"#ccc"}},gauge:{itemStyle:{borderWidth:0,borderColor:"#ccc"}},candlestick:{itemStyle:{color:"#d87a80",color0:"#2ec7c9",borderColor:"#d87a80",borderColor0:"#2ec7c9",borderWidth:1}},graph:{itemStyle:{borderWidth:0,borderColor:"#ccc"},lineStyle:{width:1,color:"#aaaaaa"},symbolSize:3,symbol:"emptyCircle",smooth:!0,color:["#2ec7c9","#b6a2de","#5ab1ef","#ffb980","#d87a80","#8d98b3","#e5cf0d","#97b552","#95706d","#dc69aa","#07a2a4","#9a7fd1","#588dd5","#f5994e","#c05050","#59678c","#c9ab00","#7eb00a","#6f5553","#c14089"],label:{color:"#eeeeee"}},map:{itemStyle:{areaColor:"#dddddd",borderColor:"#eeeeee",borderWidth:.5},label:{color:"#d87a80"},emphasis:{itemStyle:{areaColor:"rgba(254,153,78,1)",borderColor:"#444",borderWidth:1},label:{color:"rgb(100,0,0)"}}},geo:{itemStyle:{areaColor:"#dddddd",borderColor:"#eeeeee",borderWidth:.5},label:{color:"#d87a80"},emphasis:{itemStyle:{areaColor:"rgba(254,153,78,1)",borderColor:"#444",borderWidth:1},label:{color:"rgb(100,0,0)"}}},categoryAxis:{axisLine:{show:!0,lineStyle:{color:"#008acd"}},axisTick:{show:!0,lineStyle:{color:"#333"}},axisLabel:{show:!0,color:"#333"},splitLine:{show:!1,lineStyle:{color:["#eee"]}},splitArea:{show:!1,areaStyle:{color:["rgba(250,250,250,0.3)","rgba(200,200,200,0.3)"]}}},valueAxis:{axisLine:{show:!0,lineStyle:{color:"#008acd"}},axisTick:{show:!0,lineStyle:{color:"#333"}},axisLabel:{show:!0,color:"#333"},splitLine:{show:!0,lineStyle:{color:["#eee"]}},splitArea:{show:!0,areaStyle:{color:["rgba(250,250,250,0.3)","rgba(200,200,200,0.3)"]}}},logAxis:{axisLine:{show:!0,lineStyle:{color:"#008acd"}},axisTick:{show:!0,lineStyle:{color:"#333"}},axisLabel:{show:!0,color:"#333"},splitLine:{show:!0,lineStyle:{color:["#eee"]}},splitArea:{show:!0,areaStyle:{color:["rgba(250,250,250,0.3)","rgba(200,200,200,0.3)"]}}},timeAxis:{axisLine:{show:!0,lineStyle:{color:"#008acd"}},axisTick:{show:!0,lineStyle:{color:"#333"}},axisLabel:{show:!0,color:"#333"},splitLine:{show:!0,lineStyle:{color:["#eee"]}},splitArea:{show:!1,areaStyle:{color:["rgba(250,250,250,0.3)","rgba(200,200,200,0.3)"]}}},toolbox:{iconStyle:{borderColor:"#2ec7c9"},emphasis:{iconStyle:{borderColor:"#18a4a6"}}},legend:{textStyle:{color:"#333333"}},tooltip:{axisPointer:{lineStyle:{color:"#008acd",width:"1"},crossStyle:{color:"#008acd",width:"1"}}},timeline:{lineStyle:{color:"#008acd",width:1},itemStyle:{color:"#008acd",borderWidth:1},controlStyle:{color:"#008acd",borderColor:"#008acd",borderWidth:.5},checkpointStyle:{color:"#2ec7c9",borderColor:"#2ec7c9"},label:{color:"#008acd"},emphasis:{itemStyle:{color:"#a9334c"},controlStyle:{color:"#008acd",borderColor:"#008acd",borderWidth:.5},label:{color:"#008acd"}}},visualMap:{color:["#5ab1ef","#e0ffff"]},dataZoom:{backgroundColor:"rgba(47,69,84,0)",dataBackgroundColor:"#efefff",fillerColor:"rgba(182,162,222,0.2)",handleColor:"#008acd",handleSize:"100%",textStyle:{color:"#333333"}},markPoint:{label:{color:"#eeeeee"},emphasis:{label:{color:"#eeeeee"}}}};
    const myThemeJsonChalk    = {color:["#fc97af","#87f7cf","#f7f494","#72ccff","#f7c5a0","#d4a4eb","#d2f5a6","#76f2f2"],backgroundColor:"rgba(41,52,65,1)",textStyle:{},title:{textStyle:{color:"#ffffff"},subtextStyle:{color:"#dddddd"}},line:{itemStyle:{borderWidth:"4"},lineStyle:{width:"3"},symbolSize:"0",symbol:"circle",smooth:!0},radar:{itemStyle:{borderWidth:"4"},lineStyle:{width:"3"},symbolSize:"0",symbol:"circle",smooth:!0},bar:{itemStyle:{barBorderWidth:0,barBorderColor:"#ccc"}},pie:{itemStyle:{borderWidth:0,borderColor:"#ccc"}},scatter:{itemStyle:{borderWidth:0,borderColor:"#ccc"}},boxplot:{itemStyle:{borderWidth:0,borderColor:"#ccc"}},parallel:{itemStyle:{borderWidth:0,borderColor:"#ccc"}},sankey:{itemStyle:{borderWidth:0,borderColor:"#ccc"}},funnel:{itemStyle:{borderWidth:0,borderColor:"#ccc"}},gauge:{itemStyle:{borderWidth:0,borderColor:"#ccc"}},candlestick:{itemStyle:{color:"#fc97af",color0:"transparent",borderColor:"#fc97af",borderColor0:"#87f7cf",borderWidth:"2"}},graph:{itemStyle:{borderWidth:0,borderColor:"#ccc"},lineStyle:{width:"1",color:"#ffffff"},symbolSize:"0",symbol:"circle",smooth:!0,color:["#fc97af","#87f7cf","#f7f494","#72ccff","#f7c5a0","#d4a4eb","#d2f5a6","#76f2f2"],label:{color:"#293441"}},map:{itemStyle:{areaColor:"#f3f3f3",borderColor:"#999999",borderWidth:.5},label:{color:"#893448"},emphasis:{itemStyle:{areaColor:"rgba(255,178,72,1)",borderColor:"#eb8146",borderWidth:1},label:{color:"rgb(137,52,72)"}}},geo:{itemStyle:{areaColor:"#f3f3f3",borderColor:"#999999",borderWidth:.5},label:{color:"#893448"},emphasis:{itemStyle:{areaColor:"rgba(255,178,72,1)",borderColor:"#eb8146",borderWidth:1},label:{color:"rgb(137,52,72)"}}},categoryAxis:{axisLine:{show:!0,lineStyle:{color:"#666666"}},axisTick:{show:!1,lineStyle:{color:"#333"}},axisLabel:{show:!0,color:"#aaaaaa"},splitLine:{show:!1,lineStyle:{color:["#e6e6e6"]}},splitArea:{show:!1,areaStyle:{color:["rgba(250,250,250,0.05)","rgba(200,200,200,0.02)"]}}},valueAxis:{axisLine:{show:!0,lineStyle:{color:"#666666"}},axisTick:{show:!1,lineStyle:{color:"#333"}},axisLabel:{show:!0,color:"#aaaaaa"},splitLine:{show:!1,lineStyle:{color:["#e6e6e6"]}},splitArea:{show:!1,areaStyle:{color:["rgba(250,250,250,0.05)","rgba(200,200,200,0.02)"]}}},logAxis:{axisLine:{show:!0,lineStyle:{color:"#666666"}},axisTick:{show:!1,lineStyle:{color:"#333"}},axisLabel:{show:!0,color:"#aaaaaa"},splitLine:{show:!1,lineStyle:{color:["#e6e6e6"]}},splitArea:{show:!1,areaStyle:{color:["rgba(250,250,250,0.05)","rgba(200,200,200,0.02)"]}}},timeAxis:{axisLine:{show:!0,lineStyle:{color:"#666666"}},axisTick:{show:!1,lineStyle:{color:"#333"}},axisLabel:{show:!0,color:"#aaaaaa"},splitLine:{show:!1,lineStyle:{color:["#e6e6e6"]}},splitArea:{show:!1,areaStyle:{color:["rgba(250,250,250,0.05)","rgba(200,200,200,0.02)"]}}},toolbox:{iconStyle:{borderColor:"#999999"},emphasis:{iconStyle:{borderColor:"#666666"}}},legend:{textStyle:{color:"#999999"}},tooltip:{axisPointer:{lineStyle:{color:"#cccccc",width:1},crossStyle:{color:"#cccccc",width:1}}},timeline:{lineStyle:{color:"#87f7cf",width:1},itemStyle:{color:"#87f7cf",borderWidth:1},controlStyle:{color:"#87f7cf",borderColor:"#87f7cf",borderWidth:.5},checkpointStyle:{color:"#fc97af",borderColor:"#fc97af"},label:{color:"#87f7cf"},emphasis:{itemStyle:{color:"#f7f494"},controlStyle:{color:"#87f7cf",borderColor:"#87f7cf",borderWidth:.5},label:{color:"#87f7cf"}}},visualMap:{color:["#fc97af","#87f7cf"]},dataZoom:{backgroundColor:"rgba(255,255,255,0)",dataBackgroundColor:"rgba(114,204,255,1)",fillerColor:"rgba(114,204,255,0.2)",handleColor:"#72ccff",handleSize:"100%",textStyle:{color:"#333333"}},markPoint:{label:{color:"#293441"},emphasis:{label:{color:"#293441"}}}};

    // flexcharts expects an array when both a chart option and custom themes are provided:
    //   [0]           — the chart option, serialized with JSON.stringify()
    //   [1], [2], … — theme definitions, each as a two-element array: [themeName, JSON.stringify(themeObject)]
    //
    // flexcharts registers each theme in the browser via echarts.registerTheme(name, theme).
    // The active theme is then applied according to the &darkmode URL parameter:
    //   darkmode=off  → theme 'default' is used
    //   darkmode=on   → theme 'dark' is used
    //   darkmode=auto → flexcharts switches between 'default' and 'dark' based on the system setting
    callback([JSON.stringify(option), ['default', JSON.stringify(myThemeJsonMacarons)], ['dark', JSON.stringify(myThemeJsonChalk)]]);
}
