describe('DatasetMetadataController', function() {
  var DatasetV0;
  var $q;
  var $rootScope;
  var $controller;
  var mockDatasetDataService = {
    getDatasetMetadata: function() {
      return $q.when({
        id: 'asdf-fdsa',
        name: 'test dataset name',
        defaultAggregateColumn: 'foo',
        rowDisplayUnit: 'bar',
        ownerId: 'fdsa-asdf',
        updatedAt: '2004-05-20T17:42:55+00:00',
        columns: []
      });
    }
  };

  beforeEach(module('socrataCommon.directives'));
  beforeEach(module('socrataCommon.services'));
  beforeEach(module('/angular_templates/common/pageHeader.html'));

  beforeEach(module('dataCards'));
  beforeEach(function() {
    module(function($provide) {
      $provide.value('UserSessionService', {
        getCurrentUserObservable: _.constant(Rx.Observable.returnValue(null))
      });
      $provide.value('DatasetDataService', mockDatasetDataService);
      $provide.value('ConfigurationsService', {
        getThemeConfigurationsObservable: function() {
          return Rx.Observable.returnValue([]);
        },
        getConfigurationValue: _.noop
      });
    });
  });
  beforeEach(inject(function($injector){
    DatasetV0 = $injector.get('DatasetV0');
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');
    $controller = $injector.get('$controller');
  }));

  function makeController() {
    var scope = $rootScope.$new();
    var fakeDatasetId = 'fake-fbfr';

    var dataset = new DatasetV0(fakeDatasetId);

    var datasetMetadataPromise = $q.defer();
    var pagesInfoPromise = $q.defer();

    mockDatasetDataService.getDatasetMetadata = function() { return datasetMetadataPromise.promise; };
    mockDatasetDataService.getPagesForDataset = function() { return pagesInfoPromise.promise; };

    var controller = $controller('DatasetMetadataController', {
      $scope: scope,
      dataset: dataset,
    });

    scope.$apply();

    return {
      datasetMetadataPromise: datasetMetadataPromise,
      pagesInfoPromise: pagesInfoPromise,
      scope: scope,
      controller: controller,
      dataset: dataset
    };
  }

  describe('dataset name', function() {
    it('should update on the scope when the property changes on the model', function() {
      var controllerHarness = makeController();

      var controller = controllerHarness.controller;
      var scope = controllerHarness.scope;

      var name1 = _.uniqueId('name');
      var name2 = _.uniqueId('name');
      controllerHarness.datasetMetadataPromise.resolve({
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

  describe('dataset columns', function() {

    var columnsBlob = [
      {
        title: 'fake column title',
        name: 'fake_column',
        logicalDatatype: 'category',
        physicalDatatype: 'number',
        importance: 1
      }
    ];

    var datasetBlob = {
      id: 'fake-fbfr',
      name: 'fake dataset name',
      rowDisplayUnit: 'rdu',
      defaultAggregateColumn: 'foo',
      ownerId: 'fake-user',
      updatedAt: moment().toISOString(),
      columns: columnsBlob
    };

    it('should only include the real columns', function() {
      var controllerHarness = makeController();

      var controller = controllerHarness.controller;
      var scope = controllerHarness.scope;
      controllerHarness.datasetMetadataPromise.resolve($.extend({}, datasetBlob));
      $rootScope.$digest();

      expect(scope.datasetColumns).to.be.instanceof(Array);
      expect(scope.datasetColumns).to.deep.equal([ columnsBlob[0] ]);
    });

    it('should not include system columns', function() {
      var columnsBlob = [
        {
          title: 'fake column title',
          name: 'fake_column',
          logicalDatatype: 'category',
          physicalDatatype: 'number',
          importance: 1
        },
        {
          title: 'sys',
          name: ':sys_column',
          logicalDatatype: 'category',
          physicalDatatype: 'number',
          importance: 1
        }
      ];

      var controllerHarness = makeController();

      var controller = controllerHarness.controller;
      var scope = controllerHarness.scope;
      controllerHarness.datasetMetadataPromise.resolve($.extend({}, datasetBlob, { columns: columnsBlob }));
      $rootScope.$digest();

      expect(scope.datasetColumns).to.be.instanceof(Array);
      expect(scope.datasetColumns).to.deep.equal([ columnsBlob[0] ]);
    });
  });

  describe('dataset views', function() {

    var pagesBlob = {
      publisher: [
        { pageId: 'publ-isr1' },
        { pageId: 'publ-isr2' }
      ],
      user: [
        { pageId: 'user-viw1' },
        { pageId: 'user-viw2' },
        { pageId: 'user-viw3' }
      ]
    };

    var datasetBlob = {
      id: 'fake-fbfr',
      name: 'fake dataset name',
      rowDisplayUnit: 'rdu',
      defaultAggregateColumn: 'foo',
      ownerId: 'fake-user',
      updatedAt: moment().toISOString(),
      columns: []
    };

    describe('official', function() {
      it('should be on the scope', function() {
        var controllerHarness = makeController();

        var controller = controllerHarness.controller;
        var scope = controllerHarness.scope;
        controllerHarness.datasetMetadataPromise.resolve(datasetBlob);
        controllerHarness.pagesInfoPromise.resolve(pagesBlob);
        $rootScope.$digest();

        expect(scope.datasetPublisherPages).to.be.instanceof(Array).and.to.have.length(pagesBlob.publisher.length);

        var pageIdsFromScope = _.pluck(scope.datasetPublisherPages, 'id');
        expect(pageIdsFromScope).to.deep.equal(pageIdsFromScope);
      });
    });
  });
});
