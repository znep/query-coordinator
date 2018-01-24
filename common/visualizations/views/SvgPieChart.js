const d3 = require('d3');
const _ = require('lodash');
const $ = require('jquery');
const ColumnFormattingHelpers = require('../helpers/ColumnFormattingHelpers');
const SvgVisualization = require('./SvgVisualization');
const I18n = require('common/i18n').default;

import { getMeasures } from '../helpers/measure';
import Palette, { COLOR_VARY_BY } from '../helpers/palettes';
import {
  NO_VALUE_SENTINEL,
  SERIES_TYPE_PIE_CHART,
  SERIES_TYPE_FLYOUT
} from './SvgConstants';

const MARGINS = {
  verticalLayoutPieMargin: 0.7,
  // arc multiplier for determining flyout position
  flyoutArcInnerMultiplier: 1.4,
  flyoutArcOuterMultiplier: 1.8,
  textLabelArcMultiplier: 1.6,
  // space between pie and legend, multiplied by container width
  pieToLegendMargin: 0.1
};

const LEGEND_CONTAINER_PADDING = 20;
const LEGEND_RECT_SIZE = 18;
const LEGEND_SPACING = 4;
const LEGEND_WRAP_PADDING = 5;
const MAX_HORIZONTAL_LEGEND_SIZE = 250;
const MINIMUM_PIE_CHART_WIDTH = 100;
const PERCENT_LABEL_THRESHOLD = 20;
const PI2 = Math.PI * 2;
const VALUE_LABEL_THRESHOLD = 25;
const VERTICAL_LEGEND_SPACING = 20;

function SvgPieChart($element, vif, options) {
  // Embeds needs to wait to define noValueLabel until after hydration.
  const noValueLabel = I18n.t('shared.visualizations.charts.common.no_value');
  const otherLabel = I18n.t('shared.visualizations.charts.common.other_category');
  const self = this;

  let $chartElement; // chart container element
  let centerDot; // hidden circle at the center of pie
  let color; // renderData and renderLegend uses this
  let dataToRender; // chart data
  let dimensionIndex;
  let flyoutDataToRender;
  let height; // container element height
  let legend;
  let measures;
  let outerWidth = 0; // width of pie
  let pieData; // Result of D3's pie chart helper.
  let pieDataToRender;
  let svg; // main svg element
  let width; // container element width

  _.extend(this, new SvgVisualization($element, vif, options));

  renderTemplate();

  /**
   * Public methods
   */

  this.render = (newVif, newData, newColumns) => {
    if (!newData && !dataToRender && !newColumns) {
      return;
    }

    this.clearError();

    if (newVif) {
      this.updateVif(newVif);
    }

    if (newData) {
      dataToRender = newData;
      self.addSeriesIndices(dataToRender);

      pieDataToRender = self.getDataToRenderOfSeriesType(dataToRender, SERIES_TYPE_PIE_CHART);
      flyoutDataToRender = self.getDataToRenderOfSeriesType(dataToRender, SERIES_TYPE_FLYOUT);
    }

    if (newColumns) {
      this.updateColumns(newColumns);
    }

    renderData();
  };

  this.invalidateSize = () => {
    if ($chartElement && pieDataToRender) {
      renderData();
      // TODO D3 is smart enough to not rerender things that don't need to be rerendered.
      // A separate resizeLegend is premature optimization - we can simplify and avoid
      // bugs by having all rendering happen inside of renderLegend().
      resizeLegend(legend);
    }
  };

  this.destroy = () => {
    d3.select(self.$element[0]).select('svg').remove();

    self.$element.find('.socrata-visualization-container').remove();
  };

  /**
   * Private methods
   */

  function renderTemplate() {
    $chartElement = $(
      '<div>',
      {
        'class': 'pie-chart'
      }
    );

    self.$element.find('.socrata-visualization-container').
      append($chartElement);
  }

  /**
   * Render Pie
   */
  function renderData() {

    self.$element.find('.pie-chart').empty();

    determineSize();

    // creating pie
    pieData = d3.layout.pie().value(d => d[1]).sort(null);
    const total = pieDataToRender.rows.map(d => d[1]).reduce((acc, d) => acc + d, 0);

    measures = getMeasures(self, dataToRender);
    dimensionIndex = pieDataToRender.columns.indexOf('dimension');

    const measureIndex = 1;
    const measure = measures[0];
    measure.palette = new Palette({
      vif: self.getVif(),
      seriesIndex: measure.seriesIndex,
      colorVaryBy: COLOR_VARY_BY.DIMENSION
    });

    // create main svg element
    // append a "g" to group slices
    svg = d3.select($chartElement.get(0)).append('svg');
    let g = svg.
      attr('width', width).
      attr('height', height).
      append('g').
      attr('class', 'slices');

    // Color from custom palette
    color = (datum, index) => {
      return d3.rgb(measure.getColor(index, datum.data[dimensionIndex]));
    };

    // pie slices
    let arcs = g.datum(pieDataToRender.rows).selectAll('g.slice-group').
      data(pieData).
      enter().
      append('svg:g').
      attr('class', 'slice-group').
      attr('data-dimension-index', (d, dimensionIndex) => dimensionIndex);

    let arcPaths = arcs.
      append('path').
      attr('class', 'slice').
      attr('data-dimension-index', (d, dimensionIndex) => dimensionIndex).
      attr('data-label', (d) => d.data[dimensionIndex]).
      attr('data-value', (d) => d.data[measureIndex]).
      attr('data-percent', (d) => {
        return (total !== 0) ?
          (100 * d.data[measureIndex]) / total :
          null;
      }).
      attr('fill', color);

    // invisible dot at the center of pie
    // hack solution to find "true" center of pie chart.
    centerDot = arcs.
      append('svg:circle').
      attr('r', 0.1).
      attr('fill-opacity', 0);

    attachPieEvents(arcs);

    if (self.getShowLegend(true)) {
      renderLegend();
    }

    if (self.getShowValueLabels()) {
      renderArcLabels(self.getShowValueLabelsAsPercent());
    }

    determineSize();

    svg.
      attr('width', width).
      attr('height', height);

    // pie radius
    const radius = outerWidth / 2;

    let leftOffset;
    let topOffset;

    if (isHorizontalLayout()) {
      leftOffset = horizontalLayoutOffsets().pieLeft;
      topOffset = horizontalLayoutOffsets().pieTop;
    } else {
      leftOffset = verticalLayoutOffsets().pieLeft;
      topOffset = verticalLayoutOffsets().pieTop;
    }

    svg.select('g.slices').
      attr(
        'transform',
        `translate(${leftOffset}, ${topOffset})`
      );

    // pie arc
    let arc = getArc(radius);

    // flyout's bigger arc
    let textLabelArc = getArc(radius * MARGINS.textLabelArcMultiplier);

    // apply arcs
    arcPaths.
      attr('d', arc);

    // align labels
    // use textLabelArc for positioning
    svg.selectAll('g.slice-group text').
      attr('transform', (d) => `translate(${textLabelArc.centroid(d)})`);

    const arcRadius = arc.outerRadius()();

    // Show/hide labels according to length of each slice
    const labelVisibilityThreshold =
      self.getShowValueLabelsAsPercent()
        ? PERCENT_LABEL_THRESHOLD
        : VALUE_LABEL_THRESHOLD;

    svg.selectAll('g.slice-group path').
      each(function(d) {
        const length = calculateArcLength(arcRadius, d.startAngle, d.endAngle);
        const textEl = d3.select(this.parentNode).select('text');
        const visibility = length >= labelVisibilityThreshold ? 'visible' : 'hidden';

        textEl.style('visibility', visibility);
      });
  }

  /**
   * Render legend
   */
  function renderLegend() {
    // create legend rows with a domain created with data and decorate rows
    legend = svg.
      datum(pieDataToRender.rows).
      selectAll('.legend').
      data(pieData).
      enter().
      append('g').
      attr('class', 'legend-row');

    // create colored squares
    legend.append('rect').
      attr('width', LEGEND_RECT_SIZE).
      attr('height', LEGEND_RECT_SIZE).
      style('fill', color).
      style('stroke', color);

    const getText = (datum) => {
      const data = datum.data;
      const columnValue = _.get(data, dimensionIndex);

      if (_.isNil(columnValue)) {
        return noValueLabel;
      } else if (columnValue === otherLabel) {
        return otherLabel;
      } else {
        const column = _.get(self.getVif(), 'series[0].dataSource.dimension.columnName');
        return _.unescape(ColumnFormattingHelpers.formatValueHTML(columnValue, column, pieDataToRender));
      }
    };

    // create legend texts
    legend.append('text').
      attr('x', LEGEND_RECT_SIZE + LEGEND_SPACING).
      attr('y', LEGEND_RECT_SIZE - LEGEND_SPACING).
      attr('data-text', getText).
      text(getText);

    attachLegendEvents(legend);
    resizeLegend(legend);
  }

  /**
   * Render Arc Labels
   */
  function renderArcLabels(showPercentages) {
    svg.selectAll('g.slice-group').
      append('svg:text').
        // Positioning text on bigger arc's center point
        attr('text-anchor', 'middle').
        // old function syntax used for this binding
        text(function(d) {
          var percent = d3.select(this.parentNode).select('.slice').attr('data-percent');
          var percentAsString = renderPercentLabel(percent);

          if (showPercentages) {
            return percentAsString;
          } else {
            // makes sure pie chart labels do no break when value is null
            const column = _.get(self.getVif(), 'series[0].dataSource.measure.columnName');
            const value = d.data[1];

            if (_.isNil(value)) {
              return noValueLabel;
            } else if (value === otherLabel) {
              return otherLabel;
            } else {
              return ColumnFormattingHelpers.formatValueHTML(value, column, pieDataToRender, true);
            }
          }
        });
  }

  /**
   * Resize and reposition legend
   */
  function resizeLegend(legend) {

    if (isHorizontalLayout()) {

      svg.selectAll('.legend-row').
        attr(
          'transform',
          (d, index) => {

            return `translate(${horizontalLayoutOffsets().legendLeft}, ` +
              `${horizontalLayoutOffsets().legendTop(index)})`;
          }
        );

      const textMaxLength = width -
        horizontalLayoutOffsets().legendLeft -
        LEGEND_CONTAINER_PADDING;

      // go over all texts to wrap
      svg.selectAll('.legend-row')[0].forEach(el => {
        let thisNode = d3.select(el.childNodes[1]);
        let text = thisNode.node().getAttribute('data-text');
        thisNode.text(text);

        let textLength = thisNode.node().getComputedTextLength();
        let computedTextMaxLength = textMaxLength - 2 * LEGEND_WRAP_PADDING;

        while (textLength > computedTextMaxLength && text.length > 0) {
          text = text.slice(0, -1);
          thisNode.text(`${text}...`);
          textLength = thisNode.node().getComputedTextLength();
        }
      });
    } else {

      // Max height available to legend
      const legendMaxHeight = (height - verticalLayoutOffsets().legendTop);
      // Row height
      const rowHeight = LEGEND_RECT_SIZE + LEGEND_SPACING;
      // Max row count can fit in available space
      const maxRowCount = Math.floor(legendMaxHeight / rowHeight);
      // Distributing items to rows
      const itemsPerRow = Math.ceil(
        svg.selectAll('.legend-row')[0].length / maxRowCount
      );
      // Max possible item width
      const maxLegendItemWidth = width * 0.8 / itemsPerRow;

      let rowLengths = [];

      svg.selectAll('.legend-row')[0].forEach((el, index) => {
        // Current Row
        let currentRow = index == 0 ? 0 : Math.floor(index / itemsPerRow);
        // Restore legend text to original
        let thisNode = d3.select(el.childNodes[1]);
        let text = thisNode.node().getAttribute('data-text');

        thisNode.text(text);

        // Get legend text length
        let textLength = thisNode.node().getComputedTextLength();

        // Ellipsis wrap legend text
        while (
          textLength >
          (
            maxLegendItemWidth -
            VERTICAL_LEGEND_SPACING -
            LEGEND_WRAP_PADDING
          ) &&
          text.length > 0
        ) {

          text = text.slice(0, -1);
          thisNode.text(`${text}...`);
          textLength = thisNode.node().getComputedTextLength();
        }

        // Complete length of item
        // colored rect + spacing + text
        let itemLength = textLength +
          LEGEND_RECT_SIZE +
          LEGEND_SPACING +
          VERTICAL_LEGEND_SPACING;

        // add item length to total current row length
        rowLengths[currentRow] = (rowLengths[currentRow] === undefined) ?
          itemLength :
          rowLengths[currentRow] + itemLength;
      });

      let rowPaddings = rowLengths.map(val => (width - val) / 2);
      let lastEndPosition = 0;

      svg.selectAll('.legend-row')[0].forEach((el, index) => {
        let textLength = d3.select(el.childNodes[1]).node().
          getComputedTextLength();

        // Current Row
        let currentRow = Math.floor(index / itemsPerRow);

        // Offset from top for current row
        let offsetTop = verticalLayoutOffsets().legendTop +
          currentRow *
          rowHeight;

        // Complete length of item
        // colored rect + spacing + text
        let itemLength = textLength + LEGEND_RECT_SIZE + LEGEND_SPACING;

        // item's left offset, reset to 0 every VERTICAL_LEGEND_ITEMS_PER_ROW
        let offsetLeft = index % itemsPerRow === 0 ? rowPaddings[currentRow] :
          lastEndPosition + VERTICAL_LEGEND_SPACING;

        // set left offset
        el.setAttribute('transform', `translate(${offsetLeft}, ${offsetTop})`);

        // set last end point for next item
        lastEndPosition = offsetLeft + itemLength;
      });
    }
  }

  /**
   * Get size of container, determine outer width of pie
   * Sets width, height, outerWidth in upper scope
   */
  function determineSize() {
    width = $chartElement.width();
    height = $chartElement.height();

    // Start by fitting the pie within the allotted margins.
    outerWidth = width * MARGINS.verticalLayoutPieMargin;
    // Clamp the value between a min-width and max (based on height).
    outerWidth = _.clamp(outerWidth, MINIMUM_PIE_CHART_WIDTH, height * MARGINS.verticalLayoutPieMargin);
  }

  /**
   * Determines if layout is horizontal
   *
   * @returns {boolean}
   */
  function isHorizontalLayout() {
    const padding = width * MARGINS.pieToLegendMargin;
    const contentWidth = self.getShowLegend(true) ?
      outerWidth + padding + MAX_HORIZONTAL_LEGEND_SIZE :
      outerWidth;

    return contentWidth < width;
  }

  /**
   * Calculates pie center left offset and layout left offset in horizontal
   * layout.
   *
   * @returns {
   *   {
   *     pieLeft: number,
   *     pieTop: number,
   *     legendLeft: number,
   *     legendTop: function
   *   }
   * }
   */
  function horizontalLayoutOffsets() {
    const padding = width * MARGINS.pieToLegendMargin;
    const contentWidth = self.getShowLegend(true) ?
      outerWidth + padding + MAX_HORIZONTAL_LEGEND_SIZE :
      outerWidth;

    const radius = outerWidth / 2;
    const pieTop = height / 2;
    const leftPadding = (width - contentWidth) / 2;
    const pieLeft = leftPadding + radius;
    // single legend row height
    const legendRowHeight = LEGEND_RECT_SIZE + LEGEND_SPACING;
    // total legend height
    const legendHeight = legendRowHeight * pieDataToRender.rows.length;
    const legendLeft = pieLeft + radius + padding;
    // legend offset from top
    const legendTopOffset = (height - legendHeight) / 2;
    const legendTop = index => legendTopOffset + index * legendRowHeight;

    return { pieLeft, pieTop, legendLeft, legendTop };
  }

  /**
   * Calculates pie center left offset and layout left offset in vertical layout
   *
   * @returns {
   *   {
   *     pieLeft: number,
   *     pieTop: number,
   *     legendLeft: number,
   *     legendTop: number
   *   }
   * }
   */
  function verticalLayoutOffsets() {
    const radius = outerWidth / 2;
    const pieMargin = outerWidth * 0.05;
    const pieTop = radius + pieMargin;
    const pieLeft = width / 2;
    const legendLeft = pieLeft;
    const legendTop = outerWidth + pieMargin * 2;

    return { pieLeft, pieTop, legendLeft, legendTop };
  }

  /**
   * Generate arc with given radius
   *
   * @param radius
   * @returns D3 Arc
   */
  function getArc(radius) {

    return d3.svg.arc().
      innerRadius(0).
      outerRadius(radius);
  }

  /**
   * Attach pie events
   */
  function attachPieEvents(arcs) {

    // bind flyout to slices
    arcs.
      on('mouseover', (d, dimensionIndex, measureIndex) => {
        const pathElement = svg.select(`.slice[data-dimension-index="${dimensionIndex}"]`)[0][0];

        // Pie chart radius
        const radius = outerWidth / 2;

        // This arc's middle point in radian
        const arcMidAngle = ((d.endAngle - d.startAngle) / 2) + d.startAngle;

        // This arc's outer border length in px
        const length = calculateArcLength(radius, d.startAngle, d.endAngle);

        // Are labels plain or percentage ?
        const labelVisibilityThreshold =
          self.getShowValueLabelsAsPercent()
            ? PERCENT_LABEL_THRESHOLD
            : VALUE_LABEL_THRESHOLD;

        // Is labels visible with this arc's length and label styling ?
        const labelVisibility = length >= labelVisibilityThreshold ?
          'visible' :
          'hidden';

        // Decide which arc multiplier to use
        let arcMultiplier;
        if (labelVisibility) {
          // If between 130 and 315 degrees display flyout on a bigger arc's middle point
          // If not use a smaller arc's middle point
          // In other words; try to avoid covering label with flyout window.
          arcMultiplier = _.inRange(arcMidAngle, 2.35619, 5.49779) ?
            MARGINS.flyoutArcInnerMultiplier :
            MARGINS.flyoutArcOuterMultiplier;
        } else {
          arcMultiplier = MARGINS.textLabelArcMultiplier;
        }

        // create flyout's arc
        const flyoutArc = getArc(radius * arcMultiplier);

        // Mid point of flyout arc
        const midPoint = flyoutArc.centroid(d);

        // Getting pie center from the dot at the center
        const pieCenter = centerDot[0][0].getBoundingClientRect();

        // Arc mid point is relative, so we're adding pie center offset to it
        const flyoutPositionX = pieCenter.left + midPoint[0];
        const flyoutPositionY = pieCenter.top + midPoint[1];

        const data = {
          dimensionIndex,
          flyoutPositionX,
          flyoutPositionY,
          measureIndex,
          percent: Math.round(Number(pathElement.getAttribute('data-percent'))),
          value: Number(pathElement.getAttribute('data-value'))
        };

        showFlyout(pathElement, data);
      }).
      on('mouseleave', hideFlyout);
  }

  /**
   * Attach legend events
   */
  function attachLegendEvents(legend) {
    // bind flyout to legend rows
    legend.
      on('mouseover', (d, dimensionIndex) => {
        // Delegate to slice.
        var evt = new MouseEvent('mouseover');
        svg.node().querySelector(`.slice-group[data-dimension-index="${dimensionIndex}"]`).dispatchEvent(evt);
      }).
      on('mouseleave', hideFlyout);
  }

  /**
   * Show Flyout
   *
   * @param element
   * @param data
   */
  function showFlyout(
    element,
    {
      dimensionIndex,
      flyoutPositionX,
      flyoutPositionY,
      measureIndex,
      percent,
      value
    }) {

    // Slices
    const measure = measures[measureIndex];
    const seriesIndex = self.getSeriesIndexByMeasureIndex(measureIndex);
    const titleHTML = element.getAttribute('data-label') || noValueLabel;

    const $titleRow = $('<tr>', { 'class': 'socrata-flyout-title' }).
      append($('<td>', { 'colspan': 2 }).html(titleHTML));

    const $labelCell = $('<td>', { 'class': 'socrata-flyout-cell' }).
      html(measure.labelHtml);

    const $valueCell = $('<td>', { 'class': 'socrata-flyout-cell' });
    const $valueRow = $('<tr>', { 'class': 'socrata-flyout-row' });
    const $table = $('<table>', { 'class': 'socrata-flyout-table' });
    const $tableContainer = $('<div>').
      append($table);

    const valueHTML = self.getValueHtml({
      dataToRender,
      seriesIndex,
      value,
      percent
    });

    $valueCell.html(valueHTML);

    $valueRow.append([
      $labelCell,
      $valueCell
    ]);

    $table.append([
      $titleRow,
      $valueRow
    ]);

    // Flyout measures
    const $flyoutTable = self.getFlyoutMeasuresTable({
      dataToRender,
      flyoutDataToRender,
      measures,
      dimensionIndex
    });

    if (!_.isNil($flyoutTable)) {
      $tableContainer.append($flyoutTable);
    }

    // Payload
    const payload = {
      element,
      content: $tableContainer,
      // Not sure about making these values hardcoded
      rightSideHint: false,
      belowTarget: false,
      dark: true,
      // Flyout offset comes from event data
      flyoutOffset: {
        left: flyoutPositionX,
        top: flyoutPositionY
      }
    };

    self.emitEvent(
      'SOCRATA_VISUALIZATION_PIE_CHART_FLYOUT',
      payload
    );
  }

  /**
   * Hide Flyout
   */
  function hideFlyout() {

    self.emitEvent(
      'SOCRATA_VISUALIZATION_PIE_CHART_FLYOUT',
      null
    );
  }

  /**
   * Formats given percentage as string
   */
  function renderPercentLabel(percent) {
    return Math.round(Number(percent)) + I18n.t('shared.visualizations.charts.common.percent_symbol');
  }

  /**
   * Calculates arc's length for given startAngle and endAngle
   * @param {number} radius
   * @param {number} startAngle
   * @param {number} endAngle
   * @return {number}
   */
  function calculateArcLength(radius, startAngle, endAngle) {
    var angleDiff = endAngle - startAngle;
    var circumference = PI2 * radius;
    return (angleDiff * circumference) / PI2;
  }

}

module.exports = SvgPieChart;
