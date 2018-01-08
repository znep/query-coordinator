(function() {

  var Soda1DataProvider = function Soda1DataProvider() {};

  Soda1DataProvider.getRows = function(view, startOffset, rowCount, successCallback, errorCallback) {

    if (!ReadOnlyView.isReadOnlyView(view)) {
      throw new Error('The `view` parameter is required and must be an instance of ReadOnlyView.');
    }

    if (!_.isNumber(startOffset)) {
      throw new Error('The `startOffset` parameter is required and must be a number.');
    }

    if (!_.isNumber(rowCount)) {
      throw new Error('The `rowCount` parameter is required and must be a number.');
    }

    if (!_.isFunction(successCallback)) {
      throw new Error('The `successCallback` parameter is required and must be a function.');
    }

    if (!_.isFunction(errorCallback)) {
      throw new Error('The `errorCallback` parameter is required and must be a function.');
    }

    var successHandler = function(response) {
      var viewFromResponse = new ReadOnlyView(response.meta.view);

      var translatedRows = response.data.map(function(soda1Row, index) {
        return translateSoda1RowIntoRowSetDataStructure(viewFromResponse, soda1Row, index);
      });
      var totalRows = response.meta.totalRows;

      successCallback({
        rows: translatedRows,
        totalRows: totalRows
      });
    };
    var errorHandler = function(jqXHR) {

      errorCallback({
        status: parseInt(jqXHR.status, 10),
        message: jqXHR.statusText,
        detail: jqXHR.responseJSON || jqXHR.responseText || '<No response>'
      });
    };
    var ajaxConfig = {
      headers: {
        'Content-type': 'application/json',
        'X-Socrata-Federation': 'Honey Badger'
      },
      url: '/views/INLINE/rows.json?accessType=WEBSITE&method=getByIds&asHashes=true&start=' + startOffset + '&length=' + rowCount + '&meta=true',
      type: 'POST',
      success: successHandler,
      error: errorHandler,
      data: JSON.stringify(view.serializeForQuery())
    };

    $.ajax(ajaxConfig);
  };

  function translateSoda1RowIntoRowSetDataStructure(view, soda1Row, index) {
    var isUserColumn = function(column) {
      return _.get(column, 'id', -1) >= 0;
    };
    var rowInstance = {
      index: index,
      invalid: {},
      changed: {},
      error: {},
      sessionMeta: {},
      data: {},
      metadata: {}
    };

    // Iterate over each property of `soda1Row`
    _.each(
      soda1Row,
      function(soda1Value, soda1Identifier) {
        var rowValue = soda1Value;
        var column = view.getColumnByColumnId(parseInt(soda1Identifier, 10));

        if (_.isNull(column)) {
          return;
        }

        if (!isUserColumn(column) && column.name === 'meta' && _.isString(rowValue)) {
          rowValue = JSON.parse(rowValue || 'null');
        }

        if (_.isObject(rowValue)) {
          // First, convert an empty array into a null
          // Booleans in the array don't count because location type
          // has a flag that may be set even if there is no data.  If
          // some type actually cares about only having a boolean,
          // this will need to be made more specific
          var allRowValuesAreBlankOrEmpty = _.all(
            rowValue,
            function(value) {
              return $.isBlank(value) || _.isBoolean(value);
            }
          );

          if (allRowValuesAreBlankOrEmpty) {
            rowValue = null;
          }
        }

        if (column.renderTypeName === 'checkbox' && rowValue === false) {
          rowValue = null;
        }

        if (column.renderTypeName === 'geospatial' && soda1Row.sid) {

          rowValue = $.extend(
            {},
            rowValue,
            {
              row_id: soda1Row.sid
            }
          );
        }

        if (!_.isUndefined(rowValue)) {

          if (isUserColumn(column)) {
            rowInstance.data[column.id] = rowValue;
          } else {
            rowInstance.metadata[column.name] = rowValue;
          }
        }
      }
    );

    var metadataProperties = {
      id: _.get(soda1Row, 'sid'),
      uuid: _.get(soda1Row, 'id')
    };

    if (view.isOBE()) {
      metadataProperties.created_at = _.get(soda1Row, 'created_at');
      metadataProperties.updated_at = _.get(soda1Row, 'updated_at');
      metadataProperties.created_meta = _.get(soda1Row, 'created_meta');
      metadataProperties.updated_meta = _.get(soda1Row, 'updated_meta');
    } else {
      metadataProperties.createdAt = _.get(soda1Row, 'created_at');
      metadataProperties.updatedAt = _.get(soda1Row, 'updated_at');
      metadataProperties.meta = JSON.parse(_.get(soda1Row, 'meta', 'null'));
    }

    _.extend(rowInstance.data, metadataProperties);
    _.extend(rowInstance.metadata, metadataProperties);

    delete (rowInstance.metadata.meta || {}).invalidCells;

    return rowInstance;
  }

  if (blist.inBrowser) {
    this.Soda1DataProvider = Soda1DataProvider;
  } else {
    module.exports = Soda1DataProvider;
  }
})();
