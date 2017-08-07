import { expect, assert } from 'chai';
const angular = require('angular');

// Note that in each of these tests, the lensType text is transformed to uppercase by a CSS rule.

describe('lensType', () => {
  'use strict';

  let testHelpers;
  let rootScope;
  let Mockumentary;
  let ServerConfig;
  let scope;

  const element = '<lens-type />';
  const compiledElement = () => testHelpers.TestDom.compileAndAppend(element, scope);

  beforeEach(angular.mock.module('test'));
  beforeEach(angular.mock.module('dataCards'));

  beforeEach(inject(($injector) => {
    testHelpers = $injector.get('testHelpers');
    rootScope = $injector.get('$rootScope');
    Mockumentary = $injector.get('Mockumentary');
    ServerConfig = $injector.get('ServerConfig');
    scope = rootScope.$new();
  }));

  afterEach(() => testHelpers.TestDom.clear());

  describe('when enable_data_lens_provenance feature flag is false', () => {
    beforeEach(() => ServerConfig.override('enable_data_lens_provenance', false));

    describe('when disable_authority_badge feature flag is "none"', () => {
      beforeEach(() => ServerConfig.override('disable_authority_badge', 'none'));

      it('should render an official lens type regardless of the provenance value', () => {
        scope.page = Mockumentary.createPage({provenance: 'official'});
        assert.equal(compiledElement().find('span:visible').text(), 'official');

        scope.page = Mockumentary.createPage({provenance: 'community'});
        assert.equal(compiledElement().find('span:visible').text(), 'official');
      });
    });

    describe('when disable_authority_badge feature flag is "all"', () => {
      beforeEach(() => ServerConfig.override('disable_authority_badge', 'all'));

      it('should not render any lens type regardless of provenance value', () => {
        scope.page = Mockumentary.createPage({provenance: 'official'});
        assert.equal(compiledElement().find('span:visible').text(), '');

        scope.page = Mockumentary.createPage({provenance: 'community'});
        assert.equal(compiledElement().find('span:visible').text(), '');
      });
    });

    describe('when disable_authority_badge feature flag is "official2"', () => {
      beforeEach(() => ServerConfig.override('disable_authority_badge', 'official2'));

      it('should not render any lens type regardless of provenance value', () => {
        scope.page = Mockumentary.createPage({provenance: 'official'});
        assert.equal(compiledElement().find('span:visible').text(), '');

        scope.page = Mockumentary.createPage({provenance: 'community'});
        assert.equal(compiledElement().find('span:visible').text(), '');
      });
    });

    describe('when disable_authority_badge feature flag is "community"', () => {
      beforeEach(() => ServerConfig.override('disable_authority_badge', 'community'));

      it('should render an official lens type regardless of provenance value', () => {
        scope.page = Mockumentary.createPage({provenance: 'official'});
        assert.equal(compiledElement().find('span:visible').text(), 'official');

        scope.page = Mockumentary.createPage({provenance: 'community'});
        assert.equal(compiledElement().find('span:visible').text(), 'official');
      });
    });
  });

  describe('when enable_data_lens_provenance feature flag is true', () => {
    beforeEach(() => ServerConfig.override('enable_data_lens_provenance', true));

    describe('when disable_authority_badge feature flag is "none"', () => {
      beforeEach(() => ServerConfig.override('disable_authority_badge', 'none'));

      it('should render an official lens type when provenance is official', () => {
        scope.page = Mockumentary.createPage({provenance: 'official'});
        assert.equal(compiledElement().find('span:visible').text(), 'official');
      });

      it('should render a community lens type when provenance is community', () => {
        scope.page = Mockumentary.createPage({provenance: 'community'});
        assert.equal(compiledElement().find('span:visible').text(), 'community');
      });

      it('updates the provenance on the page if the page changes provenance', () => {
        // This can happen if the user changes the page's provenance in the
        // "Manage" dialog.
        scope.page = Mockumentary.createPage({provenance: 'official'});
        assert.equal(compiledElement().find('span:visible').text(), 'official');
        scope.page.set('provenance', 'community');
        assert.equal(compiledElement().find('span:visible').text(), 'community');
      });
    });

    describe('when disable_authority_badge feature flag is "all"', () => {
      beforeEach(() => ServerConfig.override('disable_authority_badge', 'all'));

      it('should not render a community lens type when provenance is community', () => {
        scope.page = Mockumentary.createPage({provenance: 'official'});
        assert.equal(compiledElement().find('span:visible').text(), '');
      });

      it('should not render a official lens type when provenance is official', () => {
        scope.page = Mockumentary.createPage({provenance: 'official'});
        assert.equal(compiledElement().find('span:visible').text(), '');
      });
    });

    describe('when disable_authority_badge feature flag is "official2"', () => {
      beforeEach(() => ServerConfig.override('disable_authority_badge', 'official2'));

      it('should render a community lens type when provenance is community', () => {
        scope.page = Mockumentary.createPage({provenance: 'community'});
        assert.equal(compiledElement().find('span:visible').text(), 'community');
      });

      it('should not render a community lens type when provenance is official', () => {
        scope.page = Mockumentary.createPage({provenance: 'official'});
        assert.equal(compiledElement().find('span:visible').text(), '');
      });
    });

    describe('when disable_authority_badge feature flag is "community"', () => {
      beforeEach(() => ServerConfig.override('disable_authority_badge', 'community'));

      it('should not render a community lens type when provenance is community', () => {
        scope.page = Mockumentary.createPage({provenance: 'community'});
        assert.equal(compiledElement().find('span:visible').text(), '');
      });

      it('should render a official lens type when provenance is official', () => {
        scope.page = Mockumentary.createPage({provenance: 'official'});
        assert.equal(compiledElement().find('span:visible').text(), 'official');
      });
    });
  });

});
