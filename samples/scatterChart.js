$(function () {
	var table = new PerspectiveTable(results);

    $('#container').highcharts({
        chart: {
            type: 'scatter',
            zoomType: 'xy'
        },
        legend: {
            enabled: false
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
        tooltip: table.getTooltip({type: 'html', chart: 'scatter', header: true}, [{name: 0}, {x: 1}, {y: 8}]),
        plotOptions: {
            series: {
                dataLabels: {
                    enabled: true,
                    format: '{point.name}'
                }
            }
        },
        series: [{
            color: 'rgba(223, 83, 83, .5)',
            data: table.getSeriesData({x: 1, y: 8, name: 0}, 'x:1 != 0 && x:2 > 0')                    }]
    });
});

