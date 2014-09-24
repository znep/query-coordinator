describe('Routes service', function() {
  beforeEach(module('dataCards.services'));

  describe('Page view routes', function() {
    it('should return a view of view.cards for a valid page URL', inject(function(Routes) {
      expect(Routes.getUIStateAndConfigFromUrl('/view/fake-fbfr')).to.have.property('stateName', 'view.cards');
    }));
    it('should not return a view of view.cards for an invalid page 4x4', inject(function(Routes) {
      expect(Routes.getUIStateAndConfigFromUrl('/view/fake-fb')).to.not.have.property('stateName', 'view.cards');
      expect(Routes.getUIStateAndConfigFromUrl('/view/fake-fbfr/')).to.not.have.property('stateName', 'view.cards');
    }));
    // Disabled because the implementation is wrong.
    xit('should return parameters with the correct page ID for a valid page URL', inject(function(Routes) {
      expect(Routes.getUIStateAndConfigFromUrl('/view/fake-fbfr')).to.have.deep.property('parameters.id', 'fake-fbfr');
    }));
  });
  describe('Bad routes', function() {
    // Yeah, literally trying to reduce an infinite number of strings to a few test cases.
    // Disabled because the implementation is wrong.
    xit('should return a view of 404 for some bad routes I could think up', inject(function(Routes) {
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
