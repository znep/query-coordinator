describe("FacetsViewController", function() {
  var createController;
  beforeEach(module('socrataDatasetApp'));

  it('should provide a correct facet set', inject(function($controller, $rootScope, $q, ViewFacet) {
    function withFacets(facetsArray) {
      var scope = $rootScope.$new();
      var fakeViewId = 'fooo-baar';
      function MockView(viewId) {
        expect(viewId).to.equal(fakeViewId);
        this.getFacetsAsync = _.constant($q.when(facetsArray));
      };

      var controller = $controller('FacetsViewController', {
        $scope: scope,
          viewId: fakeViewId,
          focusedFacet: '',
          View: MockView
      });
      scope.$apply();
      expect(scope.view).to.be.instanceof(MockView);
      expect(scope.facets).to.equal(facetsArray); // note ref equality.

      return {
        scope: scope,
        controller: controller
      };
    };

    var facets = [];
    var scope = withFacets(facets).scope;
    expect(scope.facets).to.be.empty;

    facets = [new ViewFacet('asdf-fdsa')]
    scope = withFacets(facets).scope;
    expect(scope.facets).to.deep.equal(facets);

    facets = _.map(_.times(10, _.uniqueId), function(id) { return new ViewFacet(id); })
    scope = withFacets(facets).scope;
    expect(scope.facets).to.deep.equal(facets);
  }));
});
