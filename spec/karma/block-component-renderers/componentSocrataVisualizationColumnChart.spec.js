describe('componentSocrataVisualizationColumnChart jQuery plugin', function() {

  'use strict';

  var $component;
  var storyteller = window.socrata.storyteller;

  var validComponentData = {
    type: 'socrata.visualization.columnChart',
    value: {
      dataSource: {
        baseQuery: 'the base query',
        domain: 'example.com',
        fourByFour: 'four-four',
        type: 'soql'
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

  describe('given a type that is not supported', function () {
    it('should throw when instantiated', function () {
      var badData = _.cloneDeep(validComponentData);
      badData.type = 'notSocrata.notVisualization.notColumnChart';
      assert.throws(function() {
        $component.componentSocrataVisualizationColumnChart(badData);
      });
    });
  });

  describe('given a valid component type and value', function() {
    var socrataVisualizationColumnChartStub = sinon.stub($.fn, 'socrataVisualizationColumnChart');

    beforeEach(function() {
      $component = $component.componentSocrataVisualizationColumnChart(validComponentData);
    });

    afterEach(function() {
      socrataVisualizationColumnChartStub.reset();
    });

    after(function() {
      socrataVisualizationColumnChartStub.restore();
    });

    it('should return a jQuery object for chaining', function() {
      assert.instanceOf($component, $);
    });

    it('should call into socrataVisualizationColumnChart with the correct arguments', function() {
      sinon.assert.calledWithExactly(
        socrataVisualizationColumnChartStub,
        'example.com',
        'four-four',
        'the base query'
      );
    });

    describe('that then changes base query', function() {
      it('should emit the destroy event on the old visualization', function(done) {
        $component.on(Constants.SOCRATA_VISUALIZATION_DESTROY, function() {
          done();
        });

        var newData = _.cloneDeep(validComponentData);
        newData.value.dataSource.baseQuery = 'a new base query';
        $component.componentSocrataVisualizationColumnChart(newData);
      });
    });
  });
});
