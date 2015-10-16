describe('classicVisualizationPreviewer', function() {
  'use strict';

  var testHelpers;
  var $rootScope;

  function createDirective(scopeProperties) {
    var scope = $rootScope.$new();

    _.extend(scope, scopeProperties);

    var html =
      '<classic-visualization-previewer classic-visualization="classicVisualization"></classic-visualization-previewer>';

    var element = testHelpers.TestDom.compileAndAppend(html, scope);

    return {
      element: element,
      scope: scope
    };
  }

  beforeEach(module('dataCards'));
  beforeEach(module('/angular_templates/dataCards/classicVisualizationPreviewer.html'));

  beforeEach(
    inject([
      'testHelpers',
      '$rootScope',
      function(
        _testHelpers,
        _$rootScope) {
          testHelpers = _testHelpers;
          $rootScope = _$rootScope;
      }
    ])
  );

  afterEach(function() {
    testHelpers.TestDom.clear();
  });

  it('should only set the iframe src when classicVisualization is set', function() {
    var directive = createDirective();
    var iframe = directive.element.find('iframe');
    expect(iframe[0].src).to.equal('');
    directive.scope.classicVisualization = 'i am so classic';
    directive.scope.$apply();
    expect(iframe[0].src).to.not.have.length(0);
  });

  it('should call renderVisualization on the contentWindow when it is ready', function(done) {
    var directive = createDirective();
    var iframe = directive.element.find('iframe');
    var visualizationData = {
      data: 'hello'
    };

    iframe.one('load', function() {
      iframe[0].contentWindow.renderVisualization = function(data) {
        expect(data).to.equal(visualizationData.data);
        done();
      };
    });

    directive.scope.classicVisualization = visualizationData;
    directive.scope.$apply();

    iframe.trigger('load');
    $rootScope.$apply();
  });

});
