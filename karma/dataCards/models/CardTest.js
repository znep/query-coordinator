describe('Card model', function() {
  'use strict';

  var Model;
  var Page;
  var Card;
  var Mockumentary;
  var ServerConfig;
  var page;
  var TEST_CARD_BLOB = {
    fieldName: 'testField',
    cardSize: 2,
    cardType: 'column',
    expanded: false,
    aggregationField: 'wabbit',
    aggregationFunction: 'sum',
    activeFilters: []
  };

  beforeEach(angular.mock.module('dataCards'));

  beforeEach(inject(function($injector) {
    Model = $injector.get('Model');
    Card = $injector.get('Card');
    Page = $injector.get('Page');
    Mockumentary = $injector.get('Mockumentary');
    ServerConfig = $injector.get('ServerConfig');
  }));

  function makeCard(cardBlob, pageOverrides, datasetOverrides) {
    page = Mockumentary.createPage(pageOverrides, datasetOverrides);
    return Card.deserialize(page, cardBlob);
  }

  it('deserialization should return an instance of Card with correct properties set', inject(function(Schemas, Filter) {
    var blob = {
      'fieldName': 'test_crime_type',
      'cardSize': 2,
      'cardType': 'column',
      'expanded': false,
      'activeFilters': [
        {
          'function': 'IsNull',
          'arguments': {
            'isNull': false
          }
        }
      ]
    };
    var instance = makeCard(blob);

    var requiredKeys = Schemas.regarding('card_metadata').getSchemaDefinition('1').required;
    expect(instance).to.be.instanceof(Card);
    expect(instance.page).to.be.instanceof(Page);

    // Call observe() on all required properties, and record
    // the values that come back in readBackProperties.
    // Then compare readBackProperties to the input blob.
    // They should be equal.
    var readBackProperties = {fieldName: blob.fieldName};
    expect(instance.getCurrentValue('activeFilters')).to.deep.equal([
        new Filter.IsNullFilter(false)
      ]);
    readBackProperties['activeFilters'] = _.invoke(instance.getCurrentValue('activeFilters'), 'serialize');
    readBackProperties['cardType'] = instance.getCurrentValue('cardType');

    _.each(requiredKeys, function(field) {
      if (field === 'fieldName') { // fieldName isn't observable.
        expect(instance[field]).to.exist;
      } else {
        expect(instance.observe(field)).to.exist;
        instance.observe(field).subscribe(function(v) {
          readBackProperties[field] = v;
        });
      }
    });
    expect(readBackProperties).to.deep.equal(blob);
    expect(readBackProperties).to.have.property('cardType').that.equals('column');
  }));

  it('deserialization should migrate BinaryOperator filters on Choropleths to use BinaryComputedGeoregionOperator filters', inject(function(Filter) {
    var blob = {
      'fieldName': 'crime_location',
      'cardSize': 2,
      'cardType': 'choropleth',
      'expanded': false,
      'computedColumn': ':@computed_crime_location',
      'activeFilters': [
        {
          'function': 'BinaryOperator',
          'arguments': {
            'operator': '=',
            'operand': '90210'
          }
        }
      ]
    };
    var instance = makeCard(blob);
    var activeFilters = instance.getCurrentValue('activeFilters');

    expect(activeFilters.length).to.equal(1);
    expect(activeFilters[0]).to.be.instanceof(Filter.BinaryComputedGeoregionOperatorFilter);
    expect(activeFilters[0]).to.have.property('computedColumnName').that.equals(':@computed_crime_location');
    expect(activeFilters[0]).to.have.property('operator').that.equals('=');
    expect(activeFilters[0]).to.have.property('operand').that.equals('90210');
  }));

  it('deserialization should not migrate BinaryOperator filters on non-Choroplehts to use BinaryComputedGeoregionOperator filters even if there is a computed column', inject(function(Filter) {
    var blob = {
      'fieldName': 'crime_location',
      'cardSize': 2,
      'cardType': 'columnChart',
      'expanded': false,
      'computedColumn': ':@computed_crime_location',
      'activeFilters': [
        {
          'function': 'BinaryOperator',
          'arguments': {
            'operator': '=',
            'operand': 'test'
          }
        }
      ]
    };
    var instance = makeCard(blob);
    var activeFilters = instance.getCurrentValue('activeFilters');

    expect(activeFilters.length).to.equal(1);
    expect(activeFilters[0]).to.be.instanceof(Filter.BinaryOperatorFilter);
    expect(activeFilters[0]).to.have.property('operator').that.equals('=');
    expect(activeFilters[0]).to.have.property('operand').that.equals('test');
  }));

  // TODO this test and the associated product behavior is just to work around
  // Models handling exceptions badly. Instead of breaking on serialization we need
  // to break on property set. Right now the models will break badly if we do that.
  it('should throw an exception on serialization when the model values do not conform to the schema.', function() {
    var instance = makeCard(TEST_CARD_BLOB);
    instance.set('cardSize', '3'); // This property is expected to be an int.

    expect(function() { instance.serialize(); }).to.throw();
  });

  it('should create a clone with the same properties, including the unique id', function() {
    var instance = makeCard(TEST_CARD_BLOB);
    var clone = instance.clone();

    expect(clone.fieldName).to.equal(instance.fieldName);
    expect(clone.getCurrentValue('cardSize')).to.equal(instance.getCurrentValue('cardSize'));
    expect(clone.getCurrentValue('cardType')).to.equal(instance.getCurrentValue('cardType'));
    expect(clone.getCurrentValue('expanded')).to.equal(instance.getCurrentValue('expanded'));
    expect(clone.uniqueId).to.equal(instance.uniqueId);
  });

  describe('customTitle', function() {
    var instance;
    beforeEach(function() {
      instance = makeCard(TEST_CARD_BLOB);
    });

    it('should exist', function() {
      expect(instance.getCurrentValue('customTitle')).to.not.be.undefined;
    });

    it('should default to null', function() {
      expect(instance.getCurrentValue('customTitle')).to.equal(null);
    });

    it('should be able to be set', function() {
      instance.set('customTitle', 'custom value');
      expect(instance.getCurrentValue('customTitle')).to.equal('custom value');
    });
  });

  describe('setOption', function() {
    var instance;
    beforeEach(function() {
      instance = makeCard(TEST_CARD_BLOB);
    });

    it('exists', function() {
      expect(instance).to.respondTo('setOption');
    });

    it('sets the value of the given option property', function() {
      var testValue = {foo: 'bar'};
      instance.setOption('mapExtent', testValue);
      expect(instance.getCurrentValue('cardOptions').getCurrentValue('mapExtent')).to.eql(testValue);
    });
  });

  describe('aggregation', function() {
    it('defaults to the page aggregation if the page is version 3 or lower', function(done) {
      var card = makeCard(TEST_CARD_BLOB, { version: 3 });
      Rx.Observable.subscribeLatest(
        card.observe('aggregation').first(),
        page.observe('aggregation').first(),
        function(cardAggregation, pageAggregation) {
          expect(cardAggregation).to.deep.equal(pageAggregation);
          done();
        }
      );
    });

    it('defaults to the page aggregation if the appropriate feature flag is disabled', function(done) {
      sinon.stub(ServerConfig, 'get').withArgs('enableDataLensCardLevelAggregation').returns(false);
      var card = makeCard(TEST_CARD_BLOB, { version: 4 });
      Rx.Observable.subscribeLatest(
        card.observe('aggregation').first(),
        page.observe('aggregation').first(),
        function(cardAggregation, pageAggregation) {
          expect(cardAggregation).to.deep.equal(pageAggregation);
          ServerConfig.get.restore();
          done();
        }
      );
    });

    describe('when using the card aggregation', function() {

      // Required so aggregation gets correctly generated.
      var datasetOverrides = {
        columns: {
          wabbit: {
            name: 'wabbit',
            physicalDatatype: 'rodent',
            defaultCardType: 'invalid',
            availableCardTypes: []
          }
        }
      };

      beforeEach(function() {
        sinon.stub(ServerConfig, 'get').withArgs('enableDataLensCardLevelAggregation').returns(true);
      });

      afterEach(function() {
        ServerConfig.get.restore();
      });

      it('uses the aggregation fields from the card blob', function(done) {
        var card = makeCard(TEST_CARD_BLOB, { version: 4 }, datasetOverrides);
        card.observe('aggregation').subscribe(function(aggregation) {
          expect(aggregation['function']).to.equal('sum');
          expect(aggregation.fieldName).to.equal('wabbit');
          done();
        });
      });

      it('defaults to count(*) if the aggregation fields are not present', function(done) {
        var cardBlob = _.clone(TEST_CARD_BLOB);
        delete cardBlob.aggregationFunction;
        delete cardBlob.aggregationField;

        var card = makeCard(cardBlob, { version: 4 }, datasetOverrides);
        card.observe('aggregation').subscribe(function(aggregation) {
          expect(aggregation['function']).to.equal('count');
          expect(aggregation.fieldName).to.equal(null);
          done();
        });
      });

      it('defaults to count(*) if the aggregation fields are null', function(done) {
        var cardBlob = _.clone(TEST_CARD_BLOB);
        cardBlob.aggregationFunction = null;
        cardBlob.aggregationField = null;

        var card = makeCard(cardBlob, { version: 4 }, datasetOverrides);
        card.observe('aggregation').subscribe(function(aggregation) {
          expect(aggregation['function']).to.equal('count');
          expect(aggregation.fieldName).to.equal(null);
          done();
        });
      });

      it('defaults to count(*) if the aggregationField is not a valid column', function(done) {
        var cardBlob = _.clone(TEST_CARD_BLOB);
        var card = makeCard(cardBlob, { version: 4 });
        card.observe('aggregation').subscribe(function(aggregation) {
          expect(aggregation['function']).to.equal('count');
          expect(aggregation.fieldName).to.equal(null);
          done();
        });
      });

      it('uses the name of the column as the unit if a valid column is provided for aggregationField', function(done) {
        var cardBlob = _.clone(TEST_CARD_BLOB);
        var card = makeCard(cardBlob, { version: 4 }, datasetOverrides);
        card.observe('aggregation').subscribe(function(aggregation) {
          expect(aggregation.unit).to.equal('wabbit');
          expect(aggregation.rowDisplayUnit).to.equal('row');
          done();
        });
      });
    });
  });
});
