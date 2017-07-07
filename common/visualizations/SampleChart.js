/**
 * The jQuery plugin is a wrapper around a visualization implementation. Its
 * job is to fetch data, transform it into the format expected by its
 * corresponding visualization implementation, and to provide a uniform, event-
 * based public interface for the capabilities provided by said visualization.
 *
 * See API.md for more details.
 */

const $ = require('jquery');
// Socrata Utils provides utility functions like asserts and polyfills.
const utils = require('common/js_utils');
// As described above and elsewhere, this jQuery plugin wraps the underlying
// visualization implementation, in this case located at
// '/src/views/SampleChart.js'.
const SampleChart = require('./views/SampleChart');

// As noted above, each jQuery plugin combines a visualization implementation
// with one or more data providers, which are used to query data sources and
// transform the responses from those data sources into the format expected by
// the visualization implementation which is being wrapped by the jQuery
// plugin.
const SoqlDataProvider = require('./dataProviders/SoqlDataProvider');

// We will also allow the vif to specify the data source type of
// 'socrata.sample', which is handled by the SampleDataProvider.
const SampleDataProvider = require('./dataProviders/SampleDataProvider');

// VifHelpers provides helper functions used to migrate between versions of
// vif. For new chart implementations there is likely no need to make use of
// these functions, but it is required here inform the reader of its existence
// and capabilities.
const VifHelpers = require('./helpers/VifHelpers');

// SoqlHelpers provides helper functions used to extract sufficient information
// from a provided vif and build query clauses for use against Socrata SoQL-
// based API endpoints.
const SoqlHelpers = require('./dataProviders/SoqlHelpers');

// All localization in this project is handled by the I18n class, which reads
// from locale files in /src/locales. It defaults to English. All user-facing
// strings should be retreived from the I18n class, not hard-coded.
const I18n = require('common/i18n').default;

// The SoqlVifValidator class verifies that all configuration properties that
// are required by a jQuery plugin and/or its corresponding visualization
// implementation are present and of the correct type. All new jQuery plugin
// and visualization implementations should add the appropriate checks to the
// SoqlVifValidator and the appropriate error messages to the locale file(s).
const getSoqlVifValidator = require('./dataProviders/SoqlVifValidator.js').
  getSoqlVifValidator;

// We place constants that are unique to the implementation at the top of the
// file, with a line separating them from imports/requires.
const MAX_ITEM_COUNT = 2;
// Although we only want to allow two items in query responses, we will ask for
// three so we can determine when the user has selected a dimension or measure
// that will return more than the expected number of rows. If we were to simply
// limit the query to 2 items it would not be clear to the user when data from
// the query response is truncated.
const BASE_QUERY = (
  // Identification of dimension and measure.
  'SELECT {0} AS {1}, COUNT(*) AS {2} ' +
  // Where clause.
  '{3} ' +
  // Order by dimension by default.
  'GROUP BY {0} ' +
  'ORDER BY {0} ' +
  // Additional visualization-specific clauses. In this case, we are querying
  // for categorical data so we want to put nulls last and limit it to 3 as
  // explained above.
  'NULL LAST LIMIT 3'
);
// The window resize rerender delay is the number of milliseconds to wait after
// a window resize event before calling .invalidateSize() on the underlying
// visualization so that it can respond to potential changes in the dimensions
// of its container. We actually add a small amount of jitter to this value to
// prevent multiple visualizations on a single page from all attempting to call
// .invalidateSize() at the same moment, but this is done inside the event
// handler.
const WINDOW_RESIZE_RERENDER_DELAY = 200;

// All jQuery plugins should extend jQuery with a name beginning with
// 'socrata...', and should take a vif as a single argument.
$.fn.socrataSampleChart = function(originalVif) {
  // The following four statements are common to all jQuery plugin
  // implementations to date, and should be included in all implementations
  // both because they will be necessary but also to reduce cognitive overhead
  // for future maintainers.
  const $element = $(this);
  // In this case, the underlying visualization will be an instance of
  // SampleChart, but all visualization implementations accept two arguments to
  // their constructors: the element in which the visualization should be
  // rendered and the initial vif to be rendered. We can render a different vif
  // after instantiation using the standard <visualization>.render() method.
  const visualization = new SampleChart($element, originalVif);

  // All visualizations must respond to changes in their container's size. The
  // host application is responsible for doing this explicitly if the container
  // is resized according to its own internal logic, but we want to watch for
  // window size changes and rerender the visualization in response to them.
  // This variable stores the timeout id used by the rerender-on-window-resize
  // logic so that it can be debounced.
  let rerenderOnResizeTimeout;

  /**
   * Event handling
   */

  // jQuery plugins and their corresponding visualization implementations are
  // required to respond to the events which constitute the uniform public
  // interface. These include:
  //
  //   1. SOCRATA_VISUALIZATION_RENDER_VIF
  //   2. SOCRATA_VISUALIZATION_INVALIDATE_SIZE
  //   3. SOCRATA_VISUALIZATION_DESTROY
  //
  // These events and how visualizations should respond to them are documented
  // in API.md.
  //
  // Since these are core behaviors to all visualizations, we attach them using
  // their own function which should be called once upon instantiation.
  function attachApiEvents() {

    // Destroy on (only the first) 'SOCRATA_VISUALIZATION_DESTROY' event.
    // jQuery will automatically de-register this handler after it is invoked
    // once, so there is no need to do so manually in detachApiEvents.
    $element.one('SOCRATA_VISUALIZATION_DESTROY', function() {
      clearTimeout(rerenderOnResizeTimeout);
      visualization.destroy();
      detachInteractionEvents();
      detachApiEvents();
    });

    $(window).on('resize', handleWindowResize);

    $element.on(
      'SOCRATA_VISUALIZATION_RENDER_VIF',
      handleRenderVif
    );
    $element.on(
      'SOCRATA_VISUALIZATION_INVALIDATE_SIZE',
      handleInvalidateSize
    );
  }

  // We may want to be able to disable interaction at some points during a
  // visualization's lifecycle (e.g. when data is being loaded). Accordingly,
  // all visualizations should also implement an attachInteractionEvents
  // function which enables handling of events not related to the event-based
  // API.
  function attachInteractionEvents() {

    $element.on(
      'SOCRATA_VISUALIZATION_SAMPLE_USER_ACTION',
      handleSampleUserAction
    );

    $element.on(
      'SOCRATA_VISUALIZATION_SAMPLE_CHART_FLYOUT',
      handleFlyout
    );
  }

  // In the same way that we attach API and interaction events separately, we
  // will also want to detach them separately. The detachApiEvents function
  // should be called once upon destruction of the instance and no earlier.
  function detachApiEvents() {

    $(window).off('resize', handleWindowResize);

    $element.off(
      'SOCRATA_VISUALIZATION_INVALIDATE_SIZE',
      visualization.invalidateSize
    );
    $element.off(
      'SOCRATA_VISUALIZATION_RENDER_VIF',
      handleRenderVif
    );
  }

  // The detachInteractionEvents function should be called when it is desirable
  // to temporarily disable interaction. Don't forget to call
  // attachInteractionEvents again when you want to re-enable it.
  function detachInteractionEvents() {

    $element.off(
      'SOCRATA_VISUALIZATION_SAMPLE_USER_ACTION',
      handleSampleUserAction
    );

    $element.off(
      'SOCRATA_VISUALIZATION_SAMPLE_CHART_FLYOUT',
      handleFlyout
    );
  }

  // This function works well enough and you can probably just leave it as-is.
  function handleWindowResize() {

    clearTimeout(rerenderOnResizeTimeout);

    rerenderOnResizeTimeout = setTimeout(
      visualization.invalidateSize,
      // Add some jitter in order to make sure multiple visualizations are
      // unlikely to all attempt to rerender themselves at the exact same
      // moment.
      WINDOW_RESIZE_RERENDER_DELAY + Math.floor(Math.random() * 10)
    );
  }

  // A jQuery plugin should respond to the SOCRATA_VISUALIZATION_RENDER_VIF
  // event by:
  //
  //   1. Verifying that the provided vif (at event.originalEvent.detail if
  //      using jQuery to attach the event handler) is significantly different
  //      from the already-rendered vif and returning early if it is not.
  //   2. Causing a new data query and subsequent rerendering of the chart
  //      if the new vif is significantly different from the already-rendered
  //      one.
  function handleRenderVif(event) {
    const newVif = event.originalEvent.detail;

    if (!_.isEqual(visualization.getVif(), newVif)) {

      updateData(
        VifHelpers.migrateVif(newVif)
      );
    }
  }

  // In this context, handling the invalidate size just means proxying to the
  // underlying visualization's invalidateSize method. This function exists
  // to make clear the relationship between receipt of that event and the
  // effect that it should have on the visualization. Since this is an event
  // handler registered with jQuery, it will be invoked with a jQuery event
  // object as the sole argument, but that event object is not used in this
  // function's implementation so is omitted from the signature.
  function handleInvalidateSize() {
    visualization.invalidateSize();
  }

  // This function exists only to show how user interactions should be handled
  // in terms of event-based communication between the visualization and plugin
  // layers. In real use it should not use the
  // SOCRATA_VISUALIZATION_SAMPLE_USER_ACTION name, and the implementation of
  // this handler will vary according to the user action's purpose.
  function handleSampleUserAction() {
    // Pass-through
  }

  // As per the documentation in API.md, the jQuery plugin is responsible for
  // emitting all external-facing events. In this case it simply proxies the
  // SOCRATA_VISUALIZATION_SAMPLE_CHART_FLYOUT event.
  function handleFlyout(event) {
    // Emitting a SOCRATA_VISUALIZATION_FLYOUT event with a payload of null
    // tells the flyout renderer to hide the flyout; emitting this event with
    // a non-null payload will cause any FlyoutRenderer instance receiving it
    // to attempt to render a flyout.
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

  // The base visualization class from which individual visualization
  // implementations inherit provides a standard way to render errors.
  //
  // It may be useful to log errors to the console, and there may be
  // some logic involved in determining which error to actually render,
  // so most jQuery plugins will provide a handleError function that can
  // be called when the data pipeline breaks in some way.
  function handleError(error) {

    if (window.console && console.error) {
      console.error(error);
    }

    let messages;

    if (error.errorMessages) {
      messages = error.errorMessages;
    } else {
      messages = I18n.t('shared.visualizations.charts.common.error_generic')
    }

    visualization.renderError(messages);
  }

  // All jQuery plugins should implement a top-level data fetching function
  // that takes a vif as an argument and converts it into a query, the response
  // of which will then be transformed into the internal format expected by the
  // accompanying visualization implementation. Most jQuery plugins also define
  // a number of helper functions which are called by updateData.
  //
  // When updateData is called it should immediately emit the
  // SOCRATA_VISUALIZATION_DATA_LOAD_START event, and when the data fetching
  // process is complete the jQuery plugin should emit the corresponding
  // SOCRATA_VISUALIZATION_DATA_LOAD_COMPLETE event. These two events can be
  // tracked by host applications to measure query performance and also to
  // selectively enable/disable UI capabilities based on the 'ready' state of
  // the jQuery plugin/visualization.
  //
  // The base visualization class from which individual visualization
  // implementations inherit additionally provides a showBusyIndicator method
  // which should be called at the beginning of updateData, and which will show
  // a spinner on the visualization itself. Once the visualization enters the
  // 'ready' state again, the companion hideBusyIndicator method should be
  // called to dismiss the spinner.
  //
  // If it is desirable to disable interaction events while data is loading,
  // the detachInteractionEvents and attachInteractionEvents functions should
  // be called at the same time that the corresponding busy indicator methods
  // are called.
  function updateData(newVif) {

    $element.trigger('SOCRATA_VISUALIZATION_DATA_LOAD_START');
    visualization.showBusyIndicator();

    // Each visualization is responsible for validating vifs that it is given.
    // It does this by exporting (and calling internally) a function called
    // validateVif. This method is exported so that host applications can test
    // the validity of vifs in their authoring experiences and display relevant
    // errors to the user before attempting to render an invalid vif.
    //
    // In the case of our sample chart, we only want to verify that there is at
    // least one series. Other more complex visualizations may place additional
    // requirements on vifs that they are asked to render.
    $.fn.socrataSampleChart.
      validateVif(newVif).
      then(() => {
        // Although we do not currently make use of the capability in public-
        // facing products, all visualization implementations are expected to
        // be able to render multiple series. Accordingly, we map over the
        // series in the provided vif and create a data request for each.
        const dataRequests = newVif.
          series.
          map((series, seriesIndex) => {

            switch (series.dataSource.type) {

              // In the future we may want to allow for non-Socrata/SoQL data
              // sources, so we allow for multiple dataSource types by default.
              case 'socrata.soql':
                return makeSocrataDataRequest(newVif, seriesIndex);

              case 'socrata.sample':
                return makeSampleDataRequest(newVif, seriesIndex);

              // Add other cases here for non-Socrata/SoQL data source types as
              // necessary.

              default:
                return Promise.reject(
                  'Invalid/unsupported series dataSource.type: ' +
                  `"${series.dataSource.type}".`
                );
            }
          });

        // Here we consolidate all of the data requests so that we can know
        // unambiguously when we are ready to render the visualization.
        Promise.
          all(dataRequests).
          then((dataResponses) => {

            $element.trigger('SOCRATA_VISUALIZATION_DATA_LOAD_COMPLETE');
            visualization.hideBusyIndicator();


            let overMaxItemCount = dataResponses.
              some((response) => response.rows.length > MAX_ITEM_COUNT);

            // In the case of our default chart, we only want to allow for two
            // distinct values. MAX_ITEM_COUNT has been set to 2 at the top of
            // this file, and we will show an error if more than two rows are
            // returned by any query.
            if (overMaxItemCount) {

              visualization.renderError(
                I18n.t(
                  'shared.visualizations.charts.sample_chart.error_exceeded_max_item_count'
                ).format(MAX_ITEM_COUNT)
              );
            // If the data responses all conform to our requirement that they
            // have no more than two rows, then we can render the chart.
            } else {
              visualization.render(newVif, dataResponses);
            }
          });
      }).catch(handleError);
  }

  // This function exists to, given a vif and a series index, create a query
  // against a Socrata/SoQL data source.
  function makeSocrataDataRequest(vifToRender, seriesIndex) {
    const series = _.get(vifToRender, `series[${seriesIndex}]`);
    // Data providers exist to provide a standardized interface for common
    // data sources. We currently supply data providers for SoQL queries as
    // well as a few Socrata-based sources of metadata. In this case we are
    // only making queries against the SoQL API, so we only make use of the
    // SoqlDataProvider.
    const soqlDataProvider = new SoqlDataProvider({
      datasetUid: _.get(series, 'dataSource.datasetUid'),
      domain: _.get(series, 'dataSource.domain')
    });
    // The next few assignments show how Soql helpers can be used to extract
    // relevant details from a vif.
    const dimension = SoqlHelpers.dimension(vifToRender, seriesIndex);
    const measure = SoqlHelpers.measure(vifToRender, seriesIndex);
    const whereClauseComponents = SoqlHelpers.whereClauseFilteringOwnColumn(
      vifToRender,
      seriesIndex
    );
    const whereClause = (whereClauseComponents.length > 0) ?
        `WHERE ${whereClauseComponents}` :
        '';
    // Sometimes charts may need to query data differently depending on whether
    // or not they are being aggregated. See the implementation of
    // SvgColumnChart for an example of how this is done. In this case,
    // however, we won't bother.
    const queryString = BASE_QUERY.format(
      dimension,
      SoqlHelpers.dimensionAlias(),
      SoqlHelpers.measureAlias(),
      whereClause
    );

    // After we have substituted the relevant fields into the template query
    // we dispatch it to the data provider (removing consecutive spaces that
    // may be left over from the templating step).
    return soqlDataProvider.
      query(
        queryString.replace(/\s+/, ' '),
        SoqlHelpers.dimensionAlias(),
        SoqlHelpers.measureAlias()
      ).
      then((queryResponse) => {
        // Roughly speaking, the dimension corresponds to the x-axis of a chart
        // and the measure corresponds to the y-axis.
        const dimensionIndex = queryResponse.
          columns.
          indexOf(SoqlHelpers.dimensionAlias());
        const measureIndex = queryResponse.
          columns.
          indexOf(SoqlHelpers.measureAlias());

        // For convenience, we will substitute the aliases used in the SoQL
        // query to prevent accidental shadowing of column names with the
        // strings 'dimension' and 'measure'. This will make the data slightly
        // easier to look at after it is passed through to the visualization
        // implementation.
        queryResponse.columns[dimensionIndex] = 'dimension';
        queryResponse.columns[measureIndex] = 'measure';

        // Since SoQL query results are returned as strings, in this case we
        // will want to map over the response rows and cast the row values to
        // numbers.
        queryResponse.
          rows.
          forEach((row) => {
          let valueAsNumber;

            try {

              if (typeof row[measureIndex] === 'undefined') {
                valueAsNumber = null;
              } else {
                valueAsNumber = Number(row[measureIndex]);
              }
            } catch (error) {

              console.error(
                'Could not convert measure value to number: {0}'.
                  format(row[measureIndex])
              );

              valueAsNumber = null;
            }

            row[measureIndex] = valueAsNumber;
          });

        // At this point we have transformed the raw query response to a format
        // that can be used by the visualization implementation with the least
        // possible friction.
        return queryResponse;
      });
  }

  // As part of this collection of sample files, we will additionally support
  // the SampleDataProvider, which is documented in the same way as this file.
  // Refer to src/dataProviders/SampleDataProvider.js for implementation
  // details and guidance.
  function makeSampleDataRequest(vifToRender, seriesIndex) {
    const seriesDataSource = _.get(
      vifToRender,
      `series[${seriesIndex}].dataSource`
    );
    // Data providers exist to provide a standardized interface for common
    // data sources. In this case we will use the StaticDataProvider to read
    // the data directly from the vif.
    const sampleDataProvider = new SampleDataProvider();

    return sampleDataProvider.readDataFromSeriesDataSource(seriesDataSource);
  }

  // Add a make<Something>DataRequest function here to enable the querying of
  // non-Socrata/SoQL data sources. Its signature should conform to that of
  // makeSocrataDataRequest and makeSampleDataRequest above:
  //
  //   <functionName>(vifToRender, seriesIndex).

  /**
   * Actual execution starts here
   */

  // As detailed above, we only want to call attachApiEvents once, upon
  // instantiation of the jQuery plugin.
  attachApiEvents();
  // Since we won't be disabling interaction events at any point during the
  // sample chart's lifecycle, we can just call attachInteractionEvents here
  // where it will be invoked on instantiation only.
  attachInteractionEvents();
  // We kick off the actual chart's behavior by calling updateData, which will
  // render the chart once its queries return.
  updateData(originalVif);

  return this;
};

// Checks a VIF for compatibility with this visualization.
// The intent of this function is to provide feedback while
// authoring a visualization, not to provide feedback to a developer.
// As such, messages returned are worded to make sense to a user.
//
// Returns a Promise.
//
// If the VIF is usable, the promise will resolve.
// If the VIF is not usable, the promise will reject with an object:
// {
//   ok: false,
//   errorMessages: Array<String>
// }
$.fn.socrataSampleChart.validateVif = (vif) => {

  return getSoqlVifValidator(vif).
    then((validator) => {

      return validator.
        requireAtLeastOneSeries().
        toPromise();
    });
};

module.exports = $.fn.socrataSampleChart;
