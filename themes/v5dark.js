/*

    Theme dark as definied by Apache ECharts at version 5.6.0

    Ref.: https://www.npmjs.com/package/echarts/v/5.6.0
    File: /echarts/theme/dark.js

*/

var dark_contrastColor = '#B9B8CE';
var dark_backgroundColor = '#100C2A';
var dark_axisCommon = function () {
    return {
        axisLine: {
            lineStyle: {
                color: dark_contrastColor
            }
        },
        splitLine: {
            lineStyle: {
                color: '#484753'
            }
        },
        splitArea: {
            areaStyle: {
                color: ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.05)']
            }
        },
        minorSplitLine: {
            lineStyle: {
                color: '#20203B'
            }
        }
    };
};

var dark_colorPalette = [
    '#4992ff',
    '#7cffb2',
    '#fddd60',
    '#ff6e76',
    '#58d9f9',
    '#05c091',
    '#ff8a45',
    '#8d48e3',
    '#dd79ff'
];
var dark_theme = {
    darkMode: true,

    color: dark_colorPalette,
    backgroundColor: dark_backgroundColor,
    axisPointer: {
        lineStyle: {
            color: '#817f91'
        },
        crossStyle: {
            color: '#817f91'
        },
        label: {
            // TODO Contrast of label backgorundColor
            color: '#fff'
        }
    },
    legend: {
        textStyle: {
            color: dark_contrastColor
        }
    },
    textStyle: {
        color: dark_contrastColor
    },
    title: {
        textStyle: {
            color: '#EEF1FA'
        },
        subtextStyle: {
            color: '#B9B8CE'
        }
    },
    toolbox: {
        iconStyle: {
            borderColor: dark_contrastColor
        }
    },
    dataZoom: {
        borderColor: '#71708A',
        textStyle: {
            color: dark_contrastColor
        },
        brushStyle: {
            color: 'rgba(135,163,206,0.3)'
        },
        handleStyle: {
            color: '#353450',
            borderColor: '#C5CBE3'
        },
        moveHandleStyle: {
            color: '#B0B6C3',
            opacity: 0.3
        },
        fillerColor: 'rgba(135,163,206,0.2)',
        emphasis: {
            handleStyle: {
                borderColor: '#91B7F2',
                color: '#4D587D'
            },
            moveHandleStyle: {
                color: '#636D9A',
                opacity: 0.7
            }
        },
        dataBackground: {
            lineStyle: {
                color: '#71708A',
                width: 1
            },
            areaStyle: {
                color: '#71708A'
            }
        },
        selectedDataBackground: {
            lineStyle: {
                color: '#87A3CE'
            },
            areaStyle: {
                color: '#87A3CE'
            }
        }
    },
    visualMap: {
        textStyle: {
            color: dark_contrastColor
        }
    },
    timeline: {
        lineStyle: {
            color: dark_contrastColor
        },
        label: {
            color: dark_contrastColor
        },
        controlStyle: {
            color: dark_contrastColor,
            borderColor: dark_contrastColor
        }
    },
    calendar: {
        itemStyle: {
            color: dark_backgroundColor
        },
        dayLabel: {
            color: dark_contrastColor
        },
        monthLabel: {
            color: dark_contrastColor
        },
        yearLabel: {
            color: dark_contrastColor
        }
    },
    timeAxis: dark_axisCommon(),
    logAxis: dark_axisCommon(),
    valueAxis: dark_axisCommon(),
    categoryAxis: dark_axisCommon(),

    line: {
        symbol: 'circle'
    },
    graph: {
        color: dark_colorPalette
    },
    gauge: {
        title: {
            color: dark_contrastColor
        }
    },
    candlestick: {
        itemStyle: {
            color: '#FD1050',
            color0: '#0CF49B',
            borderColor: '#FD1050',
            borderColor0: '#0CF49B'
        }
    }
};

dark_theme.categoryAxis.splitLine.show = false;
// @ts-ignore
echarts.registerTheme('dark', dark_theme);

    /* Minimized:

    var dark_contrastColor="#B9B8CE",dark_backgroundColor="#100C2A",dark_axisCommon=function(){return{axisLine:{lineStyle:{color:dark_contrastColor}},splitLine:{lineStyle:{color:"#484753"}},splitArea:{areaStyle:{color:["rgba(255,255,255,0.02)","rgba(255,255,255,0.05)"]}},minorSplitLine:{lineStyle:{color:"#20203B"}}}},dark_colorPalette=["#4992ff","#7cffb2","#fddd60","#ff6e76","#58d9f9","#05c091","#ff8a45","#8d48e3","#dd79ff"],theme={darkMode:!0,color:dark_colorPalette,backgroundColor:dark_backgroundColor,axisPointer:{lineStyle:{color:"#817f91"},crossStyle:{color:"#817f91"},label:{color:"#fff"}},legend:{textStyle:{color:dark_contrastColor}},textStyle:{color:dark_contrastColor},title:{textStyle:{color:"#EEF1FA"},subtextStyle:{color:"#B9B8CE"}},toolbox:{iconStyle:{borderColor:dark_contrastColor}},dataZoom:{borderColor:"#71708A",textStyle:{color:dark_contrastColor},brushStyle:{color:"rgba(135,163,206,0.3)"},handleStyle:{color:"#353450",borderColor:"#C5CBE3"},moveHandleStyle:{color:"#B0B6C3",opacity:.3},fillerColor:"rgba(135,163,206,0.2)",emphasis:{handleStyle:{borderColor:"#91B7F2",color:"#4D587D"},moveHandleStyle:{color:"#636D9A",opacity:.7}},dataBackground:{lineStyle:{color:"#71708A",width:1},areaStyle:{color:"#71708A"}},selectedDataBackground:{lineStyle:{color:"#87A3CE"},areaStyle:{color:"#87A3CE"}}},visualMap:{textStyle:{color:dark_contrastColor}},timeline:{lineStyle:{color:dark_contrastColor},label:{color:dark_contrastColor},controlStyle:{color:dark_contrastColor,borderColor:dark_contrastColor}},calendar:{itemStyle:{color:dark_backgroundColor},dayLabel:{color:dark_contrastColor},monthLabel:{color:dark_contrastColor},yearLabel:{color:dark_contrastColor}},timeAxis:dark_axisCommon(),logAxis:dark_axisCommon(),valueAxis:dark_axisCommon(),categoryAxis:dark_axisCommon(),line:{symbol:"circle"},graph:{color:dark_colorPalette},gauge:{title:{color:dark_contrastColor}},candlestick:{itemStyle:{color:"#FD1050",color0:"#0CF49B",borderColor:"#FD1050",borderColor0:"#0CF49B"}}};theme.categoryAxis.splitLine.show=!1,echarts.registerTheme("dark",theme);

    */
