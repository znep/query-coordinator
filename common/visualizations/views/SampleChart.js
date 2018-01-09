/**
 * The visualization implementation's job is to render data provided to it, to
 * render errors where appropriate, and to communicate user actions up to the
 * wrapper for dispatch in the form of the Socrata Visualizations Event API.
 *
 * See API.md for more details.
 */

const _ = require('lodash');
const $ = require('jquery');
// All visualizations should extend the SvgVisualization base class, which
// provides rendering capabilities for the chart title, description, axis
// titles, info messages and the busy indicator. It also provides the source
// of truth for the current vif and helper methods for querying its
// configuration properties. See API.md for a description of these
// capabilities.
const SvgVisualization = require('./SvgVisualization');
const I18n = require('common/i18n').default;

// In other implementations these values are eyeballed to provide enough space
// for axis labels that have been observed 'in the wild'. In this case,
// however, we can simply set all of them to 0.
const MARGINS = {
  TOP: 0,
  RIGHT: 0,
  BOTTOM: 0,
  LEFT: 0
};
// In order to provide some resilience in the face of potentially-overbearing
// stylesheets in use by the host application, we assign as many styles as
// possible inline, rather than using a stylesheet ourselves. This should
// have the effect of our explicit style choices taking precedence most of the
// time, and if someone is using specific selectors or !important in the host
// application's stylesheet and targeting chart elements, they either know what
// they are doing and we should respect it, or they don't know what they are
// doing and this will be a good learning opportunity as they debug the issue.
const FONT_STACK = '"Open Sans", "Helvetica", sans-serif';
const MEASURE_LABELS_FONT_SIZE = 24;
const MEASURE_LABELS_FONT_COLOR = '#fff';
// Define the 'true' and 'false' colors used by the visualization. These are
// green for yes and red for no.
const DATUM_BACKGROUND_COLOR_TRUE = '#20b05c';
const DATUM_BACKGROUND_COLOR_FALSE = '#d06463';

function SampleChart($element, vif) {
  const self = this;

  let $chartElement;
  // We typically find it useful to keep a cached copy of the data that has
  // been rendered. Clearly this can cause the visualization to consume a fair
  // bit of memory and if you anticipate constructing a visualization which
  // would involve more than 1000 rows or so consider writing it in such a way
  // that it is not necessary to cache it.
  let dataToRender;

  // All visualization implementations should extend the SvgVisualization base
  // class.
  _.extend(this, new SvgVisualization($element, vif));

  // It has been found useful to separate the rendering of the html skeleton
  // for a visualization from the rendering of the chart itself. It is a
  // convention in this project to name one function `renderTemplate` and the
  // other `renderData`. It is usually sufficient to call `renderTemplate` once
  // when the visualization is instantiated, but we may want to call
  // `renderData` many times over the lifetime of a visualization.
  renderTemplate();
  // Since the implementation of `attachEvents` uses event delegation and only
  // binds to the visualization's root element, we can rely on calling it once
  // upon instantiation. We will still need to call `detachEvents` before
  // destroying the visualization instance, however.
  attachEvents();

  /**
   * Public methods
   */

  // All visualization implementations must expose three public methods:
  //
  //   1. render(newVif, newData)
  //   2. invalidateSize()
  //   3. destroy()
  //
  // In the case of the render method, both arguments are optional. Calling
  // render with no arguments should be a no-op.
  this.render = function(newVif, newData) {

    // We want to exit as early as possible, and if there is no new data and
    // no data already cached then we can safely ignore this invocation.
    if (!newData && !dataToRender) {
      return;
    }

    // If we have data to render we by definition do not want to render an
    // error, and can rely on the SvgVisualization base class to handle this
    // for us.
    this.clearError();

    // If we are passed a vif we can let the SvgVisualization base class
    // do the replacement for us (which may include migration to a newer
    // vif version).
    if (newVif) {
      this.updateVif(newVif);
    }

    // If we are passed data then we want to update the visualization's
    // internally-cached copy of the data, which is read by the `renderData`
    // function which is called immediately afterward. We keep the data
    // cached inside this closure to make it easier to interrogate in response
    // to user actions after the data has been initially rendered (e.g. when
    // looking up details about the datum the user has moved the mouse over
    // when rendering a flyout).
    if (newData) {
      dataToRender = newData;
    }

    renderData();
  };

  this.invalidateSize = function() {

    // We only need to re-render the data if the template has been rendered
    // and there is data to render. Due to the event-based API is possible that
    // host applications might attempt to invalidate the size of the
    // visualization while network requests for data are in-flight, and we need
    // to ensure that those attempts are ignored (otherwise the `renderData`
    // function might attempt to read from DOM elements that have not yet been
    // created or data that has not yet been cached).
    if ($chartElement && dataToRender) {
      renderData();
    }
  };

  // The destroy method should unwind and clean up after itself. De-register
  // any event handlers (there are none in this implementation) and then remove
  // any DOM nodes that have been added by the visualization.
  this.destroy = function() {

    // First we detach the events we attached upon instantiation.
    detachEvents();

    // Next we remove the actual chart which we have rendered, and then we
    // remove the visualization container which was added to the DOM by the
    // SvgVisualization base class. In both cases we use jQuery to do so in
    // order to avoid accidentally leaving event handlers attached.
    //
    // If we were using d3, we would want to use d3's `remove` method on the
    // chart element instead so that it would handle unbinding things it may
    // have bound to the DOM in the course of rendering the chart.
    $chartElement.remove();

    self.
      $element.
      find('.socrata-visualization-container').
      remove();
  };

  /**
   * Private methods
   */

  function renderTemplate() {

    // Note that we apply styles inline in order to reduce our dependencies on
    // extrernal stylesheets and to mitigate the effects of styles that the
    // host application loads having unexpected interactions on the chart.
    $chartElement = $(
      '<div>',
      {
        'class': 'sample-chart',
        'style': `
          position: relative;
          display: block;
          width: 100%;
          height: 100%;
        `
      }
    );

    self.
      $element.
      find('.socrata-visualization-container').
      append($chartElement);
  }

  // The interaction behavior of this implementation is very straightforward:
  // when the user moves the mouse over rendered data or their accompanying
  // labels, we should show a flyout above the label in question and also
  // highlight the rendered data and label. We can use jQuery's event
  // delegation to effectively only attach these events once upon instantiation
  // and then detach them when the visualization is instructed to destroy
  // itself.
  function attachEvents() {
    self.$element.on('mousemove', '.datum', showHighlight);
    self.$element.on('mouseout', '.datum', hideHighlight);

    self.$element.on('mousemove', '.datum', showFlyout);
    self.$element.on('mouseout', '.datum', hideFlyout);
  }

  function detachEvents() {
    self.$element.off('mousemove', '.datum', showHighlight);
    self.$element.off('mouseout', '.datum', hideHighlight);

    self.$element.off('mousemove', '.datum', showFlyout);
    self.$element.off('mouseout', '.datum', hideFlyout);
  }

  function renderData() {
    // In this case we don't want to have any margins around the rendered data,
    // but all visualizations separate the area assigned to them into the
    // container element and a potentially smaller 'viewport' into which the
    // data will be rendered. This separation is kept in place here, but since
    // the margins for this visualization are set to 0 on all sides the effect
    // is that the margins are ignored in practice. Typically the margin sizes
    // are adjusted to provide sufficient whitespace around things rendered by
    // d3, to avoid our having to translate individual elements rendered by d3
    // away from the edges of the container in a consistent way.
    //
    // Importantly, we re-calculate the viewport size every time `renderData`
    // is invoked so that we can respond to changes in the container's
    // dimensions.
    const viewportWidth = (
      $chartElement.width() -
      MARGINS.LEFT -
      MARGINS.RIGHT
    );
    const viewportHeight = (
      $chartElement.height() -
      MARGINS.TOP -
      MARGINS.BOTTOM
    );
    // Although this implementation will only ever look at one series, it is
    // helpful to think about the data as being multi-series in order to avoid
    // decisions that may make adding multi-series support more onerous in the
    // future. Ideally all charts for which it makes sense will support data
    // in multiple series, and potentially from multiple distinct datasets.
    const dimensionIndicesBySeries = dataToRender.
      map((series) => series.columns.indexOf('dimension'));
    const dimensionValuesBySeries = dataToRender.
      map((series, seriesIndex) => {

        return series.
          rows.
          map(
            function(row) {
              return row[dimensionIndicesBySeries[seriesIndex]];
            }
          );
      });
    const measureIndicesBySeries = dataToRender.
      map((series) => series.columns.indexOf('measure'));
    const measureValuesBySeries = dataToRender.
      map((series, seriesIndex) => {

        return series.
          rows.
          map(
            function(row) {
              return row[measureIndicesBySeries[seriesIndex]];
            }
          );
      });

    /* eslint-disable no-unused-vars */
    let width = 0;
    let height = 0;
    /* eslint-enable no-unused-vars */
    let xAxisBound = false;
    let yAxisBound = false;

    /**
     * Functions defined inside the scope of renderData are stateful enough
     * to benefit from sharing variables within a single render cycle.
     */

    // See comment in renderXAxis for an explanation as to why this is
    // separate.
    function bindXAxisOnce() {

      if (!xAxisBound) {

        // If we were using d3 we would set up the x-axis svg elements in this
        // function by making a d3 selection and then invoking .call(d3XAxis)
        // on it, after which we mark xAxisBound as true.
        xAxisBound = true;
      }
    }

    function renderXAxis() {

      // Binding the axis to the svg elements is something that only needs to
      // happen once even if we want to update the rendered properties more
      // than once; separating the bind from the layout in this way allows us
      // to treat renderXAxis as idempotent.
      bindXAxisOnce();

      // If we were using d3 we would update the x-axis svg elements with their
      // new values using d3's standard mechanisms. See the implementation of
      // src/views/SvgColumnChart.js for an example of how this works in
      // practice.
    }

    // See comment in renderYAxis for an explanation as to why this is
    // separate.
    function bindYAxisOnce() {

      if (!yAxisBound) {

        // If we were using d3 we would set up the y-axis svg elements in this
        // function by making a d3 selection and then invoking .call(d3YAxis)
        // on it, after which we mark yAxisBound as true.
        yAxisBound = true;
      }
    }

    function renderYAxis() {

      // Binding the axis to the svg elements is something that only needs to
      // happen once even if we want to update the rendered properties more
      // than once; separating the bind from the layout in this way allows us
      // to treat renderYAxis as idempotent.
      bindYAxisOnce();

      // If we were using d3 we would update the y-axis svg elements with their
      // new values using d3's standard mechanisms. See the implementation of
      // src/views/SvgColumnChart.js for an example of how this works in
      // practice.
    }

    // Note that renderXAxis, renderYAxis and renderSeries all update the
    // elements that have been created by binding the data (which is done
    // inline in renderData below).
    function renderSeries() {

      // If we were using d3 we would make the appripriate selections and then
      // update each element's x, y, width, height and other attributes to
      // correctly reflect the data. Data is bound to these elements inline
      // in renderData below; the purpose of renderSeries is simply to update
      // the attributes of the svg elements to match the data, and is handled
      // using d3's standard mechanisms.

      // Since we are not using d3 in this sample implementation, we will
      // instead use jQuery to select and update the data.
      dimensionValuesBySeries.forEach((dimensionValue, seriesIndex) => {
        const labels = dimensionValue;
        const values = measureValuesBySeries[seriesIndex];
        const sumOfValues = values.reduce((value, sum) => value + sum, 0);

        $chartElement.
          css('background-color', '#f8f8f8');

        labels.forEach((label, datumIndex) => {
          const value = values[datumIndex];
          const datumPercent = (value / sumOfValues) * 100;
          const datumBackgroundColor = label ?
            DATUM_BACKGROUND_COLOR_TRUE :
            DATUM_BACKGROUND_COLOR_FALSE;

          // Note that in this case and the case of the labels below we are
          // assigning all of the necessary styles inline, as opposed to
          // inheriting from stylesheets. As explained above, this is to
          // prevent collisions with styles defined in the host application,
          // and in the case of d3-backed charts is the idiomatic way to do
          // it in any case.
          $chartElement.append(
            $(
              '<span>',
              {
                'class': 'datum',
                'data-datum-title': label ? 'Yes' : 'No',
                'data-datum-label': label,
                'data-datum-value': `${datumPercent.toFixed(2)}%`,
                'style': `
                  display: block;
                  position: absolute;
                  width: ${datumPercent}%;
                  height: 100%;
                  left: ${label ? 0 : 'auto'};
                  right: ${label ? 'auto' : 0};
                  top: 0;
                  line-height: ${viewportHeight}px;
                  text-align: ${label ? 'left' : 'right'};
                  color: #fff;
                  background-color: ${datumBackgroundColor};
                `
              }
            )
          );
        });

        // We render the labels separately and after we have rendered the data
        // in order to take advantage of the natural stacking order of the DOM,
        // and since we still want them to be fully visible even if the
        // underlying data display is very narrow.
        labels.forEach((label, datumIndex) => {
          const value = values[datumIndex];
          const datumPercent = (value / sumOfValues) * 100;
          const datumUnits = self.getUnitOtherBySeriesIndex(seriesIndex);
          const datumBackgroundColor = label ?
            DATUM_BACKGROUND_COLOR_TRUE :
            DATUM_BACKGROUND_COLOR_FALSE;
          const borderRadius = MEASURE_LABELS_FONT_SIZE * 2;
          const datumBorderRadius = label ?
            `0 ${borderRadius}px ${borderRadius}px 0` :
            `${borderRadius}px 0 0 ${borderRadius}px`;
          const datumText = label ?
            `&nbsp;&nbsp;Yes: ${datumPercent.toFixed(2)}% of ${datumUnits}` :
            `No: ${datumPercent.toFixed(2)}% of ${datumUnits} &nbsp;&nbsp`;

          $chartElement.append(
            $(
              '<span>',
              {
                'class': 'datum datum-label',
                'data-datum-title': label ? 'Yes' : 'No',
                'data-datum-label': label,
                'data-datum-value': `${datumPercent.toFixed(2)}%`,
                'style': `
                  display: block;
                  position: absolute;
                  padding-top: ${MEASURE_LABELS_FONT_SIZE}px;
                  padding-right: ${MEASURE_LABELS_FONT_SIZE / 2}px;
                  padding-bottom: ${MEASURE_LABELS_FONT_SIZE}px;
                  padding-left: ${MEASURE_LABELS_FONT_SIZE / 2}px;
                  left: ${label ? 0 : 'auto'};
                  right: ${label ? 'auto' : 0};
                  top: ${label ? '15%' : 'auto'};
                  bottom: ${label ? 'auto' : '15%'};
                  font-family: ${FONT_STACK};
                  font-size: ${MEASURE_LABELS_FONT_SIZE}px;
                  text-align: ${label ? 'left' : 'right'};
                  color: ${MEASURE_LABELS_FONT_COLOR};
                  background-color: ${datumBackgroundColor};
                  border-radius: ${datumBorderRadius};
                  box-sizing: content-box;
                `
              }
            ).html(datumText)
          );
        });
      });
    }

    /**
     * 1. Determine the size of the chart that we will draw.
     */

    // Charts that allow panning or zooming will need to implement logic here
    // that sets width and height, which will be used as the 'true' values for
    // the container in which we want to draw the chart. These differ from
    // viewportWidth and viewportHeight in that the viewport is always the same
    // size regardless of data, and widths or heights greater than that of the
    // viewport will be accommodated by panning or zooming.
    //
    // In this case, however, we will just assume that we will always draw the
    // chart at the same size as the viewport.
    width = viewportWidth;
    height = viewportHeight;

    /**
     * 2. Set up the x-scale and -axis.
     */

    // If we were using d3 we would create the x-scale and -axis objects here,
    // then assign them to the d3XScale and d3XAxis variables. In this case,
    // however, we are not rendering data on scales or using axis so we will
    // just skip this step.

    /**
     * 3. Set up the y-scale and -axis.
     */

    // If we were using d3 we would create the x-scale and -axis objects here,
    // then assign them to the d3XScale and d3XAxis variables. In this case,
    // however, we are not rendering data on scales or using axis so we will
    // just skip this step.
    //
    // We might also create different scale and axis objects depending on
    // whether or not the chart is configured to show the data's range
    // exclusively, or if it should always show zero on the y-axis.

    /**
     * 4. Clear out any existing chart.
     */

    $chartElement.empty();

    /**
     * 5. Render the chart.
     */

    // If we were using d3 we would at this point build up the svg DOM with all
    // elements that might be required to render the data. We would also bind
    // the data to the appropriate elements of this DOM using d3's `data`
    // method, which would then cause our `renderXAxis`, `renderYAxis` and
    // `renderSeries` to be passed the latest data to with which to compute
    // their relevant attributes.
    //
    // In this case, however, we will just use jQuery to create a few elements
    // and append them to the root-level chart element created in
    // `renderTemplate`.
    //
    // Since in this case we do not have to support panning or zooming,
    // rendering the chart is straightforward. The order in which things are
    // rendered is not relevant in this case, but in other visualization
    // implementations it has been necessary to, e.g., render the x-axis and
    // data series before rendering the y-axis in order to allow the dimensions
    // of the rendered data to inform choices made when rendering the y-axis.
    renderXAxis();
    renderYAxis();
    renderSeries();

    /**
     * 6. Set up event handlers for mouse interactions.
     */

    // If we were using d3 we would update event handlers for user interactions
    // with d3-managed elements here. Since we are just using jQuery, however,
    // we don't need to do anything and instead rely on the delegated event
    // handlers set up in `renderTemplate`.
  }

  function showHighlight(event) {
    const eventTarget = event.originalEvent.target;
    const label = eventTarget.getAttribute('data-datum-label');

    // This selector allows us to grab a reference to the datum display and the
    // accompanying label at the same time, and in the case of this implementation
    // we want to show the highlight on both elements.
    self.
      $element.
      find(`.datum[data-datum-label="${label}"]`).
      css('background-color', self.getHighlightColorBySeriesIndex(0));
  }

  function hideHighlight(event) {
    const eventTarget = event.originalEvent.target;
    const label = eventTarget.getAttribute('data-datum-label');

    if (label === 'true') {

      // If this is the 'true' category, reset the background color of the span
      // to the green color defined by the constant at the top of the file.
      self.
        $element.
        find(`.datum[data-datum-label="${label}"]`).
        css('background-color', DATUM_BACKGROUND_COLOR_TRUE);
    } else {

      // Otherwise reset it to the red color defined by the constant at the top
      // of the file.
      self.
        $element.
        find(`.datum[data-datum-label="${label}"]`).
        css('background-color', DATUM_BACKGROUND_COLOR_FALSE);
    }
  }

  function showFlyout(event) {
    const eventTarget = event.originalEvent.target;
    const label = eventTarget.getAttribute('data-datum-label');
    const flyoutTarget = self.
      $element.
      find(`.datum-label[data-datum-label="${label}"]`)[0];
    const title = (
      eventTarget.getAttribute('data-datum-title') ||
      I18n.t('shared.visualizations.charts.common.no_value')
    );
    const value = eventTarget.getAttribute('data-datum-value');
    // Since this is a simple yes/no chart, we will only consider one series at
    // the moment. A more sophisticated implementation would use data
    // attributes to annotate the DOM nodes with the series index from which
    // they were generated.
    const seriesIndex = 0;
    const valueUnit = (value === 1) ?
      self.getUnitOneBySeriesIndex(seriesIndex) :
      self.getUnitOtherBySeriesIndex(seriesIndex);
    // All flyout content is expected to adhere to the same structure and class
    // names as below, with multiple '.socrata-flyout-row' elements
    // representing multiple series. It is possible to insert non-text content
    // into the flyouts, but they do not support any native styling for that
    // and one should carefully consider the value of non-text content before
    // attempting to modify the flyout's behavior. In the case of multiple
    // series we should attempt to use the primary color associated with each
    // series for the label text (this is not shown below but can be seen in
    // the flyouts for SvgColumnChart and SvgTimelineChart.
    const $titleRow = $('<tr>', { 'class': 'socrata-flyout-title' }).
      append(
        $('<td>', { 'colspan': 2 }).
          text(
            (title) ? title : ''
          )
        );
    // The label cell isn't strictly necessary for any reason other than
    // providing a spacer to keep the value cell on the right. In the case
    // of more varied categorical data, the label cell would indicate to
    // the user which category they are looking at.
    const $labelCell = $('<td>', { 'class': 'socrata-flyout-cell' });
    const $valueCell = $('<td>', { 'class': 'socrata-flyout-cell' });
    const $valueRow = $('<tr>', { 'class': 'socrata-flyout-row' });
    const $table = $('<table>', { 'class': 'socrata-flyout-table' });

    let payload = null;
    let valueString = I18n.t('shared.visualizations.charts.common.no_value');

    if (value !== null) {
      // Since we know that this chart will only ever display percentages,
      // we can assume that the pattern <percent> of <unit> is appropriate
      // in all cases and hard-code the 'of'.
      valueString = `${value} of ${valueUnit}`;
    }

    $valueCell.text(valueString);

    $valueRow.append([
      $labelCell,
      $valueCell
    ]);

    $table.append([
      $titleRow,
      $valueRow
    ]);

    // In this case we always want the flyout to appear over the datum title,
    // not necessarily over the datum display, and as a result we use a
    // slightly more complex selector to grab the label element and send it
    // to the flyout renderer as the anchor for the flyout.
    payload = {
      element: flyoutTarget,
      content: $table,
      rightSideHint: false,
      belowTarget: false,
      dark: true
    };

    self.emitEvent(
      'SOCRATA_VISUALIZATION_SAMPLE_CHART_FLYOUT',
      payload
    );
  }

  function hideFlyout() {

    self.emitEvent(
      'SOCRATA_VISUALIZATION_SAMPLE_CHART_FLYOUT',
      null
    );
  }
}

module.exports = SampleChart;
