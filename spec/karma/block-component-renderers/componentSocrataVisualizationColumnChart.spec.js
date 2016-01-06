describe('componentSocrataVisualizationColumnChart jQuery plugin', function() {

  'use strict';

  var $component;

  var validComponentData = {
    type: 'socrata.visualization.columnChart',
    value: {
      layout: {
        height: 300
      },
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
    assert.throws(function() { $component.componentSocrataVisualizationColumnChart(); });
    assert.throws(function() { $component.componentSocrataVisualizationColumnChart(1); });
    assert.throws(function() { $component.componentSocrataVisualizationColumnChart(null); });
    assert.throws(function() { $component.componentSocrataVisualizationColumnChart(undefined); });
    assert.throws(function() { $component.componentSocrataVisualizationColumnChart({}); });
    assert.throws(function() { $component.componentSocrataVisualizationColumnChart([]); });
  });

  describe('given a type that is not supported', function() {
    it('should throw when instantiated', function() {
      var badData = _.cloneDeep(validComponentData);
      badData.type = 'notSocrata.notVisualization.notColumnChart';
      assert.throws(function() {
        $component.componentSocrataVisualizationColumnChart(badData);
      });
    });
  });

  describe('given a valid component type and value', function() {
    var socrataColumnChartStub;

    beforeEach(function() {
      socrataColumnChartStub = sinon.stub($.fn, 'socrataColumnChart');
      $component = $component.componentSocrataVisualizationColumnChart(validComponentData);
    });

    afterEach(function() {
      socrataColumnChartStub.restore();
    });

    it('should return a jQuery object for chaining', function() {
      assert.instanceOf($component, $);
    });

    it('should call into socrataColumnChart with the correct arguments', function() {
      sinon.assert.calledWithExactly(
        socrataColumnChartStub,
        validComponentData.value.vif
      );
    });
  });
});
