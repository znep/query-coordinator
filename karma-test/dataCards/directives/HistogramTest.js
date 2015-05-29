describe('HistogramChart', function() {
  'use strict';

  var testHelpers;
  var $rootScope;

  beforeEach(module('dataCards'));
  beforeEach(module('dataCards.directives'));
  beforeEach(module('dataCards.services'));
  beforeEach(module('dataCards/histogram.sass'));

  beforeEach(inject(function($injector) {
    testHelpers = $injector.get('testHelpers');
    $rootScope = $injector.get('$rootScope');
  }));

  var template = [
    '<div class="card-visualization" id="test-histogram-chart">',
      '<histogram ',
        'card-data="cardData" ',
        'is-filtered="isFiltered" ',
        'row-display-unit="rowDisplayUnit" ',
        'expanded="expanded">',
      '</histogram>',
    '</div>'
  ].join('');

  var testData = {
    unfiltered: [
      {start: -100, end: -10, value: 4},
      {start: -10, end: 0, value: 743},
      {start: 0, end: 10, value: 13},
      {start: 10, end: 100, value: 91}
    ],
    filtered: [
      {start: -100, end: -10, value: 4},
      {start: -10, end: 0, value: 743},
      {start: 0, end: 10, value: 13},
      {start: 10, end: 100, value: 91}
    ]
  };

  function createHistogram(scopeData) {
    scopeData = _.merge({
      cardData: testData,
      isFiltered: null,
      rowDisplayUnit: 'cuttlefish',
      expanded: true
    }, scopeData);

    var scope = $rootScope.$new();
    _.assign(scope, scopeData);

    var element = testHelpers.TestDom.compileAndAppend(template, scope);
    var histogramScope = element.find('histogram').scope();

    return {
      element: element,
      scope: scope,
      histogramScope: histogramScope
    };
  }

  function removeHistogram() {
    $('#test-histogram-chart').remove();
    $('#uber-flyout').hide();
  }

  describe('flyout', function() {

    var histogram;

    afterEach(function() {
      removeHistogram();
    });

    it('should render on hover', function() {
      histogram = createHistogram();
      testHelpers.fireMouseEvent($('.histogram-hover-shield')[0], 'mousemove');
      var $flyoutTitle = $('.flyout-title');
      expect($flyoutTitle.length === 1).to.equal(true);
    })

    it('should trigger the nth flyout for the nth data bucket', function() {
      histogram = createHistogram();
      var chartWidth = $('.histogram svg').attr('width');
      var chartHeight = $('.histogram svg').attr('height');
      var bucketWidth = Math.ceil(chartWidth / testData.unfiltered.length);
      for (var i = 0; i < testData.unfiltered.length; i++) {
        var offsetX = bucketWidth * i;
        testHelpers.fireMouseEvent($('.histogram-hover-shield')[0], 'mousemove', {
          clientX: offsetX,
          clientY: chartHeight / 2
        });
        var $flyoutTitle = $('.flyout-title');
        expect($flyoutTitle.text()).to.equal(testData.unfiltered[i].start + ' to ' + testData.unfiltered[i].end);
      }
    });

    it('should show the total and filtered amounts when a filter is active', function() {
      histogram = createHistogram({isFiltered: true});
      testHelpers.fireMouseEvent($('.histogram-hover-shield')[0], 'mousemove');
      var $flyoutTitle = $('#uber-flyout');
      expect($flyoutTitle.text()).to.match(new RegExp('Total'));
      expect($flyoutTitle.text()).to.match(new RegExp(testData.unfiltered[0].value));
      expect($flyoutTitle.text()).to.match(new RegExp(/Filtered Amount/));
      expect($flyoutTitle.text()).to.match(new RegExp(testData.filtered[0].value));
    });

  });
});
