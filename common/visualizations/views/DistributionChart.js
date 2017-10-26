import PropTypes from 'prop-types';
import React, { Component } from 'react';
import _ from 'lodash';
import utils from 'common/js_utils';
import Brush from './Brush';
import helpers from './DistributionChartHelpers';
import constants from './DistributionChartConstants';

export class DistributionChart extends Component {
  constructor(props) {
    super(props);

    this.state = {
      // An object with 'start' and 'end' keys representing buckets, or null if the chart is not
      // filtered.  The buckets in this range will be highlighted yellow.  The filter can be changed
      // by clicking and dragging with the mouse.
      filter: props.filter
    };

    _.bindAll(this, [
      'updateScaleRange',
      'getSVG',
      'getPlots',
      'getFilterPlots',
      'getTicks',
      'getLabels',
      'getBrush'
    ]);
  }

  componentWillReceiveProps(newProps) {
    this.setState({ filter: newProps.filter });
  }

  // Set the output range for each scale, which is, in general, the dimensions of the chart.
  updateScaleRange() { // eslint-disable-line react/sort-comp
    var props = this.props;
    props.scale.x.rangeBands([props.margin.left, props.width - props.margin.right], 0, -0.5);
    props.scale.y.range([props.height - props.margin.top - props.margin.bottom, 0]);
  }

  // Set up path generators using d3.svg.  The renderers accept an array of buckets and return a
  // 'd' attribute to be used with SVG <path> elements.  There are two special buckets 'start' and
  // 'end' that will evaluate to points at the left and right edge of the chart, respectively.
  getSVG() {
    var props = this.props;
    var scale = props.scale;
    var origin = scale.y(0);

    var svg = {
      unfiltered: {
        area: helpers.generateSVGRenderer('area'),
        line: helpers.generateSVGRenderer('line')
      },
      filtered: {
        area: helpers.generateSVGRenderer('area'),
        line: helpers.generateSVGRenderer('line')
      }
    };

    _.each(svg, function(renderers, type) {
      renderers.line.
        x(helpers.bucketToPosition(scale)).
        y(helpers.yCoordinateForBucket(scale, props.data[type]));

      renderers.area.
        x(helpers.bucketToPosition(scale)).
        y1(helpers.yCoordinateForBucket(scale, props.data[type])).
        y0(_.constant(origin));
    });

    return svg;
  }

  // Return an array of <path> elements for the unfiltered and filtered portion of the chart.
  // Artificial 'start' and 'end' data are added to the svg renderer input so that the plots extend
  // to the edges of the chart.
  getPlots(svg) {
    var props = this.props;

    var plots = _.isObject(this.state.filter) ? ['unfiltered'] : ['unfiltered', 'filtered'];

    return _.chain(plots).
      map(function(type) {
        var renderer = svg[type];
        var data = ['start'].concat(props.data[type]).concat('end');

        var area = React.DOM.path({
          key: type + 'area',
          className: type + ' area',
          d: renderer.area(data),
          style: {
            fill: constants.colors[type].area
          }
        });

        var line = React.DOM.path({
          key: type + 'line',
          className: type + ' line',
          d: renderer.line(data),
          style: {
            stroke: constants.colors[type].line,
            strokeWidth: 2,
            fill: 'none'
          }
        });

        return [area, line];
      }).
      flatten().
      value();
  }

  // Return an array of <path> elements for the selected portion of the chart, or nothing if the
  // chart is not filtered.  The paths are clipped based on the current filter.
  getFilterPlots(svg) {
    var props = this.props;
    var state = this.state;

    if (!_.isObject(state.filter)) {
      return null;
    }

    return _.chain(svg).
      map(function(renderer, type) {
        var data = ['start'].concat(props.data[type]).concat('end');

        var area = React.DOM.path({
          key: type + 'selected area',
          className: type + ' selected area',
          d: renderer.area(data),
          style: {
            fill: constants.colors.selection[type].area,
            clipPath: 'url(#' + constants.clipPathID + ')'
          }
        });

        var line = React.DOM.path({
          key: type + 'selected line',
          className: type + ' selected line',
          d: renderer.line(data),
          style: {
            stroke: constants.colors.selection[type].line,
            strokeWidth: 2,
            fill: 'none',
            clipPath: 'url(#' + constants.clipPathID + ')'
          }
        });

        return [area, line];
      }).
      flatten().
      value();
  }

  // Returns all tick marks for the chart as <line> elements.  The y ticks are grid lines that
  // span the width of the chart.  Ticks with a value of 0 are bold.
  getTicks() {
    var props = this.props;
    var scale = props.scale;
    var origin = scale.y(0);
    var bucketWidth = scale.x.rangeBand();

    var xTicks = _.map(scale.x.domain(), function(bucket) {
      var x = scale.x(bucket) + bucketWidth / 2;
      return React.DOM.line({
        key: x,
        className: 'tick x',
        x1: x,
        x2: x,
        y1: origin - constants.tickLength,
        y2: origin + constants.tickLength,
        stroke: helpers.getTickColor(bucket),
        strokeWidth: constants.tickWidth
      });
    });

    var yTicks = _.map(scale.y.ticks(constants.yTickCount), function(y) {
      var tickPosition = scale.y(y);
      return React.DOM.line({
        key: tickPosition,
        className: 'tick y',
        x1: props.margin.left,
        x2: scale.x.rangeExtent()[1],
        y1: tickPosition,
        y2: tickPosition,
        stroke: helpers.getTickColor(y),
        strokeWidth: 1
      });
    });

    return [xTicks, yTicks];
  }

  // Return all x and y labels for the chart as <text> elements.
  getLabels() {
    var filter = this.state.filter;
    var props = this.props;
    var scale = props.scale;
    var bucketWidth = scale.x.rangeBand();
    var origin = scale.y(0);

    // x labels
    var originIndex = scale.x.domain().indexOf(0);
    var defaultLabelCount = scale.x.domain().length;
    var negativeLabelCount = originIndex;
    var positiveLabelCount = defaultLabelCount - originIndex - 1;
    var maxLabelCount = Math.floor(this.props.width / constants.requiredLabelWidth);

    var labelEveryN = _.find([1, 2, 3, 5, 7, 10], function(n) {
      if (n === 1) {
        return defaultLabelCount <= maxLabelCount;
      }

      return (Math.floor(positiveLabelCount / n) + Math.floor(negativeLabelCount / n) + 1) <= maxLabelCount;
    });

    var x = _.compact(_.map(scale.x.domain(), function(bucket, index) {
      var showLabel = (index === originIndex);

      if (_.isNumber(labelEveryN)) {
        showLabel = (index % labelEveryN) === (originIndex % labelEveryN);
      }

      if (showLabel) {
        return React.DOM.text({
          key: bucket,
          className: 'label x',
          x: scale.x(bucket) + bucketWidth / 2,
          y: origin + 18,
          fill: helpers.getXLabelColor(bucket, filter),
          textAnchor: helpers.getXTickAlign(bucket, scale)
        }, utils.formatNumber(bucket));
      }

      return null;
    }));

    // y labels
    var yTicks = scale.y.ticks(constants.yTickCount);
    var y = _.map(yTicks, function(tickValue, i) {
      return React.DOM.text({
        key: tickValue,
        className: 'label y',
        x: scale.x.rangeExtent()[1] - 4,
        y: helpers.getYTickOffset(scale.y(tickValue), i === yTicks.length - 1),
        fill: constants.colors.tick.bold,
        textAnchor: 'end'
      }, utils.formatNumber(tickValue));
    });

    return [x, y];
  }

  getBrush() {
    var self = this;

    var props = _.extend({}, self.props, {
      filter: self.state.filter,
      onFilterChanged: function(filter) {
        self.setState({ filter: filter });
      },
      onFilterSet: function(filter) {
        self.props.onFilter(filter);
      }
    });

    return React.createElement(Brush, props);
  }

  render() {
    var props = this.props;

    if (!_.isObject(props.data)) {
      return React.DOM.svg();
    }

    this.updateScaleRange();
    var svg = this.getSVG();

    var chartAttributes = {
      transform: helpers.translate(0, props.margin.top)
    };

    var chart = React.DOM.g(chartAttributes,
      this.getPlots(svg),
      this.getFilterPlots(svg),
      this.getTicks(),
      this.getLabels(),
      this.getBrush()
    );

    var svgAttributes = {
      width: props.width,
      height: props.height,
      style: { cursor: 'pointer' }
    };

    return React.DOM.svg(svgAttributes, chart);
  }
}

DistributionChart.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,

  margin: PropTypes.shape({
    top: PropTypes.number,
    right: PropTypes.number,
    bottom: PropTypes.number,
    left: PropTypes.number
  }),

  data: PropTypes.shape({
    unfiltered: PropTypes.array,
    filtered: PropTypes.array
  }),

  scale: PropTypes.any,

  onFlyout: PropTypes.func,
  onFilter: PropTypes.func
};

DistributionChart.defaultProps = {
  width: 800,
  height: 600,

  margin: {
    top: 5,
    right: 10,
    bottom: 30,
    left: 10
  },

  data: null,
  scale: null,
  filter: null,

  onFlyout: _.noop,
  onFilter: _.noop
};

export default DistributionChart;
