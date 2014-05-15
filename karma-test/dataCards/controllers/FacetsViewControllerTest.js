describe("FacetsViewController", function() {
  var createController;
  beforeEach(module('dataCards'));

  it('should provide a correct facet set and focused facet on the scope.', inject(function($controller, $rootScope, $q, ViewFacet) {
    function withFacets(facetsArray) {
      function MockView(viewId) {
        this.getFacetsAsync = _.constant($q.when(facetsArray));
      };

      var scope = $rootScope.$new();
      var fakeViewId = 'fooo-baar';
      var fakeView = new MockView(fakeViewId);
      var fakeFocusedFacet = new ViewFacet('pants');

      var controller = $controller('FacetsViewController', {
        $scope: scope,
          view: fakeView,
          focusedFacet: fakeFocusedFacet
      });
      scope.$apply();
      expect(scope.view).to.equal(fakeView);
      expect(scope.facets).to.equal(facetsArray);
      expect(scope.focusedFacet).to.equal(fakeFocusedFacet);

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
