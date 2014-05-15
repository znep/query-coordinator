describe("View model", function() {
  beforeEach(module('socrataDatasetApp'));

  it('should correctly report the id passed into the constructor.', inject(function(View) {
    var id = 'dead-beef';
    var instance = new View(id);
    expect(instance.id).to.equal(id);
  }));

  it('should return a Dataset instance from getDataset', inject(function(Dataset, View) {
    var instance = new View('dead-beef');
    expect(instance.getDataset()).to.be.instanceof(Dataset);
  }));

  it('should return a ViewFacet instance with the correct ID from getFacetFromIdAsync', function(done) {
    inject(function(Dataset, View, ViewFacet, $rootScope) {
      var fakeFacetId = 'pantaloons';
      var instance = new View('dead-beef');
      expect(instance.getFacetFromIdAsync(fakeFacetId)).to.eventually.satisfy(function(facet) {
        return facet instanceof ViewFacet && facet.id === fakeFacetId;
      }).notify(done);
      $rootScope.$apply();
    })
  });

  it('should eventually return some ViewFacets from getFacetsAsync', function(done) {
    inject(function(ViewFacet, View, $rootScope) {
      var instance = new View('dead-beef');
      expect(instance.getFacetsAsync()).to.eventually.satisfy(function(facets) {
        return facets.length > 0 && _.all(facets, function(f) { return f instanceof ViewFacet; });
      }).notify(done);
      $rootScope.$apply();
    })
  });
});
