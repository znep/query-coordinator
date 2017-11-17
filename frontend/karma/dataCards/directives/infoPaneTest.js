import sinon from 'sinon';
import { expect, assert } from 'chai';
const angular = require('angular');

describe('infoPane', function() {
  'use strict';

  var self;
  var $provide;
  var testHelpers;
  var dependencies = [
    '$rootScope',
    'Mockumentary',
    'WindowOperations'
  ];

  beforeEach(angular.mock.module('test'));
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

    var configService = $injector.get('ServerConfig');
    configService.setup({
      locales: {
        currentLocale: 'en',
        defaultLocale: 'en'
      },
      siteTitle: 'Socrata'
    });
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
      assert.isTrue($(self.element.children().first()).hasClass('cards-metadata'));
    });

    it('should have lensType child', function() {
      assert.lengthOf(self.element.find('lens-type'), 1);
    });

    it('should have a link to the source dataset', function() {
      assert.lengthOf(self.element.find('.source-dataset-name a'), 1);
    });

    it('should have an exportMenu child', function() {
      assert.lengthOf(self.element.find('export-menu'), 1);
    });

    it('should have an apiExplorer child', function() {
      assert.lengthOf(self.element.find('api-explorer'), 1);
    });

    it('should have a button to toggle the visibility of the manage lens dialog', function() {

      // Set shouldShowManageLens to true on parent scope to make visible.
      self.$scope.$apply(function() { self.$scope.shouldShowManageLens = true; });

      assert.lengthOf(self.element.find('.manage-section .action-btn'), 1);
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
    it('should be a URL containing the dataset OBE id by default', function() {
      createInfoPane(null, {
        obeId: 'what-nooo'
      });

      expect(self.element.scope().sourceDatasetURL).to.equal('/d/asdf-fdsa');
    });

    it('should be a URL containing the derived id if based on a derived view', function() {
      createInfoPane(
        {
          isFromDerivedView: true
        },
        {
          id: 'elep-hant',
          obeId: 'what-nooo'
        }
      );

      expect(self.element.scope().sourceDatasetURL).to.equal('/d/elep-hant');
    });
  });
});
