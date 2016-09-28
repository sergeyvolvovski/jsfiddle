$(function () {
		var table = createPerspectiveTable(results);
    var filter = "x:1 != 0 && x:2 > 0";

    $('#container').highcharts({
        chart: {
           renderTo: 'container',
           type: 'line'
        },
        title: {
            text: table.getReportName()
        },
        subtitle: {
            text: table.getReportSubtitle()
        },
        xAxis: {
        	categories: table.getColumn(0, filter),
        },
        /*yAxis: {
            title: {
                text: 'Temperature (°C)'
            },
            plotLines: [{
                value: 0,
                width: 1,
                color: '#808080'
            }]
        },*/
        tooltip: table.getTooltip({type: 'html', chart: 'column', headerCol: 0}),
        /*{
            valueSuffix: '°C'
        },*/
        legend: {
            //layout: 'vertical',
            align: 'right',
            //verticalAlign: 'middle',
            borderWidth: 0
        },
        series: [{
            name: table.getColumnName(3),
            data: table.getColumn(3, filter),

        }, {
            name: table.getColumnName(4),
            data: table.getColumn(4, filter),

        }, {
            name: table.getColumnName(7),
            data: table.getColumn(7, filter),

        }, {
            name: table.getColumnName(8),
            data: table.getColumn(8, filter),
        }]
    });
});

