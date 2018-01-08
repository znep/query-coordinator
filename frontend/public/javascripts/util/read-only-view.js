(function() {

  /**
   * @param view - A JSON representation of a view, which should come from the
   *               /api/views/<four-by-four>.json endpoint.
   */
  ReadOnlyView = function(view) {

    this.toString = function() {
      return JSON.stringify(view);
    };

    this.serialize = function() {

      var serializeColumn = function(column) {

        return {
          id: _.get(column, 'id'),
          name: _.get(column, 'name'),
          dataTypeName: _.get(column, 'dataTypeName'),
          fieldName: _.get(column, 'fieldName'),
          position: _.get(column, 'position'),
          renderTypeName: _.get(column, 'renderTypeName'),
          tableColumnId: _.get(column, 'tableColumnId'),
          width: _.get(column, 'width'),
          format: _.get(column, 'format')
        };
      };
      var removeSystemColumns = function(column) {
        return parseInt(_.get(column, 'id', 0), 10) >= 0;
      };

      return {
        columns: _.get(view, 'columns', []).map(serializeColumn).filter(removeSystemColumns),
        createdAt: _.get(view, 'createdAt'),
        displayType: _.get(view, 'displayType'),
        domainCName: _.get(view, 'domainCName'),
        flags: _.get(view, 'flags', []),
        grants: _.get(view, 'grants', []),
        id: _.get(view, 'id'),
        metadata: _.get(view, 'metadata', {}),
        name: _.get(view, 'name', ''),
        newBackend: _.get(view, 'newBackend'),
        oid: _.get(view, 'oid'),
        provenance: _.get(view, 'provenance'),
        publicationAppendEnabled: _.get(view, 'publicationAppendEnabled'),
        publicationDate: _.get(view, 'publicationDate'),
        publicationGroup: _.get(view, 'publicationGroup'),
        publicationStage: _.get(view, 'publicationStage'),
        query: _.get(view, 'query', {}),
        rights: _.get(view, 'rights'),
        rowsUpdatedAt: _.get(view, 'rowsUpdatedAt'),
        tableId: _.get(view, 'tableId'),
        viewLastModified: _.get(view, 'viewLastModified'),
        viewType: _.get(view, 'viewType')
      };
    };

    this.serializeForQuery = function() {
      var serializedView = this.serialize();

      serializedView.originalViewId = this.getId();

      return serializedView;
    };

    //
    //
    // `get` methods return data.
    //
    //

    /**
     * @return - The view's uid (four-by-four).
     */
    this.getId = function() {
      return _.get(view, 'id', new Error('This view has no `id` property.'));
    };

    /**
     * @return - The view's name, or an empty string if the view does not have one.
     */
    this.getName = function() {
      return _.get(view, 'name', '');
    };

    /**
     * @return - The view's view type, or an empty string if the view does not have one.
     */
    this.getViewType = function() {
      return _.get(view, 'viewType', '').toLowerCase();
    };

    /**
     * @return - The view's display type, or an empty string if the view does not have one.
     */
    this.getDisplayType = function() {
      return _.get(view, 'displayType', '').toLowerCase();
    };

    /**
     * @return - The view's category, or an empty string if the view does not have one.
     */
    this.getCategory = function() {
      return _.get(view, 'category', '');
    };

    /**
     * @return - The domain to which the view belongs (in the case of federated view
     *           this may differ from the host to which the request was made).
     */
    this.getDomainCName = function() {
      return _.get(view, 'domainCName', new Error('This view has no `domainCName` property.'));
    };

    /**
     * @return - ReadOnlyView.OBE or ReadOnlyView.NBE, depending on whether the view
     *           is stored in the old backend or the new backend, respectively.
     */
    this.getStorageBackend = function() {
      return (_.get(view, 'newBackend', new Error('This view has no `newBackend` property.'))) ?
        ReadOnlyView.NBE :
        ReadOnlyView.OBE;
    };

    /**
     * @return - An array containing the view's flags, or an empty array if there are none.
     */
    this.getFlags = function() {
      return _.get(view, 'flags', []);
    };

    /**
     * @return - An array containing the view's rights, or an empty array if there are none.
     */
    this.getRights = function() {
      return _.get(view, 'rights', []);
    };

    /**
     * @return - An array containing the view's grants, or an empty array if there are none.
     */
    this.getGrants = function() {
      return _.get(view, 'grants', []);
    };

    /**
     * @return - An array containing the view's columns, or an empty array if there are none.
     */
    this.getColumns = function() {
      return _.get(view, 'columns', []);
    };

    /**
     * @return - An array containing the view's columns that are not system columns,
     *           or an empty array if there are none.
     */
    this.getUserColumns = function() {

      return _.filter(
        this.getColumns(),
        function(column) {
          return parseInt(_.get(column, 'id', -1), 10) >= 0;
        }
      );
    };

    /**
     * @return - An array containing the view's columns that are visible (lacking the 'hidden' flag
     *           on the column), or an empty array if there are none.
     */
    this.getVisibleColumns = function() {

      return _.filter(
        this.getColumns(),
        function(column) {
          var flagsOnColumn = _.get(column, 'flags', []);

          return !_.include(flagsOnColumn, 'hidden');
        }
      );
    };

    /**
     * @return - An array containing the view's columns that are hidden (having the hidden flag on
     *           the column), or an empty array if there are none.
     */
    this.getHiddenColumns = function() {

      return _.filter(
        this.getColumns(),
        function(column) {
          var flagsOnColumn = _.get(column, 'flags', []);

          return _.include(flagsOnColumn, 'hidden');
        }
      );
    };

    /**
     * @param columnDataType - A string specifying the data type of the subset of columns
     *                         that are desired.
     *
     * @return - An array containing the view's columns that are of the specified data type,
     *           or an empty array if there are none.
     */
    this.getColumnsByDataType = function(columnDataType) {

      return _.filter(
        this.getColumns(),
        function(column) {
          return _.get(column, 'dataTypeName', null) === columnDataType;
        }
      );
    };

    /**
     * @param columnId - A number specifying the id of the desired column.
     *
     * @return - A column from the view if one exists with the specified id, or null if
     *           one such column does not exist.
     */
    this.getColumnByColumnId = function(columnId) {
      var column = _.find(
        this.getColumns(),
        { id: columnId }
      );

      return (_.isObject(column)) ?
        column :
        null;
    };

    /**
     * @param columnId - A string specifying the fieldName of the desired column.
     *
     * @return - A column from the view if one exists with the specified fieldName,
     *           or null if one such column does not exist.
     */
    this.getColumnByColumnFieldName = function(columnFieldName) {
      var column = _.find(
        this.getColumns(),
        { fieldName: columnFieldName }
      );

      return (_.isObject(column)) ?
        column :
        null;
    };

    /**
     * @param columnId - A string specifying the name of the desired system column.
     *
     * @return - A system column from the view if one exists with the specified name,
     *           or null if one such column does not exist.
     */
    this.getSystemColumnByColumnName = function(systemColumnName) {
      var column = _.find(
        this.getColumns(),
        { id: -1, name: systemColumnName }
      );

      return (_.isObject(column)) ?
        column :
        null;
    };

    //
    //
    // `is` and `has` methods return true or false.
    //
    //

    /**
     * @return - True or false, depending on whether the view is considered valid.
     */
    this.isValid = function() {
      return true;
    };

    /**
     * @return - True if the view has no parent, or false if it does.
     */
    this.isRoot = function() {
      return _.include(this.getFlags(), 'default');
    };

    /**
     * @return - True if the view is a 'draft', which is currently implemented as
     *           the view being a Working Copy, or false if it is not.
     */
    this.isDraft = function() {
      return _.get(view, 'publicationStage', null) === 'unpublished';
    };

    /**
     * @return - True if the view is 'published', which is currently implemented
     *           as the view NOT being a Working Copy, or false if it is not.
     */
    this.isPublished = function() {
      return _.get(view, 'publicationStage', null) === 'published';
    };

    /**
     * @return - True if the view has grant with the 'public' flag on it, or false
     *           if it does not.
     */
    this.isPublic = function() {
      var publicGrantExists = function(grant) {
        var flagsOnGrant = _.get(grant, 'flags', []);

        return _.include(flagsOnGrant, 'public');
      };
      var publicGrantTestFunction = publicGrantExists;

      if (this.displayTypeIsForm()) {
        publicGrantTestFunction = function(grant) {
          return publicGrantExists(grant) && (_.get(grant, 'type', '') === 'contributor');
        };
      }

      return _.any(this.getGrants(), publicGrantTestFunction);
    };

    /**
     * @return - True if the view does not have a grant with the 'public' flag on it,
     *           or false if it does.
     */
    this.isPrivate = function() {
      return !this.isPublic();
    };

    /**
     * @return - True if the domain to which the view belongs is not the same as the
     *           host to which the current request was made.
     */
    this.isFederated = function() {
      var currentHost = _.get(window, 'location.host', '');
      var viewDomainCName = this.getDomainCName();

      return currentHost !== viewDomainCName;
    };

    /**
     * @return - True if the view is stored on the Old Backend, or false if it is not.
     */
    this.isOBE = function() {
      return this.getStorageBackend() === ReadOnlyView.OBE;
    };

    /**
     * @return - True if the view is stored on the New Backend, or false if it is not.
     */
    this.isNBE = function() {
      return this.getStorageBackend() === ReadOnlyView.NBE;
    };

    /**
     * @param rightName - A string naming the right for which to search.
     *
     * @return - True if the view has the right specified by the `rightName` parameter,
     *           or false if it does not.
     */
    this.hasRight = function(rightName) {
      return _.include(this.getRights(), rightName);
    };

    /**
     * @param grant - An object representing a grant. This object will be compared to
     *                each grant associated with the view and if all the properties
     *                in the `grant` parameter exist and are equal to the properties
     *                of the grant under consideration, it will be considered a match.
     *
     * @return - True if the view has the grant specified by the `grant` parameter,
     *           or false if it does not.
     */
    this.hasGrant = function(grant) {

      return !_.isUndefined(
        _.find(
          this.getGrants(),
          grant
        )
      );
    };

    //
    //
    // Identity, part I: View Types
    //
    // These are defined in: `/core/unobtainium-enums/src/main/java/com/blist/models/views/ViewType.java`
    //
    //

    /**
     * @return - True if the view's `viewType` property is 'tabular', or false if it is not.
     */
    this.viewTypeIsTabular = function() {
      return this.getViewType() === 'tabular';
    };

    /**
     * @return - True if the view's `view` property is 'blobby', or false if it is not.
     */
    this.viewTypeIsBlobby = function() {
      return this.getViewType() === 'blobby';
    };

    /**
     * @return - True if the view's `view` property is 'href', or false if it is not.
     */
    this.viewTypeIsHref = function() {
      return this.getViewType() === 'href';
    };

    /**
     * @return - True if the view's `view` property is 'geo', or false if it is not.
     */
    this.viewTypeIsGeo = function() {
      return this.getViewType() === 'geo';
    };

    /**
     * @return - True if the view's `view` property is 'story', or false if it is not.
     */
    this.viewTypeIsStory = function() {
      return this.getViewType() === 'story';
    };

    /**
     * @return - True if the view's `view` property is 'measure', or false if it is not.
     */
    this.viewTypeIsMeasure = function() {
      return this.getViewType() === 'measure';
    };

    //
    //
    // Identity, part II: Display Types
    //
    // These are defined in: `/core/unobtainium-enums/src/main/java/com/blist/models/views/DisplayType.java`
    //
    //

    /**
     * @return - True if the view's `displayType` property is 'assetinventory', or false if it is not.
     */
    this.displayTypeIsAssetinventory = function() {
      return this.getDisplayType() === 'assetinventory';
    };

    /**
     * @return - True if the view's `displayType` property is 'blob', or false if it is not.
     */
    this.displayTypeIsBlob = function() {
      return this.getDisplayType() === 'blob';
    };

    /**
     * @return - True if the view's `displayType` property is 'calendar', or false if it is not.
     */
    this.displayTypeIsCalendar = function() {
      return this.getDisplayType() === 'calendar';
    };

    /**
     * @return - True if the view's `displayType` property is 'chart', or false if it is not.
     */
    this.displayTypeIsChart = function() {
      return this.getDisplayType() === 'chart';
    };

    /**
     * @return - True if the view's `displayType` property is 'data_lens', or false if it is not.
     */
    this.displayTypeIsDataLens = function() {
      return this.getDisplayType() === 'data_lens';
    };

    /**
     * @return - True if the view's `displayType` property is 'draft', or false if it is not.
     */
    this.displayTypeIsDraft = function() {
      return this.getDisplayType() === 'draft';
    };

    /**
     * @return - True if the view's `displayType` property is 'fatrow', or false if it is not.
     */
    this.displayTypeIsFatRow = function() {
      return this.getDisplayType() === 'fatrow';
    };

    /**
     * @return - True if the view's `displayType` property is 'federated', or false if it is not.
     */
    this.displayTypeIsFederated = function() {
      return this.getDisplayType() === 'federated';
    };

    /**
     * @return - True if the view's `displayType` property is 'form', or false if it is not.
     */
    this.displayTypeIsForm = function() {
      return this.getDisplayType() === 'form';
    };

    /**
     * @return - True if the view's `displayType` property is 'geoRows', or false if it is not.
     */
    this.displayTypeIsGeoRows = function() {
      return this.getDisplayType() === 'geoRows';
    };

    /**
     * @return - True if the view's `displayType` property is 'href', or false if it is not.
     */
    this.displayTypeIsHref = function() {
      return this.getDisplayType() === 'href';
    };

    /**
     * @return - True if the view's `displayType` property is 'map', or false if it is not.
     */
    this.displayTypeIsMap = function() {
      return this.getDisplayType() === 'map';
    };

    /**
     * @return - True if the view's `displayType` property is 'measure', or false if it is not.
     */
    this.displayTypeIsMeasure = function() {
      return this.getDisplayType() === 'measure';
    };

    /**
     * @return - True if the view's `displayType` property is 'metadata_table', or false if it is not.
     */
    this.displayTypeIsMetadataTable = function() {
      return this.getDisplayType() === 'metadata_table';
    };

    /**
     * @return - True if the view's `displayType` property is 'page', or false if it is not.
     */
    this.displayTypeIsPage = function() {
      return this.getDisplayType() === 'page';
    };

    /**
     * @return - True if the view's `displayType` property is 'pulse', or false if it is not.
     */
    this.displayTypeIsPulse = function() {
      return this.getDisplayType() === 'pulse';
    };

    /**
     * @return - True if the view's `displayType` property is 'story', or false if it is not.
     */
    this.displayTypeIsStory = function() {
      return this.getDisplayType() === 'story';
    };

    /**
     * @return - True if the view's `displayType` property is 'table', or false if it is not.
     */
    this.displayTypeIsTable = function() {
      return this.getDisplayType() === 'table';
    };

    /**
     * @return - True if the view's `displayType` property is 'visualization', or false if it is not.
     */
    this.displayTypeIsVisualization = function() {
      return this.getDisplayType() === 'visualization';
    };
  };

  ReadOnlyView.NBE = 'ReadOnlyView::NBE';
  ReadOnlyView.OBE = 'ReadOnlyView::OBE';

  ReadOnlyView.isReadOnlyView = function(object) {
    return object.constructor.name === 'ReadOnlyView';
  };

  ReadOnlyView.fromViewId = function(viewId) {

    return new Promise(function(resolve, reject) {

      function handleError(jqXHR) {

        reject({
          status: parseInt(jqXHR.status, 10),
          message: jqXHR.statusText,
          detail: jqXHR.responseJSON || jqXHR.responseText || '<No response>'
        });
      }

      $.ajax({
        headers: {
          'X-Socrata-Federation': 'Honey Badger'
        },
        url: '/api/views/' + viewId + '.json',
        type: 'GET',
        success: resolve,
        error: handleError
      });
    }).
    then(function(view) {
      return new ReadOnlyView(view);
    });
  };

  ReadOnlyView.defaultFromViewId = function(viewId) {

    return new Promise(function(resolve, reject) {

      function handleError(jqXHR) {

        reject({
          status: parseInt(jqXHR.status, 10),
          message: jqXHR.statusText,
          detail: jqXHR.responseJSON || jqXHR.responseText || '<No response>'
        });
      }

      $.ajax({
        headers: {
          'X-Socrata-Federation': 'Honey Badger'
        },
        url: '/views/' + viewId + '.json?method=getDefaultView',
        type: 'GET',
        success: resolve,
        error: handleError
      });
    }).
    then(function(view) {
      return new ReadOnlyView(view);
    });
  };

  if (blist.inBrowser) {
    this.ReadOnlyView = ReadOnlyView;
  } else {
    module.exports = ReadOnlyView;
  }
})();
