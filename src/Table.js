var _ = require('lodash');
var $ = require('jquery');
var utils = require('socrata-utils');
var Table = require('./views/Table');
var Pager = require('./views/Pager');
var SoqlDataProvider = require('./dataProviders/SoqlDataProvider');
var MetadataProvider = require('./dataProviders/MetadataProvider');

var ROW_HEIGHT_PX = 39;

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
    'jQuery.fn.socrataTable: VIF configuration must include an "order" key whose is an Array.'
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

  var soqlDataProvider = new SoqlDataProvider(
    _.pick(vif, 'datasetUid', 'domain')
  );

  var metadataProvider = new MetadataProvider(
    _.pick(vif, 'datasetUid', 'domain')
  );

  // Returns a promise for the dataset metadata.
  // The response is cached for the duration of this
  // table component's existence.
  var _getDatasetMetadata = _.once(function() {
    return metadataProvider.getDatasetMetadata();
  });

  var visualization = new Table($element, vif);
  var pager = new Pager($element, vif);

  // Holds all state regarding the table's visual presentation.
  // Do _NOT_ update this directly, use _setState() or _updateState().
  // This is to ensure all state changes are reflected in the UI.
  var _renderState = {
    // Is the table busy?
    busy: false,

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

  _attachEvents();

  $element.addClass('socrata-paginated-table');

  soqlDataProvider.getRowCount().then(function(rowCount) {
    _updateState({ datasetRowCount: rowCount });
  });

  _render();

  _setDataQuery(
    0, // Offset
    _computePageSize(),
    _.get(vif, 'configuration.order')
  ).then(function() {
    visualization.freezeColumnWidthsAndRender();
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
  }

  function _detachEvents() {
    $element.off('SOCRATA_VISUALIZATION_COLUMN_CLICKED', _handleColumnClicked);
    $element.off('SOCRATA_VISUALIZATION_COLUMN_FLYOUT', _handleColumnFlyout);
    $element.off('SOCRATA_VISUALIZATION_CELL_FLYOUT', _handleCellFlyout);
    $element.off('SOCRATA_VISUALIZATION_PAGINATION_PREVIOUS', _handlePrevious);
    $element.off('SOCRATA_VISUALIZATION_PAGINATION_NEXT', _handleNext);
    $element.off('SOCRATA_VISUALIZATION_INVALIDATE_SIZE', _handleSizeChange);
  }

  function _render() {
    if (_renderState.fetchedData) {
      visualization.render(
        _renderState.fetchedData,
        _renderState.fetchedData.order
      );

      pager.render({
        unit: vif.unit,
        startIndex: _renderState.fetchedData.startIndex,
        endIndex: Math.min(_renderState.fetchedData.startIndex + _renderState.fetchedData.rows.length - 1, _renderState.datasetRowCount),
        datasetRowCount: _renderState.datasetRowCount,
        disabled: _renderState.busy || !_.isFinite(_renderState.datasetRowCount)
      });

      $element.addClass('loaded');
    } else {
      // No fetched data. Render placeholders, so we can determine pager heights.
      $element.removeClass('loaded');
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
      _.include(_.pluck(_renderState.fetchedData.columns, 'fieldName'), columnName),
      'column name not found to sort by: {0}'.format(columnName)
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
      newOrder
    );
  }

  function _handleColumnFlyout(event) {
    var payload = event.originalEvent.detail;

    $element[0].dispatchEvent(
      new window.CustomEvent(
        'SOCRATA_VISUALIZATION_TABLE_FLYOUT',
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
        'SOCRATA_VISUALIZATION_TABLE_FLYOUT',
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
      _renderState.fetchedData.order
    );
  }
  function _handlePrevious() {
    _setDataQuery(
      Math.max(0, _renderState.fetchedData.startIndex - _renderState.fetchedData.pageSize),
      _renderState.fetchedData.pageSize,
      _renderState.fetchedData.order
    );
  }

  function _handleSizeChange() {
    var pageSize = _computePageSize();
    var oldPageSize = _.get(_renderState, 'fetchedData.pageSize');
    // Canceling inflight requests is hard.
    // If we're currently fetching data, ignore the size change.
    // The size will be rechecked once the current request
    // is complete.
    if (!_renderState.busy && oldPageSize !== pageSize && _renderState.fetchedData) {
      _setDataQuery(
        _renderState.fetchedData.startIndex,
        pageSize,
        _renderState.fetchedData.order
      );
    }
  }

  function _computePageSize() {
    var overallHeight = $element.height();
    var pagerHeight = $element.find('.socrata-pager').outerHeight();
    var heightRemaining = overallHeight - pagerHeight;
    return visualization.howManyRowsCanFitInHeight(heightRemaining);
  }

  /**
   * Data Requests
   */

  function _setDataQuery(startIndex, pageSize, order) {
    utils.assert(order.length === 1, 'order parameter must be an array with exactly one element.');

    if (_renderState.busy) {
      throw new Error('Called _makeDataRequest while a request already in progress - not allowed.');
    }

    _updateState({ busy: true });

    var displayableColumns = _getDisplayableColumns();
    var soqlData = displayableColumns.then(function(displayableColumns) {
      return soqlDataProvider.getTableData(
        _.pluck(displayableColumns, 'fieldName'),
        order,
        startIndex,
        pageSize
      );
    });

    return Promise.all([
      _getDatasetMetadata(),
      displayableColumns,
      soqlData
    ]).then(function(resolutions) {
      var datasetMetadata = resolutions[0];
      var displayableColumns = resolutions[1];
      var soqlData = resolutions[2];

      // Rows can either be undefined OR of the exact length of the
      // displayableColumns.
      utils.assert(_.all(soqlData.rows, function(row) {
        return !row || displayableColumns.length === row.length;
      }));

      soqlData.rows.length = pageSize; // Pad/trim row count to fit display.
      _updateState({
        fetchedData: {
          rows: soqlData.rows,
          columns: displayableColumns,
          startIndex: startIndex,
          pageSize: pageSize,
          order: order
        },
        busy: false
      });

    }).catch(function(error) {
      try {
        console.error('Error while fulfilling table data request: {0}'.format(error));
        _updateState({ busy: false });
      } catch (updateStateError) {
        console.error('Error while processing failed SODA request (reported separately)', updateStateError);
      }
      throw error;
    });
  }

  function _getDisplayableColumns() {
    return _getDatasetMetadata().then(metadataProvider.getDisplayableColumns);
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
