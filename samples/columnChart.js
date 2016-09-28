$(function () {
		var table = createPerspectiveTable(results);
    if (!table) {
    	return;
    }
    
    var filter = "x:1 != 0 && x:2 > 0";

		$('#container').highcharts({
        chart: {
            type: 'column'
        },
        title: {
            text: table.getReportName()
        },
        subtitle: {
            text: table.getReportSubtitle()
        },
        xAxis: {
            categories: table.getColumn(0, filter),
            crosshair: true
        },
        tooltip: table.getTooltip({type: 'html', chart: 'column', headerCol: 0}),
        plotOptions: {
            column: {
                pointPadding: 0.2,
                borderWidth: 0,
                // Play with this 
                //pointWidth: 5
            }
        },
        series: [{
            name: table.getColumnName(1),
            data: table.getColumn(1, filter),

        }, {
            name: table.getColumnName(5),
            data: table.getColumn(5, filter),

        }, {
            name: table.getColumnName(7),
            data: table.getColumn(7, filter),

        }, {
            name: table.getColumnName(8),
            data: table.getColumn(8, filter),
        }]
    });
});
