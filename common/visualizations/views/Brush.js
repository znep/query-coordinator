import _ from 'lodash';
import React, { Component } from 'react';
import utils from 'common/js_utils';
import constants from './DistributionChartConstants';
import helpers from './DistributionChartHelpers';

class Brush extends Component {
  constructor(props) {
    super(props);

    this.state = {
      dragContext: null,
      hover: null
    };

    _.bindAll(this, [
      'getClipPath',
      'getHover',
      'getFilterIndicator',
      'getFilterRangeTarget',
      'getClickTarget',
      'getDragHandles',
      'onMouseDown',
      'onMouseUp',
      'onMouseMove',
      'onMouseOut',
      'updateFilter',
      'updateFlyout'
    ]);
  }

  // Returns a <defs> element containing a <clipPath> used to clip the selected plots.
  getClipPath() { // eslint-disable-line react/sort-comp
    if (!_.isObject(this.props.filter)) {
      return null;
    }

    // Create a rectangle representing the buckets inside the current filter range.
    var scale = this.props.scale;
    var bucketWidth = scale.x.rangeBand();
    var startIndex = _.indexOf(scale.x.domain(), this.props.filter.start);
    var endIndex = _.indexOf(scale.x.domain(), this.props.filter.end);
    var clipRect = React.DOM.rect({
      x: this.props.margin.left + startIndex * bucketWidth,
      y: -3,
      width: (endIndex - startIndex) * bucketWidth,
      height: this.props.height
    });

    // Wrap the rectangle in a <clipPath>, and wrap that in a <defs>.
    return React.DOM.defs(null, React.DOM.clipPath({
      id: constants.clipPathID
    }, clipRect));
  }

  // Return a transparent rectangle positioned at the bucket under the mouse, or nothing if the
  // mouse is not hovering over the chart.
  getHover() {
    var scale = this.props.scale;

    if (!_.isObject(this.state.hover)) {
      return null;
    }

    var position = scale.x(this.state.hover.start);
    var endPosition = scale.x(this.state.hover.end);
    var bucketWidth = scale.x.rangeBand();

    return React.DOM.rect({
      className: 'hover',
      x: position + bucketWidth / 2,
      y: -3,
      width: endPosition - position,
      height: this.props.height,
      fill: constants.colors.hover
    });
  }

  getFilterIndicator() {
    var filter = this.props.filter;
    var scale = this.props.scale;

    if (!_.isObject(filter)) {
      return null;
    }

    var start = filter.start;
    var end = filter.end;

    var startPosition = scale.x(start);
    var endPosition = scale.x(end);

    var filterIcon = React.DOM.tspan({
      className: 'histogram-filter-icon',
      fill: '#debb1e',
      style: {
        fontFamily: 'socrata-icons'
      }
    }, '\uf121');

    var label = React.DOM.tspan({
      dx: 4
    }, utils.formatNumber(start) + ' to ' + utils.formatNumber(end));

    var clearFilter = React.DOM.tspan({
      dx: 4,
      className: 'histogram-close-icon',
      style: {
        fontSize: '10px',
        fontFamily: 'socrata-icons'
      }
    }, '\uf112');

    return React.DOM.text({
      key: 'filterIndicator',
      x: (startPosition + endPosition) / 2 + scale.x.rangeBand() / 2,
      y: this.props.height - 17,
      textAnchor: 'middle',
      fill: '#8f8f8f',
      style: {
        fontWeight: 'bold'
      }
    }, filterIcon, label, clearFilter);
  }

  getFilterRangeTarget() {
    var filter = this.props.filter;
    var scale = this.props.scale;

    if (!_.isObject(filter)) {
      return null;
    }

    return React.DOM.rect({
      ref: 'filterRangeTarget',
      x: scale.x(filter.start) + scale.x.rangeBand() / 2,
      y: scale.y(0),
      width: scale.x(filter.end) - scale.x(filter.start),
      height: this.props.height - scale.y(0),
      fill: 'transparent'
    });
  }

  getClickTarget() {
    return React.DOM.rect({
      ref: 'clickTarget',
      x: 0,
      y: 0,
      width: this.props.width,
      height: this.props.height,
      fill: 'transparent'
    });
  }

  getDragHandles() {
    if (!_.isObject(this.props.filter)) {
      return null;
    }

    var scale = this.props.scale;
    var bucketWidth = scale.x.rangeBand();

    var leftEdge = React.DOM.line({
      y1: 0,
      y2: this.props.height - this.props.margin.bottom,
      stroke: constants.colors.dragEdge,
      strokeDasharray: '7, 3'
    });

    var rightEdge = React.DOM.line({
      y1: 0,
      y2: this.props.height - this.props.margin.bottom,
      stroke: constants.colors.dragEdge,
      strokeDasharray: '7, 3'
    });

    var leftHandle = React.DOM.path({
      d: 'M0,0L-10,0L-10,8L0,16Z',
      stroke: constants.colors.dragHandleStroke,
      fill: constants.colors.dragHandleFill
    });

    var rightHandle = React.DOM.path({
      d: 'M0,0L10,0L10,8L0,16Z',
      stroke: constants.colors.dragHandleStroke,
      fill: constants.colors.dragHandleFill
    });

    var leftHitbox = React.DOM.rect({
      ref: 'leftDragHandle',
      x: -10,
      y: 0,
      width: 20,
      height: this.props.height,
      fill: 'transparent'
    });

    var rightHitbox = React.DOM.rect({
      ref: 'rightDragHandle',
      x: -10,
      y: 0,
      width: 20,
      height: this.props.height,
      fill: 'transparent'
    });

    var leftPosition = scale.x(this.props.filter.start) + bucketWidth / 2;
    var rightPosition = scale.x(this.props.filter.end) + bucketWidth / 2;

    var left = React.DOM.g({
      key: 'leftDragHandle',
      className: 'left-drag-handle',
      transform: helpers.translate(leftPosition, 0),
      style: { cursor: 'ew-resize' }
    }, leftEdge, leftHandle, leftHitbox);

    var right = React.DOM.g({
      key: 'rightDragHandle',
      className: 'right-drag-handle',
      transform: helpers.translate(rightPosition, 0),
      style: { cursor: 'ew-resize' }
    }, rightEdge, rightHandle, rightHitbox);

    return [left, right];
  }

  // Start dragging.
  onMouseDown(event) {
    event.preventDefault();

    var mouseX = helpers.getMouseOffsetPosition(event, this.props);

    var initialX = mouseX;
    var shouldUpdateDrag = true;

    if (event.target === this.refs.leftDragHandle) {
      initialX = this.props.scale.x(this.props.filter.end);
      shouldUpdateDrag = false;
    } else if (event.target === this.refs.rightDragHandle) {
      initialX = this.props.scale.x(this.props.filter.start) + this.props.scale.x.rangeBand() / 2 + 1;
      shouldUpdateDrag = false;
    } else if (_.isObject(this.props.filter)) {
      var belowAxis = event.nativeEvent.offsetY > this.props.scale.y(0);
      var startPosition = this.props.scale.x(this.state.hover.start);
      var endPosition = this.props.scale.x(this.state.hover.end);
      var withinSelection = mouseX >= startPosition && mouseX <= endPosition;

      if (belowAxis && withinSelection) {
        shouldUpdateDrag = false;
      }
    }

    // First, initialize a drag context, then update the filter.
    this.setState({
      dragContext: {
        initialFilter: _.clone(this.props.filter),
        initialX: initialX
      }
    }, function() {
      if (shouldUpdateDrag) {
        this.updateFilter(mouseX);
      }
    });
  }

  // Stop dragging.
  onMouseUp(event) {
    event.preventDefault();

    var filter = this.props.filter;
    var dragContext = this.state.dragContext;
    var mouseX = helpers.getMouseOffsetPosition(event, this.props);

    // Will happen if the mouseDown originated outside the chart.
    if (_.isNull(dragContext)) {
      return;
    }

    // If the mouse didn't move and the filter remained the same, clear the filter.
    var mouseDidMove = mouseX !== dragContext.initialX;
    if (!mouseDidMove && _.isEqual(filter, dragContext.initialFilter)) {
      filter = null;
    }

    // Reset drag context and clear filter if necessary.
    this.setState({
      dragContext: null
    });

    this.props.onFilterChanged(filter);

    // Inform parent of the current filter.
    this.props.onFilterSet(filter);

    this.props.onFlyout(null);
  }

  // If the mouse is down, update the filter.  Update the hover highglight and flyout.
  onMouseMove(event) {
    event.preventDefault();

    if (_.isObject(this.state.dragContext)) {
      var mouseX = helpers.getMouseOffsetPosition(event, this.props);
      this.updateFilter(mouseX);
    }

    this.updateFlyout(event);
  }

  onMouseOut(event) {
    event.preventDefault();

    this.setState({ hover: null });
    this.props.onFlyout(null);
  }

  updateFilter(mouseX) {
    var context = this.state.dragContext;
    var scale = this.props.scale;
    var bucketWidth = scale.x.rangeBand();

    var reverse = mouseX < Math.floor(context.initialX / bucketWidth) * bucketWidth;
    var start = helpers.positionToBucket(context.initialX, scale, reverse ? Math.ceil : Math.floor);
    var end = helpers.positionToBucket(mouseX, scale, reverse ? Math.floor : Math.ceil);

    var filter;
    if (start < end) {
      filter = { start: start, end: end };
    } else {
      filter = { start: end, end: start };
    }

    this.props.onFilterChanged(filter);
  }

  // Determines the bucket under the mouse and updates hoverBucket so it renders higlighted.  Also
  // calls the onFlyout function to show a flyout.
  updateFlyout(event) {
    var props = this.props;
    var scale = props.scale;
    var data = props.data;
    var bucketWidth = scale.x.rangeBand();

    var payload = {};

    // Compute the start and end values, the unfiltered and filtered values contained in the hover
    // range, and the appropriate x and y position for the flyout.
    if (event.target === this.refs.filterRangeTarget && !_.isObject(this.state.dragContext)) {
      var filter = props.filter;
      var domain = scale.x.domain();
      var from = _.indexOf(domain, filter.start);
      var to = _.indexOf(domain, filter.end);

      payload.start = filter.start;
      payload.end = filter.end;
      payload.unfiltered = _.chain(data.unfiltered).slice(from, to).map('value').sum().value();
      payload.filtered = _.chain(data.filtered).slice(from, to).map('value').sum().value();
      payload.unfiltered = payload.unfiltered;
      payload.filtered = payload.filtered;
      payload.x = (from + to) / 2 * bucketWidth + props.margin.left;
      payload.y = scale.y(0) + props.margin.top;
    } else {
      var mouseX = helpers.getMouseOffsetPosition(event, props);
      var bucketIndex = helpers.positionToBucketIndex(mouseX, scale);

      // There's one more axis tick than there are buckets.
      if (bucketIndex === scale.x.domain().length - 1) {
        bucketIndex--;
      }

      var unfilteredBucket = data.unfiltered[bucketIndex];
      var filteredBucket = data.filtered[bucketIndex];

      payload.start = unfilteredBucket.start;
      payload.end = unfilteredBucket.end;
      payload.unfiltered = unfilteredBucket.value;
      payload.filtered = filteredBucket.value;
      payload.x = bucketIndex * bucketWidth + bucketWidth / 2 + props.margin.left;
      payload.y = scale.y(filteredBucket.value) + props.margin.top;
    }

    if (!_.isEqual(this.state.hover, payload)) {
      this.setState({ hover: payload });
      this.props.onFlyout(payload);
    } else if (_.get(this.props.vif, 'configuration.isMobile')) {
      this.props.onFlyout(null);
      this.setState({ hover: null });
    }
  }

  render() {
    var elementProps;

    if (_.get(this.props.vif, 'configuration.isMobile')) {
      elementProps = {
        className: 'controls',
        onMouseUp: this.onMouseMove
      };
    } else {
      elementProps = {
        className: 'controls',
        onMouseDown: this.onMouseDown,
        onMouseUp: this.onMouseUp,
        onMouseMove: this.onMouseMove,
        onMouseOut: this.onMouseOut
      };
    }

    return React.DOM.g(elementProps,
      this.getClipPath(),
      this.getHover(),
      this.getFilterIndicator(),
      this.getClickTarget(),
      this.getFilterRangeTarget(),
      this.getDragHandles()
    );
  }
}

export default Brush;
