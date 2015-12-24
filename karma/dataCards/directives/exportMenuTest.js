describe('Export Menu', function() {
  'use strict';

  var context;
  var testHelpers;
  var ServerConfig;
  var $rootScope;

  beforeEach(angular.mock.module('dataCards'));

  beforeEach(function() {
    inject(function($injector) {
      testHelpers = $injector.get('testHelpers');
      ServerConfig = $injector.get('ServerConfig');
      $rootScope = $injector.get('$rootScope');
    });
  });

  function createElement(scopeOverrides) {
    var scope = $rootScope.$new();

    _.extend(
      scope,
      {
        hasChanges: false,
        editMode: false,
        currentUserHasSaveRight: true
      },
      scopeOverrides || {}
    );

    var html = [
      '<export-menu edit-mode="editMode" has-changes="hasChanges" page="page"></export-menu>'
    ].join('');

    var element = testHelpers.TestDom.compileAndAppend(html, scope);

    return {
      scope: scope,
      element: element
    };
  }

  describe('in explore mode', function() {

    describe('the Polaroid button', function() {
      it('should not be visible if the config setting is disabled', function() {
        ServerConfig.override('enablePngDownloadUi', false);
        context = createElement();

        testHelpers.fireMouseEvent(context.element.find('button')[0], 'click');
        expect(context.element.find('.tool-panel-main')).to.have.class('active');
        expect(context.element.find('.tool-panel-btn:visible')).to.have.length(2);
      });

      it('should be visible if the config setting is enabled', function() {
        ServerConfig.override('enablePngDownloadUi', true);
        context = createElement();

        testHelpers.fireMouseEvent(context.element.find('button')[0], 'click');
        expect(context.element.find('.tool-panel-main')).to.have.class('active');
        expect(context.element.find('.tool-panel-btn:visible')).to.have.length(3);
      });

      it('should be disabled if the page is in a dirty state', function() {
        ServerConfig.override('enablePngDownloadUi', true);
        context = createElement({hasChanges: true});

        testHelpers.fireMouseEvent(context.element.find('button')[0], 'click');
        expect(context.element.find('.tool-panel-main')).to.have.class('active');
        expect(context.element.find('.export-to-polaroid-disabled')).to.have.length(1);
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

      it('should be visible when the user has save rights', function(done) {
        context = createElement({
          currentUserHasSaveRight: true
        });

        expect(context.element.find('[data-action="export-vif"]').length).to.equal(1);

        done();
      });

      it('should not be visible when user doesn\'t have save rights', function(done) {
        context = createElement({
          currentUserHasSaveRight: false
        });

        expect(context.element.find('[data-action="export-vif"]').length).to.equal(0);

        done();
      });

      it('should trigger card selection mode on click', function(done) {
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
