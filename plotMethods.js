// Regex for testing filtration mask
var MASK_REGEX = "^[x 0-9\a-z\.\:\(\)\=\!\"\'\&\|\<\>\+\*\-\/\%]*$";

/**
 * Constructs the result object
 * @param results - Array of Objects to retrieve result from or a single object with the result
 * @param resultKey - String
 * @constructor
 */
var PerspectiveTable = function(results, resultKey) {
  this.result = null;
  this.columnNames = [];
  this.columnData = [];

  if (Array.isArray(results)) {
    //////////////////
    // TODO: CheckIi!! Might not working with IE
    //////////////////
    this.result = results.find(function(r) {return (r.Request && r.Request.resultsKey && r.Request.resultsKey === resultKey);});
  } else {
    // Used for testing
    this.result = results;
  }

  this._createData();

  // TODO: extract all other properties we may need and get rid of the original object

  return this;
};

PerspectiveTable.prototype.getReportName = function() {
  var name = "Untitled";
  if (this.result && this.result.ReportName) {
    name = this.result.ReportName;
  }
  return name;
};

PerspectiveTable.prototype.getReportSubtitle = function() {
  return this.result.Request.title;
};

PerspectiveTable.prototype.getNumColumns = function() {
  return this.result.ReportResult.Leaves[0].Data.length;
};

PerspectiveTable.prototype.getColumnName = function(colInd) {

  var self = this;

  function composeColumnNames() {
    var headers = self.result.Request.headers;
    var subheaders = self.result.Request.subheaders;
    var subheaderInd = 0;

    function add(name) {
      // Do we need to do anything (strip out the parenthesis)?
      self.columnNames.push(name);
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

  if (this.columnNames.length === 0) {
    composeColumnNames();
  }

  // Add validation -?
  return this.columnNames[colInd];
};

/**
 * Creates column data from the result object
 * @private
 */
PerspectiveTable.prototype._createData = function(){
  if (this.columnData.length === 0) {
    var numColumns = this.result.ReportResult.Leaves[0].Data.length;

    // Add names
    for (var i = 0; i < numColumns; ++i) {
      this.columnData.push({
        name: this.getColumnName(i),
        data: []
      });
    }

    // Add values
    var self = this;
    this.result.ReportResult.Leaves.forEach(function(leaf){
      for (var i = 0; i < numColumns; ++i) {
        self.columnData[i].data.push(leaf.Data[i]);
      }
    });
  }
};

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
  console.log('getting Column', colInd, 'data');
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
  console.log('getting Series Data');
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
 * @param {String} type - type of header {html|....}
 * @param {Array of objects} colList - associates result columns with the keys in highchart series.data object , e.g. [{x:1}, {y:2}, {name:0}]
 * @param {Boolean} hasHeader - optional, indicates whether or not first elem of colList is a header. Defaults to false
 */
PerspectiveTable.prototype.getTooltip = function(type, colList, hasHeader) {
  var tooltip;

  switch (type) {
    case 'HTML':
      tooltip = this._getHtmpTypeTooltip(colList, hasHeader);
      break;
    default:
      console.log('"' + type + '" is not recognized as a valid type of tooltip.');
      tooltip = {};
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

  var i = 0;
  if (hasHeader) {
    i = 1;
    tooltip.pointFormat = '<tr><th align="center", colspan="2"><h3>' + this.getColumnName(getColumnIndex(0)) + ': {point.' + getColumnKey(0) + '}</h3></th></tr>';
  }

  for ( ; i < colList.length; ++i) {
    var index = getColumnIndex(i);
    var type = this._getColumnType(index);
    if (type === 'number') {
      tooltip.pointFormat += ('<tr><th>' + this.getColumnName(index) + ': </th><td align="right">{point.' + getColumnKey(i) + ':.2f}</td></tr>');
    } else if (type === 'string') {
      tooltip.pointFormat = '<tr><th>' + this.getColumnName(index) + ': {point.' + getColumnKey(i) + '}</th></tr>';
    } else {

    }
  }

  return tooltip;
};

PerspectiveTable.prototype._getColumnType = function(colInd) {
  return typeof(this.columnData[colInd].data[0]);
};
