// ========= Globals ==========

var columnNames = [];
var columnData = [];

var filterOperators = ['=', '!=', '>', '<', '>=', '<='];

function round(num, precision) {
  return precision === 0 ? Math.round(num) : Math.round(num * Math.pow(10, precision)) / Math.pow(10, precision);
}

function getResult(results, resultKey) {
  return results.find(function(r) {return (r.Request && r.Request.resultsKey && r.Request.resultsKey === resultKey);});
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

/**
 * Returns the array of data in the form acceptable for series.data in highchart object
 * 
 * @param {Object} result - object to retrive data from
 * @param {String} colSpec - associates result columns with the keys in highchart series.data object , e.g. "x:1,y:2,name:0"
 * @param {String} filterSpec - optional filter specs in string form, e.g. "x>0,y<=5". Should use the same keys as colSpec
 * @return (Array of Objects} [{x: 25}, y: 30},...]
 */
function getSeriesData(result, colSpec, filterSpec) {
  console.log('getting Series Data');
  var data = [];
  var columns = [];
  var colInfo = colSpec.split(',');
  var i, j;
  for (i = 0; i < colInfo.length; ++i) {
    var info = colInfo[i].split(':');
    var key = info[0].trim();
    var colInd = parseInt(info[1].trim());
    columns.push({
      data: getColumn(result, colInd),
      key: key
    });
  }

  var filters = [];
  if (filterSpec) {
    var strFilters = filterSpec.split(',');
    for (i = 0; i < strFilters.length; ++i) {
      var filter = null;
      for (j = 0; !filter && j < filterOperators.length; ++j) {
        var pos = strFilters[i].search(filterOperators[j]);
        // Can use >0 because operator should be preceded with column index
        if (pos > 0) {
          filter = {
            key: strFilters[i].substr(0, pos).trim(),
            operator: filterOperators[j],
            value: parseInt(strFilters[i].substr(pos + filterOperators[j].length).trim())
          };

          if (filter.key.length > 0 && filter.value !== NaN) {
            filters.push(filter);
          }
        }
      }
    }
  }

  // Assuming data for each column have the same length. If we have use case for a different need to implement some checkings
  var dataSize = columns[0].data.length;

  for (i = 0; i < dataSize; ++i) {
    var elem = {};
    for (j = 0; j < columns.length; ++j) {
      elem[columns[j].key] = columns[j].data[i];
    }

    var add = true;
    if (filters.length > 0) {
      // Check whether or not we should filter data out and turn flag if yes
      for (j = 0; add && j < filters.length; ++j) {
        var key = filters[j].key;
        if (elem.hasOwnProperty(key)) {
          var valueToExamine = elem[key];
          var filterValue = filters[j].value;

          switch (filters[j].operator) {
            case '=':
              add = valueToExamine === filterValue;
              break;
            case '!=':
              add = valueToExamine !== filterValue;
              break;
            case '<':
              add = valueToExamine < filterValue;
              break;
            case '>':
              add = valueToExamine > filterValue;
              break;
            case '<=':
              add = valueToExamine <= filterValue;
              break;
            case '>=':
              add = valueToExamine >= filterValue;
              break;
          }
        }
      }
    }

    if (add) {
      data.push(elem);
    }
  }

  return data;
}
