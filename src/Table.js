var _ = require('lodash');
var $ = require('jquery');
var utils = require('socrata-utils');
var Table = require('./views/Table');
var Pager = require('./views/Pager');
var SoqlHelpers = require('./dataProviders/SoqlHelpers');
var SoqlDataProvider = require('./dataProviders/SoqlDataProvider');
var MetadataProvider = require('./dataProviders/MetadataProvider');

var ROW_HEIGHT_PX = 39;
var MAX_COLUMN_COUNT = 64;

$.fn.socrataTable = function(vif) {
  'use strict';

  utils.assertHasProperties(
    vif,
    'configuration',
    'datasetUid',
    'domain',
    'unit.one',
    'unit.other',
    'configuration.order'
  );

  utils.assert(
    Array.isArray(vif.configuration.order),
    'jQuery.fn.socrataTable: VIF configuration must include an "order" key ' +
    'whose value is an Array.'
  );

  utils.assertEqual(
    vif.configuration.order.length,
    1
  );

  utils.assertHasProperties(
    vif.configuration.order[0],
    'ascending',
    'columnName'
  );

  var $element = $(this);
  var vifToRender = vif;
  var soqlDataProvider = new SoqlDataProvider(
    _.pick(vif, 'datasetUid', 'domain')
  );
  var visualization = new Table($element, vif);
  var pager = new Pager($element, vif);

  // Holds all state regarding the table's visual presentation.
  // Do _NOT_ update this directly, use _setState() or _updateState().
  // This is to ensure all state changes are reflected in the UI.
  var _renderState = {
    // Is the table busy?
    busy: false,

    // Did we freak out somewhere trying to get data?
    error: false,

    // Holds result of last successful data fetch, plus
    // the metadata regarding that request (start index,
    // order, etc).
    // {
    //   rows: <data from SoqlDataProvider>,
    //   columns: <data from SoqlDataProvider>,
    //   datasetMetadata: <data from SoqlDataProvider>,
    //   startIndex: index of first row (offset),
    //   pageSize: number of items in page (not necessarily in rows[]).
    //   order: {
    //     [ // only one element supported.
    //       {
    //         columnName: <name of column to sort by>,
    //         ascending: boolean
    //       }
    //     ]
    //   }
    // }
    fetchedData: null,

    datasetRowCount: null
  };

  var getMemoizedDatasetMetadata = _.memoize(
    function(metadataProviderConfig) {

      // TODO: Remove allowObeDataset once we no longer need to support OBE datasets
      var allowObeDataset = _.get(vifToRender, 'configuration.allowObeDataset', false);
      return new MetadataProvider(metadataProviderConfig).
        getDatasetMetadata(allowObeDataset);
    },
    function(metadataProviderConfig) {

      return '{0}_{1}'.format(
        metadataProviderConfig.domain,
        metadataProviderConfig.datasetUid
      );
    }
  );

  _attachEvents();

  $element.addClass('socrata-paginated-table');

  _render();

  _setDataQuery(
    0, // Offset
    _computePageSize(),
    _.get(vif, 'configuration.order'),
    SoqlHelpers.whereClauseFilteringOwnColumn(vif)
  ).then(function() {
    visualization.freezeColumnWidthsAndRender();
  })
  ['catch'](function() {
    _updateState({error: true});
  });

  /**
   * Configuration
   */

  function _getRenderOptions() {
    return _.get(vif, 'configuration.order');
  }

  /**
   * Event Handling
   */
  function _attachEvents() {
    $element.one('SOCRATA_VISUALIZATION_DESTROY', function() {
      visualization.destroy();
      _detachEvents();
    });

    $element.on('SOCRATA_VISUALIZATION_COLUMN_CLICKED', _handleColumnClicked);
    $element.on('SOCRATA_VISUALIZATION_COLUMN_FLYOUT', _handleColumnFlyout);
    $element.on('SOCRATA_VISUALIZATION_CELL_FLYOUT', _handleCellFlyout);
    $element.on('SOCRATA_VISUALIZATION_PAGINATION_PREVIOUS', _handlePrevious);
    $element.on('SOCRATA_VISUALIZATION_PAGINATION_NEXT', _handleNext);
    $element.on('SOCRATA_VISUALIZATION_INVALIDATE_SIZE', _handleSizeChange);
    $element.on('SOCRATA_VISUALIZATION_RENDER_VIF', _handleRenderVif);
  }

  function _detachEvents() {
    $element.off('SOCRATA_VISUALIZATION_COLUMN_CLICKED', _handleColumnClicked);
    $element.off('SOCRATA_VISUALIZATION_COLUMN_FLYOUT', _handleColumnFlyout);
    $element.off('SOCRATA_VISUALIZATION_CELL_FLYOUT', _handleCellFlyout);
    $element.off('SOCRATA_VISUALIZATION_PAGINATION_PREVIOUS', _handlePrevious);
    $element.off('SOCRATA_VISUALIZATION_PAGINATION_NEXT', _handleNext);
    $element.off('SOCRATA_VISUALIZATION_INVALIDATE_SIZE', _handleSizeChange);
    $element.off('SOCRATA_VISUALIZATION_RENDER_VIF', _handleRenderVif);
  }

  function _render() {

    if (_renderState.error) {

      visualization.renderError();
    } else if (_renderState.fetchedData) {

      visualization.render(
        _renderState.fetchedData,
        _renderState.fetchedData.order
      );

      pager.render({
        unit: vif.unit,
        startIndex: _renderState.fetchedData.startIndex,
        endIndex: Math.min(
          (
            _renderState.fetchedData.startIndex +
            _renderState.fetchedData.rows.length
          ),
          _renderState.datasetRowCount
        ),
        datasetRowCount: _renderState.datasetRowCount,
        disabled: _renderState.busy || !_.isFinite(_renderState.datasetRowCount)
      });
    } else {

      // No fetched data. Render placeholders so that we can determine pager
      // heights.
      pager.render({
        unit: vif.unit,
        startIndex: 0,
        endIndex: 0,
        datasetRowCount: 0,
        disabled: true
      });
    }
  }

  function _handleColumnClicked(event) {
    var alreadySorted;
    var newOrder;
    var columnName = event.originalEvent.detail;

    utils.assertIsOneOfTypes(event.originalEvent.detail, 'string');

    if (_renderState.busy) { return; }

    utils.assert(
      _.includes(
        _.map(_renderState.fetchedData.columns, 'fieldName'),
        columnName
      ),
      'Column name not found to sort by: {0}'.format(columnName)
    );

    alreadySorted = _renderState.fetchedData.order[0].columnName === columnName;

    if (alreadySorted) {

      // Toggle sort direction;
      newOrder = _.cloneDeep(_renderState.fetchedData.order);
      newOrder[0].ascending = !newOrder[0].ascending;
    } else {
      newOrder = [{
        columnName: columnName,
        ascending: true
      }]
    }

    _setDataQuery(
      0,
      _renderState.fetchedData.pageSize,
      newOrder,
      _renderState.fetchedData.whereClauseComponents
    );
  }

  function _handleColumnFlyout(event) {
    var payload = event.originalEvent.detail;

    $element[0].dispatchEvent(
      new window.CustomEvent(
        'SOCRATA_VISUALIZATION_FLYOUT',
        {
          detail: payload,
          bubbles: true
        }
      )
    );
  }

  function _handleCellFlyout(event) {
    var payload = event.originalEvent.detail;

    $element[0].dispatchEvent(
      new window.CustomEvent(
        'SOCRATA_VISUALIZATION_FLYOUT',
        {
          detail: payload,
          bubbles: true
        }
      )
    );
  }

  function _handleNext() {

    _setDataQuery(
      _renderState.fetchedData.startIndex + _renderState.fetchedData.pageSize,
      _renderState.fetchedData.pageSize,
      _renderState.fetchedData.order,
      _renderState.fetchedData.whereClauseComponents
    );
  }
  function _handlePrevious() {

    _setDataQuery(
      Math.max(
        0,
        _renderState.fetchedData.startIndex - _renderState.fetchedData.pageSize
      ),
      _renderState.fetchedData.pageSize,
      _renderState.fetchedData.order,
      _renderState.fetchedData.whereClauseComponents
    );
  }

  function _handleSizeChange() {
    var pageSize = _computePageSize();
    var oldPageSize = _.get(_renderState, 'fetchedData.pageSize');

    // Canceling inflight requests is hard.
    // If we're currently fetching data, ignore the size change.
    // The size will be rechecked once the current request
    // is complete.
    if (
      !_renderState.error &&
      !_renderState.busy &&
      oldPageSize !== pageSize &&
      _renderState.fetchedData
    ) {

      _setDataQuery(
        _renderState.fetchedData.startIndex,
        pageSize,
        _renderState.fetchedData.order,
        _renderState.fetchedData.whereClauseComponents
      );
    }
  }

  function _handleRenderVif(event) {
    var newVif = event.originalEvent.detail;

    if (newVif.type !== 'table') {
      throw new Error(
        'Cannot update VIF; old type: `table`, new type: `{0}`.'.
          format(
            newVif.type
          )
      );
    }

    vifToRender = newVif;

    soqlDataProvider = new SoqlDataProvider(
      _.pick(newVif, 'datasetUid', 'domain')
    );

    _setDataQuery(
      0,
      _computePageSize(),
      _.get(newVif, 'configuration.order'),
      SoqlHelpers.whereClauseFilteringOwnColumn(newVif)
    );
  }

  function _computePageSize() {
    if (_renderState.error) {
      return 0;
    }

    var overallHeight = $element.find('.visualization-container').height();
    var pagerHeight = $element.find('.socrata-pager').outerHeight();
    var heightRemaining = overallHeight - pagerHeight;

    return visualization.howManyRowsCanFitInHeight(heightRemaining);
  }

  /**
   * Data Requests
   */

  function _handleSetDataQueryError(error) {

    console.error(
      'Error while fulfilling table data request: {0}'.
        format(error)
    );

    // There was an issue populating this table with data. Retry?

    _updateState({ busy: false, error: true });

    return Promise.reject();
  }

  function _setDataQuery(startIndex, pageSize, order, whereClauseComponents) {
    if (order.length !== 1) {
      return Promise.reject('order parameter must be an array with exactly one element.');
    }

    if (_renderState.busy) {
      throw new Error(
        'Cannot call _makeDataRequest while a request already in progress.'
      );
    }

    $element.trigger('SOCRATA_VISUALIZATION_DATA_LOAD_START');

    _updateState({ busy: true });

    return getMemoizedDatasetMetadata(
      _.pick(vifToRender, 'datasetUid', 'domain')
    ).
      then(
        function(datasetMetadata) {
          var displayableColumns = new MetadataProvider(
            _.pick(vifToRender, 'datasetUid', 'domain')
          ).
            getDisplayableColumns(datasetMetadata);
          var displayableColumnsFieldNames = _.map(
            displayableColumns,
            'fieldName'
          ).
            slice(0, MAX_COLUMN_COUNT);

          // TODO: Remove this once we no longer need to support OBE datasets
          var allowObeDataset = _.get(vifToRender, 'configuration.allowObeDataset', false);
          var soqlRowCountPromise = soqlDataProvider.
            getRowCount(whereClauseComponents, allowObeDataset);
          var soqlDataPromise = soqlDataProvider.
            getTableData(
              displayableColumnsFieldNames,
              order,
              startIndex,
              pageSize,
              whereClauseComponents,
              allowObeDataset
            );

          return Promise.all([
            soqlRowCountPromise,
            soqlDataPromise
          ]).then(
            function(resolutions) {
              $element.trigger('SOCRATA_VISUALIZATION_DATA_LOAD_COMPLETE');

              var rowCount = resolutions[0];
              var soqlData = resolutions[1];

              // Rows can either be undefined OR of the exact length of the
              // displayableColumns OR MAX_COLUMN_COUNT, if the
              // displayableColumns has more than MAX_COLUMN_COUNT items.
              utils.assert(_.every(soqlData.rows, function(row) {

                return (
                  !row ||
                  row.length === displayableColumns.length ||
                  row.length === MAX_COLUMN_COUNT
                );
              }));

              // Pad/trim row count to fit display.
              soqlData.rows.length = pageSize;
              _updateState({
                fetchedData: {
                  rows: soqlData.rows,
                  columns: displayableColumns,
                  startIndex: startIndex,
                  pageSize: pageSize,
                  order: order,
                  whereClauseComponents: whereClauseComponents
                },
                datasetRowCount: rowCount,
                busy: false,
                error: false
              });

            }
          )
          ['catch'](_handleSetDataQueryError);
        }
      )
      ['catch'](_handleSetDataQueryError);
  }

  function _getVif() {
    var newVif = _.cloneDeep(vif);
    _.set(
      newVif,
      'configuration.order',
      _.cloneDeep(
        _.get(_renderState, 'fetchedData.order', vif.configuration.order)
      )
    );

    return newVif;
  }

  // Updates only specified UI state.
  function _updateState(newPartialState) {
    _setState(_.extend(
      {},
      _renderState,
      newPartialState
    ));
  }

  // Replaces entire UI state.
  function _setState(newState) {
    var becameIdle;
    var changedOrder;

    if (!_.isEqual(_renderState, newState)) {
      becameIdle = !newState.busy && _renderState.busy;
      changedOrder = !_.isEqual(
        _.get(_renderState, 'fetchedData.order'),
        _.get(newState, 'fetchedData.order')
      );

      _renderState = newState;

      if (becameIdle) {
        _handleSizeChange();
      }

      if (changedOrder) {
        $element[0].dispatchEvent(
          new window.CustomEvent(
            'SOCRATA_VISUALIZATION_VIF_UPDATED',
            { detail: _getVif(), bubbles: true }
          )
        );
      }

      _render();
    }
  }
};
