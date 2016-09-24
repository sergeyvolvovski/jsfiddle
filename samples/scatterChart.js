$(function () {
		var table = new PerspectiveTable(results);

    $('#container').highcharts({
        chart: {
            type: 'scatter',
            zoomType: 'xy'
        },
        title: {
            text: table.getReportName(),
        },
        subtitle: {
            text: table.getReportSubtitle()
        },
        xAxis: {
            title: {
                enabled: true,
                text: table.getColumnName(1)
            },
            startOnTick: true,
            endOnTick: true,
            showLastLabel: true
        },
        yAxis: {
            title: {
                text: table.getColumnName(8)
            }
        },
/*        legend: {
            layout: 'vertical',
            align: 'left',
            verticalAlign: 'top',
//            x: 100,
//            y: 70,
            floating: true,
            backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',
            borderWidth: 1
        },*/
        plotOptions: {
            series: {
                dataLabels: {
                    enabled: true,
                    format: '{point.name}'
                }
            },
            scatter: {
                marker: {
                    radius: 5,
                    states: {
                        hover: {
                            enabled: true,
                            lineColor: 'rgb(100,100,100)'
                        }
                    }
                },
                states: {
                    hover: {
                        marker: {
                            enabled: false
                        }
                    }
                }
              },
                tooltip: {
                    //headerFormat: '<b>{series.name}</b><br>',
                    //pointFormat: '{point.x:.2f}, {point.y:.2f}'
            		useHTML: true,
            		headerFormat: '<table>',
            		pointFormat: '<tr><th colspan="2"><h3>' + table.getColumnName(0) + 																					': {point.name}</h3></th></tr>' +
            								'<tr><th>' + table.getColumnName(1) + 
                            ': </th><td align="right">{point.x:.2f}</td></tr>' +
              							'<tr><th>' + table.getColumnName(8) + 
                            ': </th><td align="right">{point.y:.2f}</td></tr>',
            footerFormat: '</table>',
            followPointer: true
            }
        },
/*        plotOptions: {
            series: {
                dataLabels: {
                    enabled: true,
                    format: '{point.name}'
                }
            }
        },*/
        series: [{
            color: 'rgba(223, 83, 83, .5)',
            data: table.getSeriesData({x: 1, y: 8, name: 0}, 'x:1 != 0 && x:2 > 0')                    }]
    });
});

