// ========= Globals ==========

var columnNames = [];
var columnData = [];

function round(num, precision) {
  return precision === 0 ? Math.round(num) : Math.round(num * Math.pow(10, precision)) / Math.pow(10, precision);
}

/**
 * Returns report name
 * @param {Object} result - the report object
 */
function getReportName(result) {
  var name = "Untitled";
  if (result && result.ReportName) {
    name = result.ReportName
  }
  return name;
}

function getReportSubtitle(result) {
  return result.Request.title;
}

function getNumColumns(result) {
  return result.ReportResult.Leaves[0].Data.length;
}

function getColumnName(result, colInd) {

  function composeColumnNames() {
    var headers = result.Request.headers;
    var subheaders = result.Request.subheaders;
    var subheaderInd = 0;

    function add(name) {
      // Do we need to do anything (strip out the paranthesis)?
      columnNames.push(name);
    }

    for (var i = 0; i < headers.length; ++i) {
      var name = headers[i].label;
      if (typeof(headers[i].colspan) === 'number') {
        for (var j = 0; j < headers[i].colspan; ++j) {
          var subname = subheaders[subheaderInd++].label;
          add(name + ' ' + subname);
        }
      } else {
        add(name);
        ++subheaderInd;
      }
    }
  }

  if (columnNames.length === 0) {
    composeColumnNames();
  }

  // Add validation -?
  return columnNames[colInd];
}

function getColumn(result, colInd, dataOnly) {

  function createColumnData() {
    var numColumns = result.ReportResult.Leaves[0].Data.length;

    // Add names
    for (var i = 0; i < numColumns; ++i) {
      columnData.push({
        name: getColumnName(result, i),
        data: []
      });
    }

    // Add values
    result.ReportResult.Leaves.forEach(function(leaf){
      // Filter out some values
      if (leaf.Data[1] !== 0 && leaf.Data[2] > 0) {
        for (var i = 0; i < numColumns; ++i) {
          columnData[i].data.push(leaf.Data[i]);
        }
      }
    });
  }

  if (columnData.length === 0) {
    createColumnData();
  }

  if (dataOnly === undefined) {
    dataOnly = true;
  }

  return dataOnly ? columnData[colInd].data : columnData[colInd];
}

function getScatterChartData(result, xCol, yCol, tipCol) {
  console.log('getting Scatter Chart Data');
  var data = [];
  var columnX = getColumn(result, xCol);
  var columnY = getColumn(result, yCol);
  var tips = tipCol === undefined ? null : getColumn(result, tipCol);
  for (var i = 0; i < columnX.length; ++i) {
    //data.push([c1[i], c2[i]]);
    var point = {x: columnX[i], y: columnY[i]};
    if (tips) {
      point.name = tips[i];
    }
    data.push(point);
  }
  return data;
}

function getBubbleChartData(result, xCol, yCol, sizeCol, nameCol) {
  console.log('getting Bubble Chart Data');
  var data = [];
  var columnX = getColumn(result, xCol);
  var columnY = getColumn(result, yCol);
  var columnSize = getColumn(result, sizeCol);
  var columnName = getColumn(result, nameCol);
  for (var i = 0; i < columnX.length; ++i) {
    data.push({
      x: round(columnX[i], 2),
      y: round(columnY[i], 2),
      z: Math.abs(columnSize[i]),
      name: columnName[i],
      val: round(columnSize[i], 2)
    });
  }
  return data;
}
