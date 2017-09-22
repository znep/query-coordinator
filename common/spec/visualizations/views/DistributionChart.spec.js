var _ = require('lodash');
var React = require('react');
var ReactDOM = require('react-dom');
var TestUtils = require('react-dom/test-utils');
var { DistributionChart } = require('common/visualizations/views/DistributionChart');
var helpers = require('common/visualizations/views/DistributionChartHelpers');

describe('DistributionChart', function() {
  var testData = {
    unfiltered: [
      { start: -10, end: 0, value: -20 },
      { start: 0, end: 10, value: 100 },
      { start: 10, end: 100, value: 30 },
      { start: 100, end: 1000, value: 80 }
    ],
    filtered: [
      { start: -10, end: 0, value: 20 },
      { start: 0, end: 10, value: 30 },
      { start: 10, end: 100, value: 10 },
      { start: 100, end: 1000, value: 80 }
    ]
  };

  var scale = helpers.getScaleForData(testData);

  var defaultProps = {
    data: testData,
    scale: scale,
    width: 450,
    height: 280
  };

  var element;

  var createElementWithProps = _.partial(React.createElement, DistributionChart);
  var renderElement = _.flow(createElementWithProps, TestUtils.renderIntoDocument, ReactDOM.findDOMNode);
  var findByTag = TestUtils.findRenderedDOMComponentWithTag;
  var findAllByTag = TestUtils.scryRenderedDOMComponentsWithTag;
  var findByClass = TestUtils.findRenderedDOMComponentWithClass;

  beforeEach(function() {
    element = renderElement(defaultProps);
  });

  it('renders an empty svg element if there is no data', function() {
    element = renderElement({});

    expect(element.tagName).to.equal('svg');
    expect(element.childNodes).to.have.length(0);
  });

  it('renders unfiltered and filtered paths', function() {
    expect(element.querySelector('path.unfiltered.area')).to.exist;
    expect(element.querySelector('path.unfiltered.line')).to.exist;

    expect(element.querySelector('path.filtered.area')).to.exist;
    expect(element.querySelector('path.filtered.line')).to.exist;
  });

  it('renders x ticks', function() {
    expect(element.querySelectorAll('line.tick.x').length).to.equal(scale.x.domain().length);
  });

  it('renders approximately 3 y ticks', function() {
    expect(element.querySelectorAll('line.tick.y').length).to.be.closeTo(3, 1);
  });

  it('renders x labels', function() {
    expect(element.querySelectorAll('text.label.x').length).to.equal(scale.x.domain().length);
  });

  it('does not render every label if the width is small', function() {
    element = renderElement(_.extend({}, defaultProps, {
      width: 50
    }));

    expect(element.querySelectorAll('text.label.x').length).to.be.below(scale.x.domain().length);
  });

  it('renders y labels', function() {
    expect(element.querySelectorAll('text.label.y').length).to.be.closeTo(3, 1);
  });

  it('does not render filtered plots if there is no filter', function() {
    expect(element.querySelector('path.selected.unfiltered.area')).to.not.exist;
    expect(element.querySelector('path.selected.unfiltered.line')).to.not.exist;
    expect(element.querySelector('path.selected.filtered.area')).to.not.exist;
    expect(element.querySelector('path.selected.filtered.line')).to.not.exist;
  });

  it('renders filtered plots if there is a filter', function() {
    element = renderElement(_.extend({}, defaultProps, {
      filter: {
        start: 0,
        end: 100
      }
    }));

    expect(element.querySelector('path.selected.unfiltered.area')).to.exist;
    expect(element.querySelector('path.selected.unfiltered.line')).to.exist;
    expect(element.querySelector('path.selected.filtered.area')).to.exist;
    expect(element.querySelector('path.selected.filtered.line')).to.exist;

    expect(element.querySelector('path.selected.unfiltered.area').style.clipPath).to.exist;
    expect(element.querySelector('path.selected.unfiltered.line').style.clipPath).to.exist;
    expect(element.querySelector('path.selected.filtered.area').style.clipPath).to.exist;
    expect(element.querySelector('path.selected.filtered.line').style.clipPath).to.exist;
  });

  describe('controls', function() {
    var controls;

    beforeEach(function() {
      controls = element.querySelector('.controls');
    });

    it('renders a transparent rectangle over the bucket underneath the mouse on hover', function() {
      expect(element.querySelector('.hover')).to.not.exist;

      TestUtils.Simulate.mouseMove(controls, {
        nativeEvent: {
          offsetX: defaultProps.width / 2,
          offsetY: defaultProps.height / 2
        }
      });

      expect(element.querySelector('.hover')).to.exist;
    });

    it('removes the hover effect when the mouse leaves the chart', function() {
      TestUtils.Simulate.mouseMove(controls, {
        nativeEvent: {
          offsetX: defaultProps.width / 2,
          offsetY: defaultProps.height / 2
        }
      });

      expect(element.querySelector('.hover')).to.exist;

      TestUtils.Simulate.mouseOut(controls);

      expect(element.querySelector('.hover')).to.not.exist;
    });

    it('calls the callback for flyouts on hover', function(done) {
      element = renderElement(_.extend({}, defaultProps, {
        onFlyout: _.ary(done, 0)
      }));

      controls = element.querySelector('.controls');

      TestUtils.Simulate.mouseMove(controls, {
        nativeEvent: {
          offsetX: defaultProps.width / 2,
          offsetY: defaultProps.height / 2
        }
      });
    });

    it('calls the callback for flyouts with a null payload on mouseout', function(done) {
      element = renderElement(_.extend({}, defaultProps, {
        onFlyout: function(payload) {
          if (_.isNull(payload)) {
            done();
          }
        }
      }));

      controls = element.querySelector('.controls');

      TestUtils.Simulate.mouseMove(controls, {
        nativeEvent: {
          offsetX: defaultProps.width / 2,
          offsetY: defaultProps.height / 2
        }
      });

      TestUtils.Simulate.mouseOut(controls);
    });

    it('shows drag handles immediately when pressing the mouse button', function() {
      expect(element.querySelector('.left-drag-handle')).to.not.exist;
      expect(element.querySelector('.right-drag-handle')).to.not.exist;

      TestUtils.Simulate.mouseDown(controls, {
        nativeEvent: {
          offsetX: defaultProps.width / 2,
          offsetY: defaultProps.height / 2
        }
      });

      expect(element.querySelector('.left-drag-handle')).to.exist;
      expect(element.querySelector('.right-drag-handle')).to.exist;
    });

    it('renders filtered plots after dragging on the chart', function() {
      expect(element.querySelector('.left-drag-handle')).to.not.exist;
      expect(element.querySelector('.right-drag-handle')).to.not.exist;

      expect(element.querySelector('path.selected.unfiltered.area')).to.not.exist;
      expect(element.querySelector('path.selected.unfiltered.line')).to.not.exist;
      expect(element.querySelector('path.selected.filtered.area')).to.not.exist;
      expect(element.querySelector('path.selected.filtered.line')).to.not.exist;

      TestUtils.Simulate.mouseDown(controls, {
        nativeEvent: {
          offsetX: defaultProps.width * .5,
          offsetY: defaultProps.height * .5
        }
      });

      TestUtils.Simulate.mouseMove(controls, {
        nativeEvent: {
          offsetX: defaultProps.width * .75,
          offsetY: defaultProps.height * .75
        }
      });

      TestUtils.Simulate.mouseUp(controls, {
        nativeEvent: {
          offsetX: defaultProps.width * .75,
          offsetY: defaultProps.height * .75
        }
      });

      expect(element.querySelector('.left-drag-handle')).to.exist;
      expect(element.querySelector('.right-drag-handle')).to.exist;

      expect(element.querySelector('path.selected.unfiltered.area')).to.exist;
      expect(element.querySelector('path.selected.unfiltered.line')).to.exist;
      expect(element.querySelector('path.selected.filtered.area')).to.exist;
      expect(element.querySelector('path.selected.filtered.line')).to.exist;
    });

    it('calls the filter callback after dragging on the chart', function(done) {
      element = renderElement(_.extend({}, defaultProps, {
        onFilter: _.ary(done, 0)
      }));

      controls = element.querySelector('.controls');

      TestUtils.Simulate.mouseDown(controls, {
        nativeEvent: {
          offsetX: defaultProps.width * .5,
          offsetY: defaultProps.height * .5
        }
      });

      TestUtils.Simulate.mouseMove(controls, {
        nativeEvent: {
          offsetX: defaultProps.width * .75,
          offsetY: defaultProps.height * .75
        }
      });

      TestUtils.Simulate.mouseUp(controls, {
        nativeEvent: {
          offsetX: defaultProps.width * .75,
          offsetY: defaultProps.height * .75
        }
      });
    });

    it('filters the chart if a single location is clicked', function(done) {
      element = renderElement(_.extend({}, defaultProps, {
        onFilter: _.ary(done, 0)
      }));

      controls = element.querySelector('.controls');

      TestUtils.Simulate.mouseDown(controls, {
        nativeEvent: {
          offsetX: defaultProps.width * .5,
          offsetY: defaultProps.height * .5
        }
      });

      TestUtils.Simulate.mouseUp(controls, {
        nativeEvent: {
          offsetX: defaultProps.width * .5,
          offsetY: defaultProps.height * .5
        }
      });
    });

    it('clears the filter if the area below the axis is clicked', function(done) {
      element = renderElement(_.extend({}, defaultProps, {
        onFilter: function(payload) {
          if (_.isNull(payload)) {
            done();
          }
        }
      }));

      controls = element.querySelector('.controls');

      TestUtils.Simulate.mouseDown(controls, {
        nativeEvent: {
          offsetX: defaultProps.width * .5,
          offsetY: defaultProps.height * .5
        }
      });

      TestUtils.Simulate.mouseMove(controls, {
        nativeEvent: {
          offsetX: defaultProps.width * .75,
          offsetY: defaultProps.height * .75
        }
      });

      TestUtils.Simulate.mouseUp(controls, {
        nativeEvent: {
          offsetX: defaultProps.width * .75,
          offsetY: defaultProps.height * .75
        }
      });

      TestUtils.Simulate.mouseDown(controls, {
        nativeEvent: {
          offsetX: defaultProps.width * .7,
          offsetY: defaultProps.height * .99
        }
      });

      TestUtils.Simulate.mouseUp(controls, {
        nativeEvent: {
          offsetX: defaultProps.width * .7,
          offsetY: defaultProps.height * .99
        }
      });
    });
  });
});
