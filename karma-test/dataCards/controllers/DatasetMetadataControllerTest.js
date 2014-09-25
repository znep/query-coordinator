describe('DatasetMetadataController', function() {
  var Dataset;
  var $q;
  var $rootScope;
  var $controller;
  var mockDatasetDataService = {
    getBaseInfo: function() {
      return $q.when({
        id: 'asdf-fdsa',
        name: 'test dataset name',
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

  describe('dataset name', function() {
    it('should update on the scope when the property changes on the model', function() {
      var controllerHarness = makeController();

      var controller = controllerHarness.controller;
      var scope = controllerHarness.scope;

      var name1 = _.uniqueId('name');
      var name2 = _.uniqueId('name');
      controllerHarness.baseInfoPromise.resolve({
        id: 'fake-fbfr',
        name: name1,
        rowDisplayUnit: 'rdu',
        defaultAggregateColumn: 'foo',
        ownerId: 'fake-user',
        updatedAt: moment().toISOString(),
        columns: []
      });
      $rootScope.$digest();

      expect(scope.datasetName).to.equal(name1);

      controllerHarness.dataset.set('name', name2);
      expect(scope.datasetName).to.equal(name2);
    });
  });
});
