import sinon from 'sinon';
import { expect, assert } from 'chai';
const angular = require('angular');

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

  beforeEach(angular.mock.module('test'));
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

        sinon.stub(CardDataService, 'getRowCount').callsFake(function(id, where) {
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
        assert.lengthOf(context.element.find('input[type="radio"]:disabled'), 1);
      });

      it('enables the filtered radio button if the row counts are different', function() {
        stubRowCounts(50000, 30000);
        context = createElement();
        assert.lengthOf(context.element.find('input[type="radio"]:disabled'), 0);
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

      it('respects downloadOverride if the page is not filtered', function() {
        stubRowCounts(50000, 50000);

        context = createElement({}, {}, { downloadOverride: 'https://socrata.com' });

        expect(context.element.scope().csvDownloadURL).to.equal('https://socrata.com');
        expect(context.element.find('a').get(0).href).to.equal('https://socrata.com/');
      });

      it('disables filtered export if the download override is set', function() {
        stubRowCounts(50000, 30000);

        context = createElement({}, {}, { downloadOverride: 'https://socrata.com' });

        var page = context.element.scope().page;
        page.set('cards', [Mockumentary.createCard(page, 'something')]);
        page.getCurrentValue('cards')[0].set('activeFilters', [new Filter.IsNullFilter(true)]);

        context.element.scope().$apply();

        expect(context.element.scope().shouldDisableFilteredExport).to.equal(true);
        expect(context.element.scope().disabledFilteredExportMessage).to.match(/not available for this dataset/i);
        expect(context.element.scope().csvDownloadURL).to.equal('https://socrata.com');
        expect(context.element.find('a').get(0).href).to.equal('https://socrata.com/');
      });

      it('uses a magic flag when the data lens is based on a derived view', function() {
        stubRowCounts(50000, 30000);

        context = createElement(null, {isFromDerivedView: true});

        var page = context.element.scope().page;
        page.set('cards', [Mockumentary.createCard(page, 'something')]);
        page.getCurrentValue('cards')[0].set('activeFilters', [new Filter.IsNullFilter(true)]);

        // keeping the filter setup because this was only triggered when rows were filtered
        context.element.scope().isFilteredCSVExport = true;
        context.element.scope().$apply();

        var regex = /read_from_nbe=true/i;
        expect(context.element.find('a').get(0).href).to.match(regex);
      });
    });

    describe('the Polaroid button', function() {
      it('should not be visible if the config setting is disabled', function() {
        ServerConfig.override('enablePngDownloadUi', false);
        context = createElement();

        testHelpers.fireMouseEvent(context.element.find('button')[0], 'click');
        assert.isNotOk(context.element.scope().showPolaroidButton);
        assert.lengthOf(context.element.find('[data-action="export-polaroid"]'), 0);
      });

      it('should be visible if the config setting is enabled', function() {
        ServerConfig.override('enablePngDownloadUi', true);
        context = createElement();

        testHelpers.fireMouseEvent(context.element.find('button')[0], 'click');
        assert.ok(context.element.scope().showPolaroidButton);
        assert.lengthOf(context.element.find('[data-action="export-polaroid"]'), 1);
      });

      it('should trigger card selection mode on click', function(done) {
        ServerConfig.override('enablePngDownloadUi', true);
        context = createElement();

        context.scope.$on('enter-export-card-visualization-mode', function(e) {
          assert.isTrue(context.element.scope().allowChooserModeCancel);
          assert.isFalse(context.element.scope().panelActive);
          done();
        });

        testHelpers.fireMouseEvent(context.element.find('button')[0], 'click');
        testHelpers.fireMouseEvent(context.element.find('[data-action="export-polaroid"]')[0], 'click');
      });
    });

    it('quits card selection mode when clicking Cancel', function(done) {
      ServerConfig.override('enablePngDownloadUi', true);

      context = createElement();

      context.scope.$on('exit-export-card-visualization-mode', function() {
        assert.isFalse(context.element.scope().allowChooserModeCancel);
        assert.isFalse(context.element.scope().panelActive);
        done();
      });

      testHelpers.fireMouseEvent(context.element.find('button')[0], 'click');
      testHelpers.fireMouseEvent(context.element.find('[data-action="export-polaroid"]')[0], 'click');
      testHelpers.fireMouseEvent(context.element.find('[data-action="quit-chooser"]')[0], 'click');
    });

    it('quits card selection mode pressing the escape key', function(done) {
      ServerConfig.override('enablePngDownloadUi', true);

      context = createElement();

      context.scope.$on('exit-export-card-visualization-mode', function() {
        assert.isFalse(context.element.scope().allowChooserModeCancel);
        assert.isFalse(context.element.scope().panelActive);
        done();
      });

      testHelpers.fireMouseEvent(context.element.find('button')[0], 'click');
      testHelpers.fireMouseEvent(context.element.find('[data-action="export-polaroid"]')[0], 'click');

      $('body').trigger($.Event('keydown', { which: 27 }));
    });
  });

  describe('in customize mode', function() {
    var context;

    beforeEach(function() {
      context = createElement({ editMode: true });
    });

    it('should give the export button class "disabled"', function() {
       assert.isTrue(context.element.find('button').hasClass('disabled'));
    });

    it('should not open the panel on click', function() {
      testHelpers.fireMouseEvent(context.element.find('button')[0], 'click');
      assert.isFalse($(context.element.find('.tool-panel-main')).hasClass('active'));
    });
  });
});
