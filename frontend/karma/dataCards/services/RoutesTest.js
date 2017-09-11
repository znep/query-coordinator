import { expect, assert } from 'chai';
const angular = require('angular');

describe('Routes service', function() {
  'use strict';

  var Routes;

  beforeEach(angular.mock.module('dataCards'));
  beforeEach(inject(function($injector) {
    Routes = $injector.get('Routes');
  }));

  describe('Page view routes', function() {
    it('should return a view of view.cards for a valid page URL', inject(function(Routes) {
      expect(Routes.getUIStateAndConfigFromUrl('/view/fake-fbfr')).to.have.property('stateName', 'view.cards');
    }));
    it('should not return a view of view.cards for an invalid page 4x4', inject(function(Routes) {
      expect(Routes.getUIStateAndConfigFromUrl('/view/fake-fb')).to.not.have.property('stateName', 'view.cards');
      expect(Routes.getUIStateAndConfigFromUrl('/view/fake-fbfr/')).to.not.have.property('stateName', 'view.cards');
    }));
    it('should return parameters with the correct page ID for a valid page URL', inject(function(Routes) {
      expect(Routes.getUIStateAndConfigFromUrl('/view/fake-fbfr')).to.have.nested.property('parameters.id', 'fake-fbfr');
    }));
  });

  describe('/component/visualization/add', function() {
    function verifySearchParamResults(searchParams, expectedParams) {
      it('should return the expected state and config', function() {
        var result = Routes.getUIStateAndConfigFromUrl('/component/visualization/add', searchParams);

        expect(result).to.deep.equal({
          stateName: 'view.visualizationAdd',
          parameters: expectedParams
        });
      });
    }

    describe('no defaultColumn or defaultRelatedVisualizationUid specified', function() {
      verifySearchParamResults('', {
        defaultColumn: undefined,
        defaultVifType: undefined,
        defaultRelatedVisualizationUid: undefined
      });
    });

    describe('defaultColumn specified', function() {
      verifySearchParamResults('defaultColumn=foo', {
        defaultColumn: 'foo',
        defaultVifType: undefined,
        defaultRelatedVisualizationUid: undefined
      });
    });

    describe('defaultViftype specified', function() {
      verifySearchParamResults('defaultVifType=bar', {
        defaultColumn: undefined,
        defaultVifType: 'bar',
        defaultRelatedVisualizationUid: undefined
      });
    });

    describe('defaultRelatedVisualizationUid specified', function() {
      verifySearchParamResults('defaultRelatedVisualizationUid=fooo-barr', {
        defaultColumn: undefined,
        defaultVifType: undefined,
        defaultRelatedVisualizationUid: 'fooo-barr'
      });
    });

    describe('defaultColumn and defaultVifType specified', function() {
      var expected = {
        defaultColumn: 'foo',
        defaultVifType: 'bar',
        defaultRelatedVisualizationUid: undefined
      };
      verifySearchParamResults(
        'defaultColumn=foo&defaultVifType=bar',
        expected
      );
      verifySearchParamResults(
        'defaultVifType=bar&defaultColumn=foo',
        expected
      );
    });

    describe('defaultColumn and defaultRelatedVisualizationUid specified', function() {
      var expected = {
        defaultColumn: 'foo',
        defaultVifType: undefined,
        defaultRelatedVisualizationUid: 'fooo-barr'
      };
      verifySearchParamResults(
        'defaultColumn=foo&defaultRelatedVisualizationUid=fooo-barr',
        expected
      );
      verifySearchParamResults(
        'defaultRelatedVisualizationUid=fooo-barr&defaultColumn=foo',
        expected
      );
    });

    describe('defaultColumn, defaultVifType and defaultRelatedVisualizationUid specified', function() {
      var expected = {
        defaultColumn: 'foo',
        defaultVifType: 'bar',
        defaultRelatedVisualizationUid: 'fooo-barr'
      };
      verifySearchParamResults(
        'defaultColumn=foo&defaultVifType=bar&defaultRelatedVisualizationUid=fooo-barr',
        expected
      );
      verifySearchParamResults(
        'defaultRelatedVisualizationUid=fooo-barr&defaultVifType=bar&defaultColumn=foo',
        expected
      );
    });
  });

  describe('Bad routes', function() {
    // Yeah, literally trying to reduce an infinite number of strings to a few test cases.
    it('should return a view of 404 for some bad routes I could think up', inject(function(Routes) {
      expect(Routes.getUIStateAndConfigFromUrl('/page/fake-fbfr')).to.have.property('stateName', '404');
      expect(Routes.getUIStateAndConfigFromUrl('/d/fake-fbfr')).to.have.property('stateName', '404');
      expect(Routes.getUIStateAndConfigFromUrl('')).to.have.property('stateName', '404');
      expect(Routes.getUIStateAndConfigFromUrl('/')).to.have.property('stateName', '404');
      expect(Routes.getUIStateAndConfigFromUrl('#')).to.have.property('stateName', '404');
      expect(Routes.getUIStateAndConfigFromUrl('fake-fbfr')).to.have.property('stateName', '404');
      expect(Routes.getUIStateAndConfigFromUrl('http://why.is.this.passed.to.us')).to.have.property('stateName', '404');
      expect(Routes.getUIStateAndConfigFromUrl('/a/s/d/f/g/hg')).to.have.property('stateName', '404');
    }));
  });
});
