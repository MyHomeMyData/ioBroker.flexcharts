'use strict';

function demoChartGauge() {
    return {
        series: [
            {
                type: 'gauge',
                startAngle: 90,
                endAngle: -270,
                pointer: {
                    show: false,
                },
                progress: {
                    show: true,
                    overlap: false,
                    roundCap: true,
                    clip: false,
                    itemStyle: {
                        borderWidth: 1,
                        borderColor: '#464646',
                    },
                },
                axisLine: {
                    lineStyle: {
                        width: 40,
                    },
                },
                splitLine: {
                    show: false,
                    distance: 0,
                    length: 10,
                },
                axisTick: {
                    show: false,
                },
                axisLabel: {
                    show: false,
                    distance: 50,
                },
                data: [
                    {
                        value: 20,
                        name: 'Perfect',
                        title: {
                            offsetCenter: ['0%', '-30%'],
                        },
                        detail: {
                            valueAnimation: true,
                            offsetCenter: ['0%', '-20%'],
                        },
                    },
                    {
                        value: 40,
                        name: 'Good',
                        title: {
                            offsetCenter: ['0%', '0%'],
                        },
                        detail: {
                            valueAnimation: true,
                            offsetCenter: ['0%', '10%'],
                        },
                    },
                    {
                        value: 60,
                        name: 'Commonly',
                        title: {
                            offsetCenter: ['0%', '30%'],
                        },
                        detail: {
                            valueAnimation: true,
                            offsetCenter: ['0%', '40%'],
                        },
                    },
                ],
                title: {
                    text: 'Unknown Chart Type ==> Demo Chart: Gauge',
                    fontSize: 14,
                },
                detail: {
                    width: 50,
                    height: 14,
                    fontSize: 14,
                    color: 'inherit',
                    borderColor: 'inherit',
                    borderRadius: 20,
                    borderWidth: 1,
                    formatter: '{value}%',
                },
            },
        ],
    };
}

function demoChart() {
    const data = [];
    for (let i = 0; i <= 100; i++) {
        let theta = (i / 100) * 360;
        let r = 5 * (1 + Math.sin((theta / 180) * Math.PI));
        data.push([r, theta]);
    }
    return {
        title: {
            text: 'Unknown Chart Type ==> Demo Chart: Two Value-Axes in Polar',
        },
        legend: {
            data: ['line'],
        },
        polar: {},
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross',
            },
        },
        angleAxis: {
            type: 'value',
            startAngle: 0,
        },
        radiusAxis: {},
        series: [
            {
                coordinateSystem: 'polar',
                name: 'line',
                type: 'line',
                data: data,
            },
        ],
    };
}

module.exports = { demoChart, demoChartGauge };
