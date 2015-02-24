(function() {
  'use strict';

  describe('<related-views/>', function() {
    var $window;
    var testHelpers;
    var $rootScope;
    var Model;

    var TEST_DATA = [
      {
        id: '1111-1111',
        name: 'First Element',
        description: 'First Description'
      },
      {
        id: '2222-2222',
        name: 'Second Element',
        description: 'Second Description'
      },
      {
        id: '3111-1111',
        name: 'Third Element',
        description: 'Third Description'
      }
    ];

    beforeEach(module('/angular_templates/dataCards/relatedViews.html'));
    beforeEach(module('dataCards'));
    beforeEach(module('dataCards.directives'));
    beforeEach(module('test'));
    beforeEach(function() {
      inject(['$window', '$rootScope', 'testHelpers', 'Model', function(_$window, _$rootScope, _testHelpers, _Model) {
        $rootScope = _$rootScope;
        $window = _$window;
        testHelpers = _testHelpers;
        Model = _Model;
      }]);
    });

    afterEach(function() {
      testHelpers.TestDom.clear();
    });

    function createElement(datasetPages) {
      var scope = $rootScope.$new();
      var models = _.map(datasetPages || [], function(pageData) {
        var model = new Model();
        model.id = pageData.id;
        model.defineObservableProperty('name', pageData.name);
        model.defineObservableProperty('description', pageData.description);
        return model;
      });
      scope.datasetPages = { publisher: models };
      scope.page = { id: '3111-1111' };

      return {
        scope: scope,
        element: testHelpers.TestDom.compileAndAppend('<related-views page="page" dataset-pages="datasetPages"></related-views>', scope)
      };
    }

    it('should show a disabled button if no pages are available', function() {
      var testElement = createElement().element;
      expect(testElement.find('.tool-panel-toggle-btn.disabled')).to.exist.and.to.be.visible;
      expect(testElement.find('a.tool-panel-toggle-btn')).to.not.be.visible;
    });

    it('should show an active button if there are pages', function() {
      var testElement = createElement(TEST_DATA).element;
      expect(testElement.find('a.tool-panel-toggle-btn')).to.exist.and.to.be.visible;
      expect(testElement.find('.tool-panel-toggle-btn.disabled')).to.not.be.visible;
    });

    it('should show a flannel when the button is clicked', function() {
      var testElement = createElement(TEST_DATA).element;
      var toolPanel = testElement.find('.tool-panel-main');
      expect(toolPanel).to.not.have.class('active');
      testElement.find('a.tool-panel-toggle-btn').click();
      expect(toolPanel).to.have.class('active');
    });

    it('should list the pages in the flannel excluding the current page', function() {
      var testElement = createElement(TEST_DATA).element;
      var listItems = testElement.find('.related-views-list-item');
      expect(listItems).to.have.length(TEST_DATA.length - 1);
      expect(listItems.filter(function() { return $(this).find('.related-view-name').text() === 'First Element' }).get(0)).to.exist;
      expect(listItems.filter(function() { return $(this).find('.related-view-name').text() === 'Second Element' }).get(0)).to.exist;
      expect(listItems.filter(function() { return $(this).find('.related-view-name').text() === 'Third Element' }).get(0)).to.not.exist;
    });

    it('should hide the flannel if clicked outside of the flannel', function(done) {
      var testElement = createElement(TEST_DATA).element;
      testElement.find('a.tool-panel-toggle-btn').click();

      testHelpers.fireMouseEvent(
        $window.document.getElementsByTagName('body')[0],
        'click',
        { which: 1 }
      );
      _.defer(function() {
        expect(testElement.find('.tool-panel-main')).to.not.have.class('active');
        testHelpers.TestDom.clear();
        done();
      });
    });

  });

})();
