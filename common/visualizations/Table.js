const _ = require('lodash');
const $ = require('jquery');
const utils = require('common/js_utils');
const Table = require('./views/Table');
const Pager = require('./views/Pager');
const SoqlHelpers = require('./dataProviders/SoqlHelpers');
const VifHelpers = require('./helpers/VifHelpers');
const InlineDataProvider = require('./dataProviders/InlineDataProvider');
const SoqlDataProvider = require('./dataProviders/SoqlDataProvider');
const MetadataProvider = require('./dataProviders/MetadataProvider');

const ROW_HEIGHT_PX = 39;
const MAX_COLUMN_COUNT = 64;

// Passing in locale is a temporary workaround to localize the Table & Pager
$.fn.socrataTable = function(originalVif, locale) {

  originalVif = VifHelpers.migrateVif(_.cloneDeep(originalVif));

  const $element = $(this);
  // This is stored as a variable and not a function since we need to capture
  // the output of _.memoize.
  const getMemoizedDatasetMetadata = _.memoize(
    function(metadataProviderConfig) {
      return new MetadataProvider(metadataProviderConfig, true).getDatasetMetadata();
    },
    function(metadataProviderConfig) {
      const domain = metadataProviderConfig.domain;
      const datasetUid = metadataProviderConfig.datasetUid;

      return `${domain}_${datasetUid}`;
    }
  );
  // This is stored as a variable and not a function since we need to capture
  // the output of _.memoize.
  const getMemoizedRowCount = _.memoize(
    function(soqlDataProvider, whereClauseComponents) {
      return soqlDataProvider.getRowCount(whereClauseComponents);
    },
    function(soqlDataProvider, whereClauseComponents, lastUpdate) {
      const domain = soqlDataProvider.getConfigurationProperty('domain');
      const datasetUid = soqlDataProvider.getConfigurationProperty('datasetUid');

      return `${domain}_${datasetUid}_${whereClauseComponents}_${lastUpdate}`;
    }
  );
  let visualization = null;
  let pager = null;
  // Holds all state regarding the table's visual presentation.
  // Do _NOT_ update this directly, use setState() or updateState().
  // This is to ensure all state changes are reflected in the UI.
  let renderState = {
    vif: null,
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

  function initialize() {

    renderState.vif = originalVif;

    $element.addClass('socrata-paginated-table');

    visualization = new Table($element, originalVif, locale);

    attachApiEvents();

    // We need to instantiate and render the Pager on initialization so that we
    // can reliably determine how much space is available to fill with table
    // rows when we call computePageSize below.
    //
    // Note that the Pager will not actually modify the DOM until you actually
    // call render, so we do that as well.
    pager = new Pager($element.find('.socrata-visualization-container'), locale);
    pager.render(computePagerOptions());

    // Note that we do this here and not just call computePageSize() as an
    // argument to setDataQuery below because computePageSize causes the DOM
    // structure of the table to be updated as a side effect, and we need to
    // ensure that happens before we render the actual table data. Things get
    // a little tricky if this happens in setDataQuery's call stack.
    const pageSize = computePageSize();

    // If the container is big enough to render rows, initiate a data request.
    // If it is not, then we will wait for the ...INVALIDATE_SIZE event, in
    // response to which we will initiate a data request.
    if (pageSize > 0) {

      setDataQuery(
        renderState.vif,
        0, // Offset
        pageSize,
        _.get(renderState.vif, 'configuration.order')
      ).
        then(function() {
          visualization.render(renderState.vif, renderState.fetchedData);
        }).catch(function() {
          updateState({error: true});
        });
    }
  }

  /**
   * Event Handling
   *
   * Because we want to disable things like flyouts and pagination button
   * clicks while data requests are in-flight, we need to support two cases:
   *
   * 1. Attach api events (when the visualization first renders, so that it
   *    will always respond to things like ...RENDER_VIF and
   *    ...INVALIDATE_SIZE).
   * 2. Attach interaction events (after data requests come back and we want
   *     to re-enable the UI).
   *
   * We therefore expose two different attach/detach event functions for these
   * two purposes.
   */
  function attachApiEvents() {

    $element.one(
      'SOCRATA_VISUALIZATION_DESTROY',
      function() {
        visualization.destroy();
        detachInteractionEvents();
        detachApiEvents();
      }
    );

    $element.on(
      'SOCRATA_VISUALIZATION_INVALIDATE_SIZE',
      handleInvalidateSize
    );
    $element.on(
      'SOCRATA_VISUALIZATION_RENDER_VIF',
      handleRenderVif
    );
  }

  function attachInteractionEvents() {

    $element.on(
      'SOCRATA_VISUALIZATION_COLUMN_CLICKED',
      handleColumnClicked
    );
    $element.on(
      'SOCRATA_VISUALIZATION_COLUMN_SORT_APPLIED',
      handleColumnSortApplied
    );
    $element.on(
      'SOCRATA_VISUALIZATION_COLUMN_FLYOUT',
      handleColumnFlyout
    );
    $element.on(
      'SOCRATA_VISUALIZATION_CELL_FLYOUT',
      handleCellFlyout
    );
    $element.on(
      'SOCRATA_VISUALIZATION_PAGINATION_PREVIOUS',
      handlePrevious
    );
    $element.on(
      'SOCRATA_VISUALIZATION_PAGINATION_NEXT',
      handleNext
    );
    $element.on(
      'SOCRATA_VISUALIZATION_TABLE_COLUMNS_RESIZED',
      handleColumnsResized
    );
  }

  function detachApiEvents() {

    $element.off(
      'SOCRATA_VISUALIZATION_INVALIDATE_SIZE',
      handleInvalidateSize
    );
    $element.off(
      'SOCRATA_VISUALIZATION_RENDER_VIF',
      handleRenderVif
    );
  }

  function detachInteractionEvents() {

    $element.off(
      'SOCRATA_VISUALIZATION_COLUMN_CLICKED',
      handleColumnClicked
    );
    $element.off(
      'SOCRATA_VISUALIZATION_COLUMN_SORT_APPLIED',
      handleColumnSortApplied
    );
    $element.off(
      'SOCRATA_VISUALIZATION_COLUMN_FLYOUT',
      handleColumnFlyout
    );
    $element.off(
      'SOCRATA_VISUALIZATION_CELL_FLYOUT',
      handleCellFlyout
    );
    $element.off(
      'SOCRATA_VISUALIZATION_PAGINATION_PREVIOUS',
      handlePrevious
    );
    $element.off(
      'SOCRATA_VISUALIZATION_PAGINATION_NEXT',
      handleNext
    );
    $element.off(
      'SOCRATA_VISUALIZATION_TABLE_COLUMNS_RESIZED',
      handleColumnsResized
    );
  }

  function render() {

    if (renderState.error) {
      return visualization.renderError();
    }

    visualization.hideBusyIndicator();

    pager.render(computePagerOptions());
    visualization.render(renderState.vif, renderState.fetchedData);
  }

  function handleColumnSortApplied(event) {
    const dataSourceType = _.get(renderState, 'vif.series[0].dataSource.type');

    if (dataSourceType === 'socrata.inline') {
      return;
    }

    utils.assertIsOneOfTypes(event.originalEvent.detail.columnName, 'string');
    utils.assertIsOneOfTypes(event.originalEvent.detail.ascending, 'boolean');

    if (renderState.busy) {
      return;
    }

    const payload = event.originalEvent.detail;

    utils.assert(
      _.includes(
        _.map(renderState.fetchedData.columns, 'fieldName'),
        payload.columnName
      ),
      `Column name not found to sort by: ${payload.columnName}`
    );

    const newOrder = [payload];

    _.set(renderState.vif, 'configuration.order', newOrder);

    setDataQuery(
      renderState.vif,
      0,
      renderState.fetchedData.pageSize,
      _.get(renderState.vif, 'configuration.order')
    );
  }

  function handleColumnClicked(event) {
    const dataSourceType = _.get(renderState, 'vif.series[0].dataSource.type');

    if (dataSourceType === 'socrata.inline') {
      return;
    }

    utils.assertIsOneOfTypes(event.originalEvent.detail, 'string');

    if (renderState.busy) {
      return;
    }

    const columnName = event.originalEvent.detail;

    utils.assert(
      _.includes(
        _.map(renderState.fetchedData.columns, 'fieldName'),
        columnName
      ),
      `Column name not found to sort by: ${columnName}`
    );

    let alreadySorted = _.isEqual(
      _.get(
        renderState.vif,
        'configuration.order[0].columnName'
      ),
      columnName
    );
    let newOrder;

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

    _.set(renderState.vif, 'configuration.order', newOrder);

    setDataQuery(
      renderState.vif,
      0,
      renderState.fetchedData.pageSize,
      _.get(renderState.vif, 'configuration.order')
    );
  }

  function handleColumnFlyout(event) {
    const payload = event.originalEvent.detail;

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
    const payload = event.originalEvent.detail;

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

  function handlePrevious() {
    const dataSourceType = _.get(renderState, 'vif.series[0].dataSource.type');

    if (dataSourceType === 'socrata.inline') {
      return;
    }

    setDataQuery(
      renderState.vif,
      Math.max(
        0,
        renderState.fetchedData.startIndex - renderState.fetchedData.pageSize
      ),
      renderState.fetchedData.pageSize,
      _.get(renderState.vif, 'configuration.order')
    );
  }

  function handleNext() {
    const dataSourceType = _.get(renderState, 'vif.series[0].dataSource.type');

    if (dataSourceType === 'socrata.inline') {
      return;
    }

    setDataQuery(
      renderState.vif,
      renderState.fetchedData.startIndex + renderState.fetchedData.pageSize,
      renderState.fetchedData.pageSize,
      _.get(renderState.vif, 'configuration.order')
    );
  }

  function handleColumnsResized(event) {
    const columnWidths = event.originalEvent.detail;

    utils.assertInstanceOf(columnWidths, Object);

    _.set(renderState.vif, 'configuration.tableColumnWidths', columnWidths);

    $element[0].dispatchEvent(
      new window.CustomEvent(
        'SOCRATA_VISUALIZATION_VIF_UPDATED',
        {
          detail: _.cloneDeep(renderState.vif),
          bubbles: true
        }
      )
    );
  }

  function handleInvalidateSize() {
    const pageSize = computePageSize();
    const oldPageSize = _.get(renderState, 'fetchedData.pageSize', 0);

    // Canceling inflight requests is hard. If we're currently fetching data,
    // ignore the size change. The size will be rechecked once the current
    // request is complete.
    if (
      !renderState.error &&
      !renderState.busy &&
      oldPageSize !== pageSize
    ) {

      setDataQuery(
        renderState.vif,
        _.get(renderState, 'fetchedData.startIndex', 0),
        pageSize,
        _.get(renderState.vif, 'configuration.order')
      );
    }
  }

  function handleRenderVif(event) {
    const newVif = VifHelpers.migrateVif(
      _.cloneDeep(event.originalEvent.detail)
    );

    // If we are asked to re-render the same vif we don't need to do anything
    // at all.
    if (!_.isEqual(renderState.vif, newVif)) {
      // Note that we do this here and not just call computePageSize() as an
      // argument to setDataQuery below because computePageSize causes the DOM
      // structure of the table to be updated as a side effect, and we need to
      // ensure that happens before we render the actual table data. Things get
      // a little tricky if this happens in setDataQuery's call stack.
      const pageSize = computePageSize();

      if (
        !renderState.error &&
        !renderState.busy
      ) {

        setDataQuery(
          newVif,
          0,
          pageSize,
          _.get(newVif, 'configuration.order')
        );
      }
    }
  }

  function computePagerOptions() {
    // The default state is no fetched data. Render placeholders so that we can
    // determine pager heights.
    const pagerOptions = {
      unit: _.get(renderState.vif, 'series[0].unit'),
      startIndex: 0,
      endIndex: 0,
      datasetRowCount: 0,
      disabled: true
    };

    // If we have fetched data, augment the default state with the appropriate
    // details.
    //
    // Note that we can't just check for the truthiness of renderState.datasetRowCount
    // because it is occasionally NaN, which is a state we can actually handle. In this
    // case we still want to re-render the pager even though we will say 'Row count
    // unavailable', because otherwise the lack of a pager re-render causes the pager
    // to be rendered above, not below, the table rows.
    if (renderState.fetchedData && !_.isNull(renderState.datasetRowCount)) {

      pagerOptions.startIndex = renderState.fetchedData.startIndex;
      pagerOptions.endIndex = Math.min(
        (
          renderState.fetchedData.startIndex +
          renderState.fetchedData.rows.length
        ),
        renderState.datasetRowCount
      );
      pagerOptions.datasetRowCount = renderState.datasetRowCount;
      pagerOptions.disabled = (
        renderState.busy ||
        !_.isFinite(renderState.datasetRowCount)
      );
    }

    return pagerOptions;
  }

  function computePageSize() {

    if (renderState.error) {
      return 0;
    }

    const overallHeight = $element.find('.socrata-visualization-container').height();
    const pagerHeight = $element.find('.socrata-pager').outerHeight();
    const heightRemaining = overallHeight - pagerHeight;

    return visualization.howManyRowsCanFitInHeight(heightRemaining);
  }

  /**
   * Data Requests
   */

  function handleSetDataQueryError(error) {

    if (window.console && _.isFunction(window.console.error)) {

      console.error(
        `Error while fulfilling table data request: ${JSON.stringify(error)}`
      );
    }

    // There was an issue populating this table with data. Retry?
    updateState({ busy: false, error: true });

    return Promise.reject();
  }

  function setDataQuery(
    vifForDataQuery,
    startIndex,
    pageSize,
    order
  ) {

    const dataSourceType = _.get(vifForDataQuery, 'series[0].dataSource.type');

    switch (dataSourceType) {

      case 'socrata.inline':
        return setInlineDataQuery(vifForDataQuery);

      case 'socrata.soql':
        return setSoqlDataQuery(vifForDataQuery, startIndex, pageSize, order);

      default:
        return Promise.reject(
          `Invalid data source type in vif: '${dataSourceType}'.`
        );
    }
  }

  function setInlineDataQuery(vifWithInlineData) {

    if (renderState.busy) {
      throw new Error(
        'Cannot call setDataQuery while a request already in progress.'
      );
    }

    $element.trigger('SOCRATA_VISUALIZATION_DATA_LOAD_START');

    // Temporarily detach interaction events so that intermediate states in the
    // data request and render cycle do not trigger flyouts or other UI
    // changes. Interaction events are reattached when the visualization is no
    // longer 'busy'.
    detachInteractionEvents();

    updateState({ busy: true });

    const inlineDataProvider = new InlineDataProvider(vifWithInlineData);
    const newState = {
      busy: false,
      datasetRowCount: inlineDataProvider.getTotalRowCount(),
      error: false,
      fetchedData: {
        columns: inlineDataProvider.getColumns(),
        order: null,
        pageSize: inlineDataProvider.getRowCount(),
        rows: inlineDataProvider.getRows(),
        startIndex: inlineDataProvider.getStartIndex(),
      },
      vif: vifWithInlineData
    };

    $element.trigger('SOCRATA_VISUALIZATION_DATA_LOAD_COMPLETE');

    utils.assert(
      // Rows can either be undefined OR of the exact length of the
      // displayableColumns OR MAX_COLUMN_COUNT, if the
      // displayableColumns has more than MAX_COLUMN_COUNT items.
      _.every(
        newState.fetchedData.rows,
        (row) =>
          !row ||
          row.length === newState.fetchedData.columns.length ||
          row.length === MAX_COLUMN_COUNT
      ),
      'Encountered row with length other than view column count or ' +
      `MAX_COLUMN_COUNT (${MAX_COLUMN_COUNT}).`
    );

    // Pad/trim row count to fit display.
    if (newState.fetchedData.rows.length >= newState.fetchedData.pageSize) {
      newState.fetchedData.rows.length = newState.fetchedData.pageSize;
    } else {

      let numberOfRowsToPad = (
        newState.fetchedData.pageSize - newState.fetchedData.rows.length
      );

      for (let i = 0; i < numberOfRowsToPad; i++) {
        newState.fetchedData.rows.push(null);
      }
    }

    updateState(newState);

    return Promise.resolve(true);
  }

  function setSoqlDataQuery(
    vifForDataQuery,
    startIndex,
    pageSize,
    order
  ) {

    utils.assertHasProperties(
      originalVif,
      'series[0].dataSource.datasetUid',
      'series[0].dataSource.domain'
    );

    const whereClauseComponents = SoqlHelpers.whereClauseFilteringOwnColumn(
      vifForDataQuery,
      0
    );

    const dataProviderConfig = {
      datasetUid: _.get(vifForDataQuery, 'series[0].dataSource.datasetUid'),
      domain: _.get(vifForDataQuery, 'series[0].dataSource.domain')
    };

    if (_.has(vifForDataQuery, 'series[0].dataSource.readFromNbe')) {
      dataProviderConfig.readFromNbe = _.get(vifForDataQuery, 'series[0].dataSource.readFromNbe');
    }

    function isNotGeoColumn(column) {
      return !column.dataTypeName.match(/(location|point|polygon|line)$/i);
    }

    function getSortOrder(datasetMetadata, displayableColumns) {
      const isDefault = _.includes(datasetMetadata.flags, 'default');
      const isGrouped = _.has(datasetMetadata, 'query.groupBys');

      // Get the default sort from the query property (note that if this is the NBE copy, this
      // query might not be the same as the query in the OBE copy)
      const defaultSort = _.chain(datasetMetadata).
        get('query.orderBys', []).
        map((columnOrder) => {
          const columnId = _.get(columnOrder, 'expression.columnId');
          const column = _.find(datasetMetadata.columns, (col) => col.id === columnId);

          if (_.has(column, 'fieldName') && isNotGeoColumn(column)) {
            return {
              ascending: columnOrder.ascending,
              columnName: column.fieldName
            };
          } else {
            return null;
          }
        }).
        compact().
        take(1).
        value();

      if (!_.isEmpty(defaultSort)) {
        return defaultSort;
      } else if (isDefault || !isGrouped) {
        // if this is a default view or a derived view that does not have group bys, we can safely
        // use the system id to sort if there isn't a sort order in the VIF.
        return [{
          ascending: true,
          columnName: ':id'
        }];
      } else {
        // if this is a grouped view that doesn't have a sort order in the VIF, let's take an
        // educated guess at which column we should sort by.
        const sortableColumn = _.find(displayableColumns, (column) => {
          return _.has(column, 'fieldName') && isNotGeoColumn(column);
        });

        if (!_.isObject(sortableColumn)) {
          return Promise.reject(
            'No sortable column detected.'
          );
        }

        return [{
          ascending: true,
          columnName: sortableColumn.fieldName
        }];
      }
    }

    function getSoqlDataUsingDatasetMetadata(datasetMetadata) {
      const displayableColumns = new MetadataProvider(dataProviderConfig, true).
        getDisplayableColumns(datasetMetadata).
        slice(0, MAX_COLUMN_COUNT);

      let displayableColumnsFieldNames = _.map(displayableColumns, 'fieldName');

      // If the order in the VIF is undefined, we need to find a column to sort the table by
      if (_.isUndefined(order)) {
        order = getSortOrder(datasetMetadata, displayableColumns);

        // Update order in vifForDataQuery so we can visually indicate which column the table is
        // being sorted by
        _.set(vifForDataQuery, 'configuration.order', order);

      } else if (order.length !== 1) {
        return Promise.reject(
          'Order parameter must be an array with exactly one element.'
        );
      }

      const soqlDataProvider = new SoqlDataProvider(dataProviderConfig, true);

      const soqlRowCountPromise = getMemoizedRowCount(
        soqlDataProvider,
        whereClauseComponents,
        datasetMetadata.rowsUpdatedAt
      );
      const soqlDataPromise = soqlDataProvider.getTableData(
        displayableColumnsFieldNames,
        order,
        startIndex,
        pageSize,
        whereClauseComponents
      );

      Promise.all([
        soqlRowCountPromise,
        soqlDataPromise
      ]).
        then(function(responses) {
          const [soqlRowCount, soqlData] = responses;
          const columns = displayableColumns.filter((displayableColumn) => {
            return _.includes(
              displayableColumnsFieldNames,
              displayableColumn.fieldName
            )
          });
          const newState = {
            busy: false,
            datasetRowCount: soqlRowCount,
            error: false,
            fetchedData: {
              rows: [],
              columns: columns,
              startIndex: startIndex,
              pageSize: pageSize,
              order: order,
              whereClauseComponents: whereClauseComponents
            },
            vif: vifForDataQuery,
          };

          $element.trigger('SOCRATA_VISUALIZATION_DATA_LOAD_COMPLETE');

          utils.assert(
            // Rows can either be undefined OR of the exact length of the
            // displayableColumns OR MAX_COLUMN_COUNT, if the
            // displayableColumns has more than MAX_COLUMN_COUNT items.
            _.every(
              soqlData.rows,
              (row) =>
                !row ||
                row.length === displayableColumnsFieldNames.length ||
                row.length === MAX_COLUMN_COUNT
            ),
            'Encountered row with length other than view column count or ' +
            `MAX_COLUMN_COUNT (${MAX_COLUMN_COUNT}).`
          );

          // Pad/trim row count to fit display.
          if (soqlData.rows.length >= pageSize) {
            soqlData.rows.length = pageSize;
          } else {

            let numberOfRowsToPad = pageSize - soqlData.rows.length;

            for (let i = 0; i < numberOfRowsToPad; i++) {

              soqlData.rows.push(null);
            }
          }

          newState.fetchedData.rows = soqlData.rows;

          updateState(newState);
        }).
        catch(handleSetDataQueryError);
    }

    visualization.showBusyIndicator();

    if (renderState.busy) {
      throw new Error(
        'Cannot call setDataQuery while a request already in progress.'
      );
    }

    $element.trigger('SOCRATA_VISUALIZATION_DATA_LOAD_START');

    // Temporarily detach interaction events so that intermediate states in the
    // data request and render cycle do not trigger flyouts or other UI
    // changes. Interaction events are reattached when the visualization is no
    // longer 'busy'.
    detachInteractionEvents();

    updateState({ busy: true });

    return getMemoizedDatasetMetadata(dataProviderConfig).
      then(getSoqlDataUsingDatasetMetadata).
      catch(handleSetDataQueryError);
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

    if (
      !_.isEqual(renderState.vif, newState.vif) ||
      !_.isEqual(renderState, newState)
    ) {

      const becameIdle = !newState.busy && renderState.busy;
      const changedOrder = (
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

      if (changedOrder) {

        $element[0].dispatchEvent(
          new window.CustomEvent(
            'SOCRATA_VISUALIZATION_VIF_UPDATED',
            {
              detail: _.cloneDeep(renderState.vif),
              bubbles: true
            }
          )
        );
      }

      if (becameIdle) {

        // Re-attach interaction events if the visualization has become idle
        // again and is ready to respond to user input.
        attachInteractionEvents();
        render();
      }
    }
  }

  initialize();
};

module.exports = $.fn.socrataTable;
