$(function () {
	var table = new PerspectiveTable(results);
    
    $('#container').highcharts({

        chart: {
            type: 'bubble',
            plotBorderWidth: 1,
            zoomType: 'xy'
        },

        legend: {
            enabled: false
        },

        title: {
            text: table.getReportName()
        },

        subtitle: {
            text: table.getReportSubtitle()
        },

        xAxis: {
            gridLineWidth: 1,
            title: {
                text: table.getColumnName(7)
            },
        },

        yAxis: {
            startOnTick: false,
            endOnTick: false,
            title: {
                text: table.getColumnName(8)
            },
        },

        tooltip: table.getTooltip({type: 'html', chart: 'bubble', header: true}, [{name: 0}, {x: 7}, {y: 8}, {val: 1}]), 

        plotOptions: {
            series: {
                dataLabels: {
                    enabled: true,
                    format: '{point.name}'
                },
                // Can play with these settings
                bubble: {
                	//minSize: 3,
                  //maxSize: 10
                }
            }
        },

				series: [{
        	data: table.getSeriesData({x:7, y:8,z:1,name:0,val:1}, "x:1 > 0 && x:2 > 0"),
          color: 'rgba(223, 83, 83, .5)',
        },
        {
        	data: table.getSeriesData({x:7, y:8,z:1,name:0,val:1}, "x:1 < 0 && x:2 > 0"),
          //color: 'green'
        }]
    });
});
