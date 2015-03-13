describe('Page model', function() {
  var Page;
  var DatasetV0;
  var DatasetV1;
  var Dataset;
  var testHelpers;
  var $q;
  var $rootScope;
  var Model;

  var MockPageDataService = {};

  beforeEach(function() {
    module('dataCards', function($provide) {
      MockPageDataService = {};
      $provide.value('PageDataService', MockPageDataService);
    })
  });

  beforeEach(inject(function($injector) {
    DatasetV0 = $injector.get('DatasetV0');
    DatasetV1 = $injector.get('DatasetV1');
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');
    testHelpers = $injector.get('testHelpers');
    Model = $injector.get('Model');
  }));

  it('should correctly report the id passed into the constructor.', inject(function(Page) {
    var id = 'dead-beef';
    var instance = new Page(id);
    expect(instance.id).to.equal(id);
  }));

  it('should not attempt to fetch data if it is set locally first', inject(function(Page) {
    var id = 'dead-beef';
    var desc1 = 'A fine description';
    var desc2 = 'Another fine description';
    var desc3 = 'Yet another fine description';
    var expectedSequence = [desc1, desc2, desc3];

    MockPageDataService.getPageMetadata = function(id) {
      throw new Error('Should never try to get base info.');
    };

    var instance = new Page(id);
    instance.set('description', desc1);
    instance.observe('description').subscribe(function(val) {
      expect(val).to.equal(expectedSequence.shift());
    });
    instance.set('description', desc2);
    instance.set('description', desc3);
    expect(expectedSequence).to.be.empty;
  }));

  it('should attempt to fetch the description only when it is accessed.', inject(function(Page) {
    var id = 'dead-beef';
    var descFromApi = 'fromApi';
    var descFromSetter1 = 'fromSetter1';
    var descFromSetter2 = 'fromSetter2';
    var expectedSequence = [undefined, descFromApi, descFromSetter1, descFromSetter2];

    var shouldBeResolved = false;

    var mockPageMetadataDefer = $q.defer();
    var getPageMetadataCalled = false;
    MockPageDataService.getPageMetadata = function(id) {
      expect(getPageMetadataCalled).to.be.false;
      getPageMetadataCalled = true;
      expect(id).to.equal(id);
      return mockPageMetadataDefer.promise;
    };

    var instance = new Page(id);
    instance.observe('description').subscribe(function(val) {
      var exp = expectedSequence.shift();
      expect(shouldBeResolved).to.equal(exp !== undefined); // If it's undefined, it shouldn't be resolved
      expect(val).to.equal(exp);
    });

    shouldBeResolved = true;
    mockPageMetadataDefer.resolve({ 'description': descFromApi });
    $rootScope.$digest();
    expect(getPageMetadataCalled).to.be.true;

    instance.set('description', descFromSetter1);
    instance.set('description', descFromSetter2);
    expect(expectedSequence).to.be.empty;
  }));

  describe('dataset property', function() {
    var phases = ['0', '1', '2'];
    function datasetVersionExpectedForPhase(phase) {
      return phase === '2' ? '1' : '0';
    }

    _.each(phases, function(phase) {
      var datasetVersionExpected = datasetVersionExpectedForPhase(phase);
      describe('under phase {0}'.format(phase), function() {
        beforeEach(inject(function($injector) {
          // We have to inject Page after overriding the phase, because Page depends on Dataset,
          // whose factory returns the correct Dataset version based on what the phase is set to on
          // instantiation.
          testHelpers.overrideMetadataMigrationPhase(phase);
          Page = $injector.get('Page');
        }));

        it('should eventually return a DatasetV{0} model from the dataset property'.format(datasetVersionExpected), function(done) {
          var id = 'dead-beef';
          var datasetId = 'fooo-baar';

          var mockPageMetadataDefer = $q.defer();
          MockPageDataService.getPageMetadata = function(id) {
            expect(id).to.equal(id);
            return mockPageMetadataDefer.promise;
          };

          var instance = new Page(id);
          instance.observe('dataset').subscribe(function(val) {
            var expectedDatasetClass = datasetVersionExpected === '1' ? DatasetV1 : DatasetV0;
            if (val instanceof expectedDatasetClass) {
              expect(val.id).to.equal(datasetId);
              done();
            }
          });

          mockPageMetadataDefer.resolve({ 'datasetId': datasetId});
          $rootScope.$digest();
        });
      });
    });
  });

  describe('serialize', function() {
    beforeEach(inject(function($injector) {
      Page = $injector.get('Page');
    }));
    it('should correctly serialize', function(done) {
      var id = 'dead-beef';
      var datasetId = 'fooo-baar';

      var mockPageMetadataDefer = $q.defer();
      MockPageDataService.getPageMetadata = function(id) {
        expect(id).to.equal(id);
        return mockPageMetadataDefer.promise;
      };

      var instance = new Page(id);

      var observableFields = ['description', 'name', 'layoutMode', 'primaryAmountField', 'primaryAggregation', 'isDefaultPage', 'pageSource', 'cards'];
      var expectedFields = observableFields.concat([ 'datasetId' ]);

      // Ask for all of the fields, otherwise Page will never bother to fetch them.
      // Build sequences that will terminate when the field is set to something other than
      // undefined.
      var allFieldsAsObservables = _.map(observableFields, function(field) {
        return instance.observe(field).filter(_.isDefined).first().ignoreElements();
      });
      // Model's ready when all the above sequences terminate.
      var modelReady = Rx.Observable.merge.apply(Rx.Observable, allFieldsAsObservables);

      // Make sure the serialized blob looks right.
      modelReady.subscribe(undefined, undefined, function() {
        var serialized = instance.serialize();
        //TODO real schema in JJV.
        expect(serialized).to.have.keys(expectedFields);
        expect(serialized).to.have.property('datasetId', datasetId);
        done();
      });

      instance.set('dataset', {id: datasetId});
      mockPageMetadataDefer.resolve({
        'datasetId': datasetId,
        'description': 'desc',
        'name': 'dsName',
        'layoutMode': 'figures',
        'primaryAmountField': 'something',
        'primaryAggregation': 'count',
        'isDefaultPage': true,
        'pageSource': 'admin',
        'cards': []
      });
      $rootScope.$digest();
    });
  });

  describe('toggleExpanded', function() {
    beforeEach(inject(function($injector) {
      Page = $injector.get('Page');
    }));
    it('should toggle expanded on the given card', function() {
      var mockPageMetadataDefer = $q.defer();
      MockPageDataService.getPageMetadata = _.constant($q.when({ 'datasetId': 'fake-fbfr' }));

      var instance = new Page('dead-beef');

      var card = new Model();
      card.defineObservableProperty('expanded', false);
      instance.set('cards', [ card ]);

      instance.toggleExpanded(card);
      expect(card.getCurrentValue('expanded')).to.be.true;
      instance.toggleExpanded(card);
      expect(card.getCurrentValue('expanded')).to.be.false;
    });

    it('should only allow expanded on one card', function() {
      var mockPageMetadataDefer = $q.defer();
      MockPageDataService.getPageMetadata = _.constant($q.when({ 'datasetId': 'fake-fbfr' }));

      var instance = new Page('dead-beef');

      var cards = [ new Model(), new Model(), new Model() ]
      _.each(cards, function(card) {
        card.defineObservableProperty('expanded', false);
      });

      function expandedValues() {
        return _.map(cards, function(card) {
          return card.getCurrentValue('expanded');
        });
      };

      instance.set('cards', cards);

      instance.toggleExpanded(cards[0]);
      expect(expandedValues()).to.deep.equal([true, false, false]);
      instance.toggleExpanded(cards[2]);
      expect(expandedValues()).to.deep.equal([false, false, true]);
      instance.toggleExpanded(cards[2]);
      expect(expandedValues()).to.deep.equal([false, false, false]);
    });
  });
  describe('deserialization', function() {
    beforeEach(inject(function($injector) {
      Page = $injector.get('Page');
    }));
    it('should throw if missing the ID from the serialized blob', function() {
      expect(function() {
        new Page({
          description: "foo"
        });
      }).to.throw();
    });
    it('should not attempt to fetch data if the page was given a serialized blob first', function(done) {
      var id = 'dead-beef';
      var description = 'Page from serialized blob'

      MockPageDataService.getPageMetadata = function(id) {
        throw new Error('Should never try to get base info.');
      };

      var instance = new Page({
        pageId: id,
        description: description
      });

      instance.observe('description').subscribe(function(descr) {
        if (descr) {
          expect(descr).to.equal(description);
          done();
        }
      });

      $rootScope.$digest();
    });
  });
});
