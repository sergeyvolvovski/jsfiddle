// Regex for testing filtration mask
var MASK_REGEX = "^[x 0-9\a-z\.\:\(\)\=\!\"\'\&\|\<\>\+\*\-\/\%]*$";

/**
 * Constructs the result object
 * @param results - Array of Objects to retrieve result from or a single object with the result
 * @param resultKey - String
 * @constructor
 */
var PerspectiveTable = function(results, resultKey = null, rowResultKeyPattern = null) {
  this.reportName = "";
  this.reportSubtitle = "";
  this.columnNames = null;
  this.subcolumnNames = null;
  this.columnData = [];

  if (Array.isArray(results)) {
    if (rowResultKeyPattern) {
      this._createDataFromMultipleRows(results, rowResultKeyPattern);    
    } else {
      var result = results.find(function(r) {return (r.Request && r.Request.resultsKey && r.Request.resultsKey === resultKey);});
      this._createData(result);
    }
  } else {
    this._createData(results);
  } 

  // TODO: extract all other properties we may need and get rid of the original object

  return this;
};

PerspectiveTable.prototype.getReportName = function() {
   return this.reportName;
};

PerspectiveTable.prototype.getReportSubtitle = function() {
  return this.reportSubtitle;
};

PerspectiveTable.prototype.getNumColumns = function() {
  return this.columnData.length;
};

PerspectiveTable.prototype.getColumnName = function(colInd) {
  return colInd >= 0 && colInd < this.columnNames.length ? this.columnNames[colInd] : '';
};

PerspectiveTable.prototype.getSubcolumnName = function(colInd) {
  return colInd >= 0 && colInd < this.subcolumnNames.length ? this.subcolumnNames[colInd] : '';
};

/**
 * Creates column data from the result object
 * @private
 */
PerspectiveTable.prototype._createData = function(result) {
  if (result && this.columnData.length === 0) {

    this.reportName = result.ReportName || "";
    this.reportSubtitle = (result.Request && result.Request.title) ? result.Request.title : "";
      
    this.columnNames = this._composeColumnNames(result);
    this.subcolumnNames = this._composeColumnNames(result, true);
    for (var j = 0; j < this.columnNames.length; ++j) {
      this.columnData.push({name: this.columnNames[j], data: []});
      for (var i = 0; i < result.ReportResult.Leaves.length; ++i) {
         // assuming we can have nulls only in value columns, not in name
         this.columnData[j].data.push(result.ReportResult.Leaves[i].Data[j] || 0);
      }
    }
  }
};

PerspectiveTable.prototype._createDataFromMultipleRows = function(results, rowResultKeyPattern)
{
   var regex = new RegExp(rowResultKeyPattern);
   var numColumns = 0;
   try {
    for (var r = 0; r < results.length; r++) {
       var result = results[r];
       if (result.Request && result.Request.resultsKey && result.Request.resultsKey.match(regex)) { 
          // Initialize numColumns if not already
          if (numColumns <= 0) { 
             numColumns = result.ReportResult.Leaves[0].Data.length;
             this._createData(result);
          } else if (result.ReportResult.Leaves[0].Data.length === numColumns) {
             for (var j = 0; j < this.columnNames.length; ++j) {
               for (var i = 0; i < result.ReportResult.Leaves.length; ++i) {
                  this.columnData[j].data.push(result.ReportResult.Leaves[i].Data[j]);
               }
             }
          }          
       }
    }
  } catch (e) {
    debugger;  
  }
}

PerspectiveTable.prototype._composeColumnNames = function(result, subheadersOnly = false) 
{
   var columnNames = [];
   var headers = result.Request.headers;
   var subheaders = result.Request.subheaders;
   var subheaderInd = 0;

   if (headers && Array.isArray(headers)) {
      for (var i = 0; i < headers.length; ++i) {
        var name = headers[i].label;
        if (headers[i].colspan) {
          var numSubheaders = parseInt(headers[i].colspan);
          for (var j = 0; j < numSubheaders; ++j) {
            var subname = subheaders[subheaderInd++].label;
            columnNames.push(subheadersOnly ? subname : (name + ' ' + subname));
          }
        } else {
          columnNames.push(subheadersOnly ? '' : name);
          ++subheaderInd;
        }
     }
  }
  return columnNames;
}

/**
 * Checks whether or not row should be included
 * @param index - index in the column data
 * @param mask - filter mask to check data against
 * @returns {boolean}
 * @private
 */
PerspectiveTable.prototype._isRowIncluded = function(index, mask) {
  // Check if we have valid filter mask
  var included = true;
  var temp = null;
  if (mask && typeof(mask) === "string" && new RegExp(MASK_REGEX, 'i').test(mask)) {
    temp = new String(mask);
  }

  if (temp) {
    for (var i = 0; i < this.columnData.length; ++i) {
      temp = temp.split("x:" + i).join(this.columnData[i].data[index]);
    }
    included = new Function('return ' + temp)();
  }

  return included;
};

/**
 * Returns column data with or w/o the coumn name
 * @param colInd - the index of the column
 * @param {String} mask - optional filter mask in string form, e.g. "x:1 > 0 && x:2 <= 5 ...".
 * @param {Boolean} dataOnly - optional flag saying whether ot not return data only or data and column name
 * @returns {Array||Object}
 */
PerspectiveTable.prototype.getColumn = function(colInd, mask, dataOnly) {
  if (mask === undefined) {
    mask = null;
    dataOnly = true;
  } else if (typeof(mask) === 'boolean') {
    mask = null;
    dataOnly = mask;
  } else if (typeof(mask) !== 'string') {
    mask = null;
  }

  if (dataOnly === undefined) {
    dataOnly = true;
  }

  var column;
  if (mask) {
    column = dataOnly ? [] : {name: this.getColumnName(colInd), data: []};
    for (var i = 0; i < this.columnData[colInd].data.length; ++i) {
      if (this._isRowIncluded(i, mask)) {
        if (dataOnly) {
          column.push(this.columnData[colInd].data[i])
        } else {
          column.data.push(this.columnData[colInd].data[i])
        }
      }
    }
  } else {
    column = dataOnly ? this.columnData[colInd].data : this.columnData[colInd];
  }

  return column;
};

/**
 * Returns the array of data in the form acceptable for series.data in highchart object
 *
 * @param {Object} result - object to retrive data from
 * @param {object} colList - associates result columns with the keys in highchart series.data object , e.g. {x:1,y:2,name:0}
 * @param {String} mask - optional filter mask in string form, e.g. "x:1 > 0 && x:2 <= 5 ...".
 * @return (Array of Objects} [{x: 25, y: 30},...]
 */
PerspectiveTable.prototype.getSeriesData = function(colList, mask) {
  var data = [];
  var columns = [];

  for (var key in colList) {
    columns.push({
      data: this.getColumn(colList[key]),
      key: key
    });
  }

  // Assuming data for each column have the same length. If we have use case for a different need to implement some checkings
  var dataSize = columns[0].data.length;

  for (var i = 0; i < dataSize; ++i) {
    if (this._isRowIncluded(i, mask)) {
      var point = {};
      for (var j = 0; j < columns.length; ++j) {
        point[columns[j].key] = columns[j].data[i];
      }
      data.push(point);
    }
  }

  return data;
};

/**
 *
 * @param {Object} options
 * @param {Array of objects} colList - associates result columns with the keys in highchart series.data object , e.g. [{x:1}, {y:2}, {name:0}]
 */
PerspectiveTable.prototype.getTooltip = function(options, colList) {
  var tooltip = {};
  var type = options && options.type ? options.type : 'html';
  var chartType = options && options.chart ? options.chart : 'column';
  switch (chartType) {
    case 'bubble':
    case 'scatter':
      if (type === 'html') {
        tooltip = this._getHtmpTypeTooltip(colList, options.header || true);
      } else {
        console.log('"' + type + '" is not recognized as a valid type of tooltip.');
      }
      break;
    case 'column':
      tooltip = this._getColumnChartTooltip(options && options.headerCol ? options.headerCol : 0);
      break;
    default:
      console.log('Unimplemented for chart type', charttype);
  }

  return tooltip;
};

PerspectiveTable.prototype._getHtmpTypeTooltip = function(colList, hasHeader) {

  function getColumnIndex(num) {
    return colList[num][Object.keys(colList[num])[0]];
  }

  function getColumnKey(num) {
    return Object.keys(colList[num])[0];
  }

  var tooltip = {
    useHTML: true,
    headerFormat: '<table>',
    pointFormat: '',
    footerFormat: '</table>',
    followPointer: true
  };

  if (hasHeader) {
    var colName = this.getColumnName(getColumnIndex(0)).trim();
    if (colName.length > 0) {colName += ': ';}
    tooltip.pointFormat = '<tr><th align="center", colspan="2"><h3>' + colName + '{point.' + getColumnKey(0) + '}</h3></th></tr>';
  }

  for (var i = hasHeader ? 1 : 0 ; i < colList.length; ++i) {
    var index = getColumnIndex(i);
    var type = this._getColumnType(index);
    if (type === 'number') {
      tooltip.pointFormat += ('<tr><th>' + this.getColumnName(index) + ': </th><td align="right">{point.' + getColumnKey(i) + ':.2f}</td></tr>');
    } else if (type === 'string') {
      tooltip.pointFormat = '<tr><th>' + this.getColumnName(index) + ': {point.' + getColumnKey(i) + '}</th></tr>';
    } else {
      console.log('Unsupported type of column value', type);
    }
  }

  return tooltip;
};

PerspectiveTable.prototype._getColumnChartTooltip = function(headerCol) {
  return {
    headerFormat: '<tr><center><h3>'+ this.getColumnName(headerCol) + ': {point.key}</h3></center></tr><table>',
    pointFormat: '<tr><td>{series.name}: </td><td align="right">{point.y:.2f}</td></tr>',
    footerFormat: '</table>',
    shared: true,
    useHTML: true
  };
};

PerspectiveTable.prototype._getColumnType = function(colInd) {
  return typeof(this.columnData[colInd].data[0]);
};

/**
 * Factory method
 * @param results - Array of Objects to retrieve result from the array of objects or a single object with the result
 * @param resultKey - String
 * @return {Object} - instance if success, null otherwise
 */
function createPerspectiveTable(results, resultKey) {
  var instance = new PerspectiveTable(results, resultKey);
  if (!instance.columnData || instance.columnData.length === 0) {
    console.log('Failed to create PerspectiveTable instance');
    instance = null;
  }
  return instance;
}

function createPerspectiveTableFromMultipleRows(results, rowResultKeyPattern) {
  var instance = new PerspectiveTable(results, null, rowResultKeyPattern);
  if (!instance.columnData || instance.columnData.length === 0) {
    console.log('Failed to create PerspectiveTable instance');
    instance = null;
  }
  return instance;
}

function createPerspectiveTableMap(results, resultKeyArray) {
  tableMap = {};
  for (var k = 0; k < resultKeyArray.length; k++) {
    var instance = new PerspectiveTable(result, resultKeyArray[k]);
    if (instance && instance.columnData.length) {
      tableMap[result.Request.resultsKey] = instance;
    }
  }
  return tableMap;
}

function createPerspectiveTableMapByPattern(results, resultKeyPattern) {

  tableMap = {};
  var regex = new RegExp(resultKeyPattern);
  for (var r = 0; r < results.length; r++) {
    var result = results[r];
    if (result.Request && result.Request.resultsKey && result.Request.resultsKey.match(regex)) { 
       var instance = new PerspectiveTable(result);
       if (instance && instance.columnData.length) {
          tableMap[result.Request.resultsKey] = instance;
       }
    }
  }
  return tableMap;
}

