describe('storytellerComponentSocrataVisualizationColumn jQuery plugin', function() {
  'use strict';

  var $component;
  var storyteller = window.socrata.storyteller;
  var originalSocrataVisualizationColumnChart;

   // (╯°□°）╯︵ ┻━┻
  var validComponentData = {
    type: 'socrataVisualization',
    value: {
      type: 'column',
      value: {
        dataSource: {
          baseQuery: 'the base query',
          domain: 'example.com',
          fourByFour: 'four-four',
          type: 'soql'
        }
      }
    }
  };

  beforeEach(function() {
    testDom.append('<div>');
    $component = testDom.children('div');
    originalSocrataVisualizationColumnChart = $.fn.socrataVisualizationColumnChart;
    $.fn.socrataVisualizationColumnChart = function() {};
  });

  it('should throw when passed invalid arguments', function() {
    assert.throws(function() { $component.storytellerComponentSocrataVisualizationColumn(); });
    assert.throws(function() { $component.storytellerComponentSocrataVisualizationColumn(1); });
    assert.throws(function() { $component.storytellerComponentSocrataVisualizationColumn(null); });
    assert.throws(function() { $component.storytellerComponentSocrataVisualizationColumn(undefined); });
    assert.throws(function() { $component.storytellerComponentSocrataVisualizationColumn({}); });
    assert.throws(function() { $component.storytellerComponentSocrataVisualizationColumn([]); });
  });

  describe('given a value that is not supported', function () {
    it('should throw when instantiated', function () {
      var badData = _.cloneDeep(validComponentData);
      badData.value.type = 'not a visualization type';
      assert.throws(function() {
        $component.storytellerComponentSocrataVisualizationColumn(badData);
      });
    });
  });

  describe('given a valid component type and value', function() {
    var socrataVisualizationColumnChartSpy;

    beforeEach(function() {
      socrataVisualizationColumnChartSpy = sinon.spy($.fn, 'socrataVisualizationColumnChart');
      $component = $component.storytellerComponentSocrataVisualizationColumn(validComponentData);
    });

    afterEach(function() {
      socrataVisualizationColumnChartSpy.restore();
    });

    it('should return a jQuery object for chaining', function() {
      assert.instanceOf($component, $);
    });

    it('should call into socrataVisualizationColumnChart with the correct arguments', function() {
      sinon.assert.calledWithExactly(
        socrataVisualizationColumnChartSpy,
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
        newData.value.value.dataSource.baseQuery = 'a new base query';
        $component.storytellerComponentSocrataVisualizationColumn(newData);
      });
    });
  });
});
