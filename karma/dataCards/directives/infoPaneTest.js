describe('infoPane', function() {
  'use strict';

  var self;
  var $provide;
  var testHelpers;
  var dependencies = [
    '$rootScope',
    'ServerConfig',
    'Mockumentary',
    'WindowOperations'
  ];

  beforeEach(angular.mock.module('dataCards'));

  beforeEach(angular.mock.module(function(_$provide_) {
    $provide = _$provide_;
    $provide.value('WindowOperations', {
      setTitle: sinon.spy()
    });
  }));

  beforeEach(inject(function($injector) {
    self = this;
    testHelpers = $injector.get('testHelpers');
    testHelpers.injectDependencies(this, dependencies);
    testHelpers.mockDirective($provide, 'lensType');
    testHelpers.mockDirective($provide, 'relatedViews');
    testHelpers.mockDirective($provide, 'exportMenu');
    testHelpers.mockDirective($provide, 'apiExplorer');
  }));

  afterEach(function() {
    testHelpers.TestDom.clear();
  });

  function createInfoPane(pageProps, datasetProps) {
    testHelpers.TestDom.clear();
    self.$scope = self.$rootScope.$new();
    self.$scope.page = self.Mockumentary.createPage(pageProps, datasetProps);
    self.$scope.dataset = self.$scope.page.getCurrentValue('dataset');
    self.element = testHelpers.TestDom.compileAndAppend('<info-pane></info-pane>', self.$scope);
  }

  describe('infoPane template', function() {
    beforeEach(function() {
      createInfoPane();
    });

    it('should have a child with the .cards-metadata class', function() {
      expect(self.element.children().first()).to.have.class('cards-metadata');
    });

    it('should have lensType child', function() {
      expect(self.element.find('lens-type')).to.exist;
    });

    it('should have a link to the source dataset', function() {
      expect(self.element.find('.source-dataset-name a')).to.exist;
    });

    it('should have a relatedViews child', function() {
      expect(self.element.find('related-views')).to.exist;
    });

    it('should have an exportMenu child', function() {

      // Set shouldShowExportMenu to true on infoPane's scope to make visible.
      self.element.scope().$apply(function() {
        self.element.scope().shouldShowExportMenu = true;
      });

      expect(self.element.find('export-menu')).to.exist;
    });

    it('should have an apiExplorer child', function() {
      expect(self.element.find('api-explorer')).to.exist;
    });

    it('should have a button to toggle the visibility of the manage lens dialog', function() {

      // Set shouldShowManageLens to true on parent scope to make visible.
      self.$scope.$apply(function() { self.$scope.shouldShowManageLens = true; });

      expect(self.element.find('.manage-section .action-btn')).to.exist;
    });
  });

  describe('shouldShowExportMenu', function() {
    it('should reflect the state of the enableDataLensExportMenu feature flag', function() {
      self.ServerConfig.override('enableDataLensExportMenu', true);
      createInfoPane();
      expect(self.element.scope().shouldShowExportMenu).to.equal(true);

      self.ServerConfig.override('enableDataLensExportMenu', false);
      createInfoPane();
      expect(self.element.scope().shouldShowExportMenu).to.equal(false);
    });
  });

  describe('showOtherViewsButton', function() {
    it('should reflect the state of the enableDataLensOtherViews feature flag', function() {
      self.ServerConfig.override('enableDataLensOtherViews', true);
      createInfoPane();
      expect(self.element.scope().showOtherViewsButton).to.equal(true);

      self.ServerConfig.override('enableDataLensOtherViews', false);
      createInfoPane();
      expect(self.element.scope().showOtherViewsButton).to.equal(false);
    });
  });

  describe('related views', function() {
    it('should be visible if the feature flag is enabled and the user has save rights', function() {
      self.ServerConfig.override('enableDataLensOtherViews', true);
      createInfoPane();
      self.$scope.$apply(function() {
        self.$scope.currentUserHasSaveRight = true;
      });
      expect(self.element.find('related-views')).to.not.have.class('ng-hide');
    });

    it('should not be visible if the feature flag is disabled', function() {
      self.ServerConfig.override('enableDataLensOtherViews', false);
      createInfoPane();
      self.$scope.$apply(function() {
        self.$scope.currentUserHasSaveRight = true;
      });
      expect(self.element.find('related-views')).to.have.class('ng-hide');
    });

    it('does not show related views area if currentUserHasSaveRight is false', function() {
      self.ServerConfig.override('enableDataLensOtherViews', true);
      createInfoPane();
      self.$scope.$apply(function() {
        self.$scope.currentUserHasSaveRight = false;
      });
      expect(self.element.find('related-views')).to.have.class('ng-hide');
    });
  });

  describe('datasetPages', function() {
    it('should be the pages from the dataset model', function() {
      createInfoPane();

      var pages = self.$scope.dataset.getCurrentValue('pages');
      expect(self.element.scope().datasetPages).to.deep.equal(pages);
    });
  });

  describe('sourceDatasetName', function() {
    it('should be the name of the dataset', function() {
      createInfoPane(null, {
        name: 'The Dataset'
      });

      expect(self.element.scope().sourceDatasetName).to.equal('The Dataset');
    });
  });

  describe('pageName', function() {
    it('should be the name of the page', function() {
      createInfoPane({ name: 'The Page' });
      expect(self.element.scope().pageName).to.equal('The Page');
    });

    it('should not contain malicious html fragments', function() {
      createInfoPane({ name: '<b>The</b> <script>alert("Page");</script>' });
      expect(self.element.scope().pageName).to.equal('<b>The</b> ');
    });

    it('should also set the window title', function() {
      createInfoPane({ name: 'My page' });
      expect(self.WindowOperations.setTitle.calledOnce).to.equal(true);
      expect(self.WindowOperations.setTitle.args[0][0]).to.equal('My page | Socrata');
    });
  });

  describe('pageDescription', function() {
    it('should be the description of the page', function() {
      createInfoPane({ description: 'The page description' });
      expect(self.element.scope().pageDescription).to.equal('The page description');
    });

    it('should not contain malicious html fragments', function() {
      createInfoPane({ description: '<b>The</b> <script>alert("Page");</script> <u>description</u>' });
      expect(self.element.scope().pageDescription).to.equal('<b>The</b>  <u>description</u>');
    });
  });

  describe('sourceDatasetURL', function() {
    it('should be a URL containing the dataset OBE id', function() {
      createInfoPane(null, {
        obeId: 'what-nooo'
      });

      expect(self.element.scope().sourceDatasetURL).to.equal('/d/what-nooo');
    });
  });
});
