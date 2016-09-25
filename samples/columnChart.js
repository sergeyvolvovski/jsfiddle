$(function () {
	var table = new PerspectiveTable(results);
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
        /*tooltip: table.getTooltip('HTML', [{name: 0}, {x: 7}, {y: 8}, {val: 1}], {header: true, shared: true}),*/
        tooltip: {
            headerFormat: '<tr><center><h3>'+ table.getColumnName(0) + ': {point.key}</h3></center></tr><table>',
            pointFormat: '<tr><td>{series.name}: </td><td align="right">{point.y:.2f}</td></tr>',
            footerFormat: '</table>',
            shared: true,
            useHTML: true
        },
        plotOptions: {
            column: {
                pointPadding: 0.2,
                borderWidth: 0
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
