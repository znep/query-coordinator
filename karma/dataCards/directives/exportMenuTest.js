describe('Export Menu', function() {
  'use strict';

  var $q;
  var $rootScope;
  var testHelpers;
  var CardDataService;
  var Filter;
  var Mockumentary;
  var ServerConfig;

  var context;
  var rowCountStub;

  beforeEach(angular.mock.module('dataCards'));

  beforeEach(function() {
    inject(function($injector) {
      $q = $injector.get('$q');
      $rootScope = $injector.get('$rootScope');
      testHelpers = $injector.get('testHelpers');
      CardDataService = $injector.get('CardDataService');
      Filter = $injector.get('Filter');
      Mockumentary = $injector.get('Mockumentary');
      ServerConfig = $injector.get('ServerConfig');

      var rowCount$ = $q.when(5);
      rowCountStub = sinon.stub(CardDataService, 'getRowCount').returns(rowCount$);

      ServerConfig.override('standaloneLensChart', true);
    });
  });

  afterEach(function() {
    CardDataService.getRowCount.restore();
    testHelpers.TestDom.clear();
  });

  function createElement(scopeOverrides, pageOverrides, datasetOverrides) {
    var scope = $rootScope.$new();

    _.extend(
      scope,
      {
        editMode: false,
        currentUserHasSaveRight: true,
        page: Mockumentary.createPage(pageOverrides, datasetOverrides)
      },
      scopeOverrides || {}
    );

    var html = [
      '<export-menu edit-mode="editMode" page="page"></export-menu>'
    ].join('');

    var element = testHelpers.TestDom.compileAndAppend(html, scope);

    return {
      scope: scope,
      element: element
    };
  }

  describe('in explore mode', function() {
    describe('CSV Export', function() {
      function stubRowCounts(unfiltered, filtered) {
        CardDataService.getRowCount.restore(); // Undo the default stub.

        sinon.stub(CardDataService, 'getRowCount', function(id, where) {
          if (where === '') {
            return $q.when(filtered);
          } else {
            return $q.when(unfiltered);
          }
        });
      }

      it('fetches the row counts from CardDataService', function() {
        stubRowCounts(5, 3);
        context = createElement();

        expect(context.element.scope().rowCount).to.equal('5');
        expect(context.element.scope().filteredRowCount).to.equal('3');
      });

      it('formats the row counts', function() {
        stubRowCounts(50000, 30000);
        context = createElement();

        expect(context.element.scope().rowCount).to.equal('50,000');
        expect(context.element.scope().filteredRowCount).to.equal('30,000');
      });

      it('disables the filtered radio button if the row counts are the same', function() {
        stubRowCounts(50000, 50000);

        context = createElement();

        expect(context.element.find('input[type="radio"]:disabled')).to.exist;

        context.element.scope().filteredRowCount = 30000;
        context.element.scope().$apply();

        expect(context.element.find('input[type="radio"]:disabled')).to.not.exist;
      });

      it('sets the url of the download button based on the current filter', function() {
        stubRowCounts(50000, 30000);

        context = createElement();

        var page = context.element.scope().page;
        page.set('cards', [Mockumentary.createCard(page, 'something')]);
        page.getCurrentValue('cards')[0].set('activeFilters', [new Filter.IsNullFilter(true)]);

        context.element.scope().isFilteredCSVExport = true;
        context.element.scope().$apply();

        var regex = /query=select\+\*\+where\+%60something%60\+is\+null/i;
        expect(context.element.find('a').get(0).href).to.match(regex);
      });
    });

    describe('the Polaroid button', function() {
      it('should not be visible if the config setting is disabled', function() {
        ServerConfig.override('enablePngDownloadUi', false);
        context = createElement();

        testHelpers.fireMouseEvent(context.element.find('button')[0], 'click');
        expect(context.element.scope().showPolaroidButton).to.not.be.ok;
        expect(context.element.find('[data-action="export-polaroid"]')).to.not.exist;
      });

      it('should be visible if the config setting is enabled', function() {
        ServerConfig.override('enablePngDownloadUi', true);
        context = createElement();

        testHelpers.fireMouseEvent(context.element.find('button')[0], 'click');
        expect(context.element.scope().showPolaroidButton).to.be.ok;
        expect(context.element.find('[data-action="export-polaroid"]')).to.exist;
      });

      it('should trigger card selection mode on click', function(done) {
        ServerConfig.override('enablePngDownloadUi', true);
        context = createElement();

        context.scope.$on('enter-export-card-visualization-mode', function(e, type) {
          expect(type).to.equal('polaroid');
          expect(context.element.scope().allowChooserModeCancel).to.be.true;
          expect(context.element.scope().panelActive).to.be.false;
          done();
        });

        testHelpers.fireMouseEvent(context.element.find('button')[0], 'click');
        testHelpers.fireMouseEvent(context.element.find('[data-action="export-polaroid"]')[0], 'click');
      });
    });

    describe('the standalone visualization button', function() {
      it('should not be visible when the user does not have save rights', function() {
        ServerConfig.override('standaloneLensChart', true);
        context = createElement({
          currentUserHasSaveRight: false
        });

        expect(context.element.find('[data-action="export-vif"]')).to.not.exist;
      });

      it('should not be visible when the feature flag is disabled', function() {
        ServerConfig.override('standaloneLensChart', false);
        context = createElement({
          currentUserHasSaveRight: true
        });

        expect(context.element.find('[data-action="export-vif"]')).to.not.exist;
      });

      it('should be visible if the feature flag is enabled and the user has sufficient rights', function() {
        ServerConfig.override('standaloneLensChart', true);
        context = createElement({
          currentUserHasSaveRight: true
        });

        expect(context.element.find('[data-action="export-vif"]')).to.exist;
      });

      it('should trigger card selection mode on click', function(done) {
        ServerConfig.override('standaloneLensChart', true);
        context = createElement();

        context.scope.$on('enter-export-card-visualization-mode', function(e, type) {
          expect(type).to.equal('vif');
          expect(context.element.scope().allowChooserModeCancel).to.be.true;
          expect(context.element.scope().panelActive).to.be.false;
          done();
        });

        testHelpers.fireMouseEvent(context.element.find('button')[0], 'click');
        testHelpers.fireMouseEvent(context.element.find('[data-action="export-vif"]')[0], 'click');
      });
    });

    it('quits card selection mode when clicking Cancel', function(done) {
      context = createElement();

      context.scope.$on('exit-export-card-visualization-mode', function() {
        expect(context.element.scope().allowChooserModeCancel).to.be.false;
        expect(context.element.scope().panelActive).to.be.false;
        done();
      });

      testHelpers.fireMouseEvent(context.element.find('button')[0], 'click');
      testHelpers.fireMouseEvent(context.element.find('[data-action="export-vif"]')[0], 'click');
      testHelpers.fireMouseEvent(context.element.find('[data-action="quit-chooser"]')[0], 'click');
    });

    it('quits card selection mode pressing the escape key', function(done) {
      context = createElement();

      context.scope.$on('exit-export-card-visualization-mode', function() {
        expect(context.element.scope().allowChooserModeCancel).to.be.false;
        expect(context.element.scope().panelActive).to.be.false;
        done();
      });

      testHelpers.fireMouseEvent(context.element.find('button')[0], 'click');
      testHelpers.fireMouseEvent(context.element.find('[data-action="export-vif"]')[0], 'click');

      $('body').trigger($.Event('keydown', { which: 27 }));
    });
  });

  describe('in customize mode', function() {
    var context;

    beforeEach(function() {
      context = createElement({ editMode: true });
    });

    it('should give the export button class "disabled"', function() {
       expect(context.element.find('button').hasClass('disabled')).to.be.true;
    });

    it('should not open the panel on click', function() {
      testHelpers.fireMouseEvent(context.element.find('button')[0], 'click');
      expect(context.element.find('.tool-panel-main')).to.not.have.class('active');
    });
  });
});
