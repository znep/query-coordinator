describe("CardsViewController", function() {
  var createController;
  beforeEach(module('socrataDatasetApp'));

  it('should provide correct primary, secondary, and tertiary card sets', inject(function($controller, $rootScope, $q, ViewFacet) {
    //TODO parametrize controller on breaks, if needed.
    var secondaryBreak = 3;
    var tertiaryBreak = 7;

    function withFacets(facetsArray) {
      var scope = $rootScope.$new();
      var fakeViewId = 'fooo-baar';
      function MockView(viewId) {
        expect(viewId).to.equal(fakeViewId);
        this.getFacetsAsync = _.constant($q.when(facetsArray));
      };

      var controller = $controller('CardsViewController', {
        $scope: scope,
          viewId: fakeViewId,
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
    expect(scope.primaryFacets).to.be.empty;
    expect(scope.secondaryFacets).to.be.empty;
    expect(scope.tertiaryFacets).to.be.empty;

    facets = [new ViewFacet('asdf-fdsa')]
    scope = withFacets(facets).scope;
    expect(scope.primaryFacets).to.deep.equal(facets);
    expect(scope.secondaryFacets).to.be.empty;
    expect(scope.tertiaryFacets).to.be.empty;

    facets = _.map(_.times(secondaryBreak, _.uniqueId), function(id) { return new ViewFacet(id); })
    scope = withFacets(facets).scope;
    expect(scope.primaryFacets).to.deep.equal(facets);
    expect(scope.secondaryFacets).to.be.empty;
    expect(scope.tertiaryFacets).to.be.empty;

    facets = _.map(_.times(secondaryBreak + 1, _.uniqueId), function(id) { return new ViewFacet(id); })
    scope = withFacets(facets).scope;
    expect(scope.primaryFacets).to.deep.equal(_.first(facets, secondaryBreak));
    expect(scope.secondaryFacets).to.deep.equal(_.rest(facets, secondaryBreak));
    expect(scope.tertiaryFacets).to.be.empty;

    facets = _.map(_.times(tertiaryBreak, _.uniqueId), function(id) { return new ViewFacet(id); })
    scope = withFacets(facets).scope;
    expect(scope.primaryFacets).to.deep.equal(_.first(facets, secondaryBreak));
    expect(scope.secondaryFacets).to.deep.equal(_.rest(facets, secondaryBreak));
    expect(scope.tertiaryFacets).to.be.empty;

    facets = _.map(_.times(tertiaryBreak + 1, _.uniqueId), function(id) { return new ViewFacet(id); })
    scope = withFacets(facets).scope;
    expect(scope.primaryFacets).to.deep.equal(_.first(facets, secondaryBreak));
    expect(scope.secondaryFacets).to.deep.equal(_.at(facets, _.range(secondaryBreak, tertiaryBreak)));
    expect(scope.tertiaryFacets).to.deep.equal(_.rest(facets, tertiaryBreak));
  }));
});
