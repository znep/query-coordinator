describe('Page model', function() {
  var Page, Dataset, $q, $rootScope, Model;

  var MockPageDataService = {};

  beforeEach(function() {
    module('dataCards', function($provide) {
      MockPageDataService = {};
      $provide.value('PageDataService', MockPageDataService);
    })
  });

  beforeEach(inject(function($injector) {
    Page = $injector.get('Page');
    Dataset = $injector.get('Dataset');
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');
    Model = $injector.get('Model');
  }));

  it('should correctly report the id passed into the constructor.', inject(function(Page) {
    var id = 'dead-beef';
    var instance = new Page(id);
    expect(instance.id).to.equal(id);
  }));

  it('should not attempt to fetch data if it is set locally first', function() {
    var id = 'dead-beef';
    var desc1 = 'A fine description';
    var desc2 = 'Another fine description';
    var desc3 = 'Yet another fine description';
    var expectedSequence = [desc1, desc2, desc3];

    MockPageDataService.getBaseInfo = function(id) {
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
  });

  it('should attempt to fetch the description only when it is accessed.', function() {
    var id = 'dead-beef';
    var descFromApi = 'fromApi';
    var descFromSetter1 = 'fromSetter1';
    var descFromSetter2 = 'fromSetter2';
    var expectedSequence = [undefined, descFromApi, descFromSetter1, descFromSetter2];

    var shouldBeResolved = false;

    var staticInfoDefer =$q.defer();
    var getBaseInfoCalled = false;
    MockPageDataService.getBaseInfo = function(id) {
      expect(getBaseInfoCalled).to.be.false;
      getBaseInfoCalled = true;
      expect(id).to.equal(id);
      return staticInfoDefer.promise;
    };

    var instance = new Page(id);
    instance.observe('description').subscribe(function(val) {
      var exp = expectedSequence.shift();
      expect(shouldBeResolved).to.equal(exp !== undefined); // If it's undefined, it shouldn't be resolved
      expect(val).to.equal(exp);
    });

    shouldBeResolved = true;
    staticInfoDefer.resolve({ 'description': descFromApi});
    $rootScope.$digest();
    expect(getBaseInfoCalled).to.be.true;

    instance.set('description', descFromSetter1);
    instance.set('description', descFromSetter2);
    expect(expectedSequence).to.be.empty;
  });

  it('should eventually return a Dataset model from the dataset property', function(done) {
    var id = 'dead-beef';
    var datasetId = 'fooo-baar';

    var staticInfoDefer =$q.defer();
    MockPageDataService.getBaseInfo = function(id) {
      expect(id).to.equal(id);
      return staticInfoDefer.promise;
    };

    var instance = new Page(id);
    instance.observe('dataset').subscribe(function(val) {
      if (val instanceof Dataset) {
        expect(val.id).to.equal(datasetId);
        done();
      }
    });

    staticInfoDefer.resolve({ 'datasetId': datasetId});
    $rootScope.$digest();
  });

  it('should correctly serialize', function(done) {
    var id = 'dead-beef';
    var datasetId = 'fooo-baar';

    var staticInfoDefer = $q.defer();
    MockPageDataService.getBaseInfo = function(id) {
      expect(id).to.equal(id);
      return staticInfoDefer.promise;
    };

    var instance = new Page(id);
    instance.observe('dataset').subscribe(function(val) {
      if (val instanceof Dataset) {
        var serialized = instance.serialize();
        //TODO real schema in JJV.
        var fields = ['description', 'name', 'layoutMode', 'primaryAmountField', 'primaryAggregation', 'isDefaultPage', 'pageSource', 'baseSoqlFilter', 'cards', 'datasetId'];
        expect(serialized).to.have.keys(fields);
        expect(serialized).to.have.property('datasetId', datasetId);
        done();
      }
    });

    staticInfoDefer.resolve({ 'datasetId': datasetId});
    $rootScope.$digest();
  });

  describe('toggleExpanded', function() {
    it('should toggle expanded on the given card', function() {
      var staticInfoDefer = $q.defer();
      MockPageDataService.getBaseInfo = _.constant($q.when({ 'datasetId': 'fake-fbfr' }));

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
      var staticInfoDefer = $q.defer();
      MockPageDataService.getBaseInfo = _.constant($q.when({ 'datasetId': 'fake-fbfr' }));

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
});
