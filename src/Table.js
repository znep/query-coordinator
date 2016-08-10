const _ = require('lodash');
const $ = require('jquery');
const utils = require('socrata-utils');
const Table = require('./views/Table');
const Pager = require('./views/Pager');
const SoqlHelpers = require('./dataProviders/SoqlHelpers');
const VifHelpers = require('./helpers/VifHelpers');
const SoqlDataProvider = require('./dataProviders/SoqlDataProvider');
const MetadataProvider = require('./dataProviders/MetadataProvider');

const ROW_HEIGHT_PX = 39;
const MAX_COLUMN_COUNT = 64;

$.fn.socrataTable = function(originalVif) {
  'use strict';

  originalVif = _.cloneDeep(VifHelpers.migrateVif(originalVif));

  utils.assertHasProperties(
    originalVif,
    'configuration.order',
    'series[0].dataSource.datasetUid',
    'series[0].dataSource.domain',
    'series[0].unit.one',
    'series[0].unit.other'
  );

  utils.assert(
    Array.isArray(_.get(originalVif, 'configuration.order')),
    'jQuery.fn.socrataTable: VIF configuration must include an "order" key ' +
    'whose value is an Array.'
  );

  utils.assertEqual(
    _.get(originalVif, 'configuration.order').length,
    1
  );

  utils.assertHasProperties(
    _.get(originalVif, 'configuration.order[0]'),
    'ascending',
    'columnName'
  );

  var $element = $(this);
  var vifToRender = originalVif;
  var soqlDataProvider = new SoqlDataProvider({
    datasetUid: _.get(vifToRender, 'series[0].dataSource.datasetUid'),
    domain: _.get(vifToRender, 'series[0].dataSource.domain')
  });
  var visualization = new Table($element, vifToRender);
  var pager = null;

  // Holds all state regarding the table's visual presentation.
  // Do _NOT_ update this directly, use setState() or updateState().
  // This is to ensure all state changes are reflected in the UI.
  var renderState = {
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
      return new MetadataProvider(metadataProviderConfig).getDatasetMetadata();
    },
    function(metadataProviderConfig) {

      return '{0}_{1}'.format(
        metadataProviderConfig.domain,
        metadataProviderConfig.datasetUid
      );
    }
  );

  var getMemoizedRowCount = _.memoize(
    function(soqlDataProvider, whereClauseComponents) {
      return soqlDataProvider.getRowCount(whereClauseComponents);
    },
    function(soqlDataProvider, whereClauseComponents, rowsUpdatedAt) {

      return '{0}_{1}_{2}_{3}'.format(
        soqlDataProvider.getConfigurationProperty('domain'),
        soqlDataProvider.getConfigurationProperty('datasetUid'),
        whereClauseComponents,
        rowsUpdatedAt
      );
    }
  );

  attachEvents();

  $element.addClass('socrata-paginated-table');

  render();

  setDataQuery(
    0, // Offset
    computePageSize(),
    _.get(vifToRender, 'configuration.order'),
    SoqlHelpers.whereClauseFilteringOwnColumn(vifToRender, 0)
  ).
    then(function() {
      visualization.freezeColumnWidthsAndRender();
    })['catch'](function() {
      updateState({error: true});
    });

  /**
   * Event Handling
   */
  function attachEvents() {

    $element.one('SOCRATA_VISUALIZATION_DESTROY', function() {
      visualization.destroy();
      detachEvents();
    });

    $element.on('SOCRATA_VISUALIZATION_COLUMN_CLICKED', handleColumnClicked);
    $element.on('SOCRATA_VISUALIZATION_COLUMN_FLYOUT', handleColumnFlyout);
    $element.on('SOCRATA_VISUALIZATION_CELL_FLYOUT', handleCellFlyout);
    $element.on('SOCRATA_VISUALIZATION_PAGINATION_PREVIOUS', handlePrevious);
    $element.on('SOCRATA_VISUALIZATION_PAGINATION_NEXT', handleNext);
    $element.on('SOCRATA_VISUALIZATION_INVALIDATE_SIZE', handleInvalidateSize);
    $element.on('SOCRATA_VISUALIZATION_RENDER_VIF', handleRenderVif);
  }

  function detachEvents() {

    $element.off('SOCRATA_VISUALIZATION_COLUMN_CLICKED', handleColumnClicked);
    $element.off('SOCRATA_VISUALIZATION_COLUMN_FLYOUT', handleColumnFlyout);
    $element.off('SOCRATA_VISUALIZATION_CELL_FLYOUT', handleCellFlyout);
    $element.off('SOCRATA_VISUALIZATION_PAGINATION_PREVIOUS', handlePrevious);
    $element.off('SOCRATA_VISUALIZATION_PAGINATION_NEXT', handleNext);
    $element.off('SOCRATA_VISUALIZATION_INVALIDATE_SIZE', handleInvalidateSize);
    $element.off('SOCRATA_VISUALIZATION_RENDER_VIF', handleRenderVif);
  }

  function render() {
    var pagerOptions;

    if (renderState.error) {
      return visualization.renderError();
    }

    if (renderState.fetchedData) {

      visualization.render(vifToRender, renderState.fetchedData);
    }

    if (renderState.fetchedData && renderState.datasetRowCount) {

      pagerOptions = {
        unit: _.get(vifToRender, 'series[0].unit'),
        startIndex: renderState.fetchedData.startIndex,
        endIndex: Math.min(
          (
            renderState.fetchedData.startIndex +
            renderState.fetchedData.rows.length
          ),
          renderState.datasetRowCount
        ),
        datasetRowCount: renderState.datasetRowCount,
        disabled: renderState.busy || !_.isFinite(renderState.datasetRowCount)
      };
    } else {

      // No fetched data. Render placeholders so that we can determine pager
      // heights.
      pagerOptions = {
        unit: _.get(vifToRender, 'series[0].unit'),
        startIndex: 0,
        endIndex: 0,
        datasetRowCount: 0,
        disabled: true
      };
    }

    renderPager(pagerOptions);
  }

  function renderPager(options) {

    if (pager === null) {
      pager = new Pager($element.find('.visualization-container'));
    }

    pager.render(options);
  }

  function handleColumnClicked(event) {
    var alreadySorted;
    var newOrder;
    var columnName = event.originalEvent.detail;

    utils.assertIsOneOfTypes(event.originalEvent.detail, 'string');

    if (renderState.busy) { return; }

    utils.assert(
      _.includes(
        _.map(renderState.fetchedData.columns, 'fieldName'),
        columnName
      ),
      'Column name not found to sort by: {0}'.format(columnName)
    );

    alreadySorted = _.isEqual(
      _.get(
        vifToRender,
        'configuration.order[0].columnName'
      ),
      columnName
    );

    if (alreadySorted) {

      // Toggle sort direction;
      newOrder = _.cloneDeep(renderState.fetchedData.order);
      newOrder[0].ascending = !newOrder[0].ascending;
    } else {

      newOrder = [{
        columnName: columnName,
        ascending: true
      }]
    }

    _.set(
      vifToRender,
      'configuration.order',
      newOrder
    );

    setDataQuery(
      0,
      renderState.fetchedData.pageSize,
      _.get(vifToRender, 'configuration.order'),
      renderState.fetchedData.whereClauseComponents
    );
  }

  function handleColumnFlyout(event) {
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

  function handleCellFlyout(event) {
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

  function handleNext() {

    setDataQuery(
      renderState.fetchedData.startIndex + renderState.fetchedData.pageSize,
      renderState.fetchedData.pageSize,
      _.get(vifToRender, 'configuration.order'),
      renderState.fetchedData.whereClauseComponents
    );
  }
  function handlePrevious() {

    setDataQuery(
      Math.max(
        0,
        renderState.fetchedData.startIndex - renderState.fetchedData.pageSize
      ),
      renderState.fetchedData.pageSize,
      _.get(vifToRender, 'configuration.order'),
      renderState.fetchedData.whereClauseComponents
    );
  }

  function handleInvalidateSize() {
    var pageSize = computePageSize();
    var oldPageSize = _.get(renderState, 'fetchedData.pageSize');

    // Canceling inflight requests is hard.
    // If we're currently fetching data, ignore the size change.
    // The size will be rechecked once the current request
    // is complete.
    if (
      !renderState.error &&
      !renderState.busy &&
      oldPageSize !== pageSize &&
      renderState.fetchedData
    ) {

      setDataQuery(
        renderState.fetchedData.startIndex,
        pageSize,
        _.get(vifToRender, 'configuration.order'),
        renderState.fetchedData.whereClauseComponents
      );
    }
  }

  function handleRenderVif(event) {
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
      _.pick(vifToRender, 'datasetUid', 'domain')
    );

    setDataQuery(
      0,
      computePageSize(),
      _.get(vifToRender, 'configuration.order'),
      SoqlHelpers.whereClauseFilteringOwnColumn(vifToRender, 0)
    );
  }

  function computePageSize() {

    if (renderState.error) {
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

  function handleSetDataQueryError(error) {

    console.error(
      `Error while fulfilling table data request: ${JSON.stringify(error)}`
    );

    // There was an issue populating this table with data. Retry?

    updateState({ busy: false, error: true });

    return Promise.reject();
  }

  function setDataQuery(startIndex, pageSize, order, whereClauseComponents) {
    if (order.length !== 1) {
      return Promise.reject('order parameter must be an array with exactly one element.');
    }

    if (renderState.busy) {
      throw new Error(
        'Cannot call setDataQuery while a request already in progress.'
      );
    }

    $element.trigger('SOCRATA_VISUALIZATION_DATA_LOAD_START');

    updateState({ busy: true });

    return getMemoizedDatasetMetadata({
      datasetUid: _.get(vifToRender, 'series[0].dataSource.datasetUid'),
      domain: _.get(vifToRender, 'series[0].dataSource.domain')
    }).
      then(function(datasetMetadata) {
        var displayableColumns = new MetadataProvider({
          datasetUid: _.get(vifToRender, 'series[0].dataSource.datasetUid'),
          domain: _.get(vifToRender, 'series[0].dataSource.domain')
        }).getDisplayableColumns(datasetMetadata);
        var displayableColumnsFieldNames = _.map(
          displayableColumns,
          'fieldName'
        ).slice(0, MAX_COLUMN_COUNT);
        var soqlRowCountPromise = getMemoizedRowCount(
          soqlDataProvider,
          whereClauseComponents,
          datasetMetadata.rowsUpdatedAt
        );
        var soqlDataPromise = soqlDataProvider.
          getTableData(
            displayableColumnsFieldNames,
            order,
            startIndex,
            pageSize,
            whereClauseComponents
          );

        soqlRowCountPromise.
          then(function(rowCount) {
            updateState({
              datasetRowCount: rowCount
            });
          })
          ['catch'](handleSetDataQueryError);

        return soqlDataPromise.
          then(function(soqlData) {
            $element.trigger('SOCRATA_VISUALIZATION_DATA_LOAD_COMPLETE');

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

            updateState({
              fetchedData: {
                rows: soqlData.rows,
                columns: displayableColumns,
                startIndex: startIndex,
                pageSize: pageSize,
                order: order,
                whereClauseComponents: whereClauseComponents
              },
              busy: false,
              error: false
            });
          })['catch'](handleSetDataQueryError);
      })['catch'](handleSetDataQueryError);
  }

  function getVif() {
    var newVif = _.cloneDeep(vifToRender);

    _.set(
      newVif,
      'configuration.order',
      _.cloneDeep(
        _.get(
          renderState,
          'fetchedData.order',
          _.get(vifToRender, 'configuration.order')
        )
      )
    );

    return newVif;
  }

  // Updates only specified UI state.
  function updateState(newPartialState) {

    setState(
      _.extend(
        {},
        renderState,
        newPartialState
      )
    );
  }

  // Replaces entire UI state.
  function setState(newState) {
    var becameIdle;
    var changedOrder;

    if (!_.isEqual(renderState, newState)) {
      becameIdle = !newState.busy && renderState.busy;

      changedOrder = (
        // We don't want to emit the ...VIF_UPDATED event on first render.
        // The way that the state here works is that it is initialized with
        // order set to null, so we need to check that there actually is an
        // order (which gets folded into the fetchedData object from the vif
        // once the data request comes back) before checking if it has changed
        // since the last time the state was updated.
        _.get(renderState, 'fetchedData') !== null &&
        !_.isEqual(
          _.get(renderState, 'fetchedData.order'),
          _.get(newState, 'fetchedData.order')
        )
      );

      renderState = newState;

      if (becameIdle) {
        handleInvalidateSize();
      }

      if (changedOrder) {
        $element[0].dispatchEvent(
          new window.CustomEvent(
            'SOCRATA_VISUALIZATION_VIF_UPDATED',
            { detail: getVif(), bubbles: true }
          )
        );
      }

      render();
    }
  }
};
