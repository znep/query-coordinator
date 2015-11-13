describe('Routes service', function() {
  'use strict';

  var Routes;

  beforeEach(module('dataCards.services'));
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
      expect(Routes.getUIStateAndConfigFromUrl('/view/fake-fbfr')).to.have.deep.property('parameters.id', 'fake-fbfr');
    }));
  });

  describe('/component/visualization/add', function() {
    function verifyUrlResultsInParams(url, expectedParams) {
      it('should return the expected state and config', function() {
        expect(Routes.getUIStateAndConfigFromUrl(url)).to.deep.equal({
          stateName: 'view.visualizationAdd',
          parameters: expectedParams
        });
      });
    }

    describe('no defaultColumn or defaultRelatedVisualizationUid specified', function() {
      verifyUrlResultsInParams('/component/visualization/add', {
        defaultColumn: undefined,
        defaultRelatedVisualizationUid: undefined
      });
    });

    describe('defaultColumn specified', function() {
      verifyUrlResultsInParams('/component/visualization/add?defaultColumn=foobar', {
        defaultColumn: 'foobar',
        defaultRelatedVisualizationUid: undefined
      });
    });

    describe('defaultRelatedVisualizationUid specified', function() {
      verifyUrlResultsInParams('/component/visualization/add?defaultRelatedVisualizationUid=fooo-barr', {
        defaultColumn: undefined,
        defaultRelatedVisualizationUid: 'fooo-barr'
      });
    });

    describe('both defaultColumn and defaultRelatedVisualizationUid specified', function() {
      var expected = {
        defaultColumn: 'foo',
        defaultRelatedVisualizationUid: 'fooo-barr'
      };
      verifyUrlResultsInParams('/component/visualization/add?defaultColumn=foo&defaultRelatedVisualizationUid=fooo-barr', expected);
      verifyUrlResultsInParams('/component/visualization/add?defaultRelatedVisualizationUid=fooo-barr&defaultColumn=foo', expected);
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
