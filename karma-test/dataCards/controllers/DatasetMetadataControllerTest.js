describe('DatasetMetadataController', function() {
  var Dataset;
  var $q;
  var $rootScope;
  var $controller;
  var mockDatasetDataService = {
    getBaseInfo: function() {
      return $q.when({
        id: 'asdf-fdsa',
        defaultAggregateColumn: 'foo',
        rowDisplayUnit: 'bar',
        ownerId: 'fdsa-asdf',
        updatedAt: '2004-05-20T17:42:55+00:00',
        columns: []
      });
    },
    getPageIds: function() {
      return $q.when({
        publisher: [],
        user: []
      });
    }
  };

  beforeEach(module('dataCards'));
  beforeEach(function() {
    module(function($provide) {
      $provide.value('DatasetDataService', mockDatasetDataService);
    });
  });
  beforeEach(inject(function($injector){
    Dataset = $injector.get('Dataset');
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');
    $controller = $injector.get('$controller');
  }));

  function makeController() {
    var scope = $rootScope.$new();
    var fakeDatasetId = 'fake-fbfr';

    var dataset = new Dataset(fakeDatasetId);

    var baseInfoPromise = $q.defer();

    mockDatasetDataService.getBaseInfo = function() { return baseInfoPromise.promise; };

    var controller = $controller('DatasetMetadataController', {
      $scope: scope,
      dataset: dataset,
    });

    scope.$apply();

    return {
      baseInfoPromise: baseInfoPromise,
      scope: scope,
      controller: controller,
      dataset: dataset
    };
  };

  describe('dataset title', function() {
    it('should update on the scope when the property changes on the model', function() {
      var controllerHarness = makeController();

      var controller = controllerHarness.controller;
      var scope = controllerHarness.scope;

      var title1 = _.uniqueId('title');
      var title2 = _.uniqueId('title');
      controllerHarness.baseInfoPromise.resolve({
        id: 'fake-fbfr',
        title: title1,
        rowDisplayUnit: 'rdu',
        defaultAggregateColumn: 'foo',
        ownerId: 'fake-user',
        updatedAt: moment().toISOString(),
        columns: []
      });
      $rootScope.$digest();

      expect(scope.datasetTitle).to.equal(title1);

      controllerHarness.dataset.set('title', title2);
      expect(scope.datasetTitle).to.equal(title2);
    });
  });
});
