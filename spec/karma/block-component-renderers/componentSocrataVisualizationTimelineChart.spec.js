describe('componentSocrataVisualizationTimelineChart jQuery plugin', function() {

  'use strict';

  var $component;

  var validComponentData = {
    type: 'socrata.visualization.timelineChart',
    value: {
      vif: {
        configuration: {}
      }
    }
  };

  beforeEach(function() {
    testDom.append('<div>');
    $component = testDom.children('div');
  });

  it('should throw when passed invalid arguments', function() {
    assert.throws(function() { $component.componentSocrataVisualizationTimelineChart(); });
    assert.throws(function() { $component.componentSocrataVisualizationTimelineChart(1); });
    assert.throws(function() { $component.componentSocrataVisualizationTimelineChart(null); });
    assert.throws(function() { $component.componentSocrataVisualizationTimelineChart(undefined); });
    assert.throws(function() { $component.componentSocrataVisualizationTimelineChart({}); });
    assert.throws(function() { $component.componentSocrataVisualizationTimelineChart([]); });
  });

  describe('given a type that is not supported', function() {
    it('should throw when instantiated', function() {
      var badData = _.cloneDeep(validComponentData);
      badData.type = 'notSocrata.notVisualization.notTimelineChart';
      assert.throws(function() {
        $component.componentSocrataVisualizationTimelineChart(badData);
      });
    });
  });

  describe('given a valid component type and value', function() {
    var socrataTimelineChartStub;

    beforeEach(function() {
      socrataTimelineChartStub = sinon.stub($.fn, 'socrataTimelineChart', function() { return this; });
      $component = $component.componentSocrataVisualizationTimelineChart(validComponentData);
    });

    afterEach(function() {
      socrataTimelineChartStub.restore();
    });

    it('should return a jQuery object for chaining', function() {
      assert.instanceOf($component, $);
    });

    it('should call into socrataTimelineChart with the correct arguments', function() {
      sinon.assert.calledWithExactly(
        socrataTimelineChartStub,
        validComponentData.value.vif
      );
    });
  });
});
