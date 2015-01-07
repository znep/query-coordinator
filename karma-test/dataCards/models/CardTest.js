describe('Card model', function() {
  var Model;
  var Page;
  var Card;
  var ServerConfig;

  beforeEach(module('dataCards'));

  beforeEach(inject(function($injector) {
    Model = $injector.get('Model');
    Card = $injector.get('Card');
    Page = $injector.get('Page');
    ServerConfig = $injector.get('ServerConfig');
    ServerConfig.setup({
      oduxCardTypeMapping: {
        'map': {
          'number': [ { type: 'column' } ]
        }
      }
    });
  }));

  it('should define a serializedCard JSON schema', inject(function(Card, Schemas) {
    expect(Schemas.regarding('card_metadata').getSchemaWithVersion('0')).to.exist;
  }));

  it('deserialization should return an instance of Card with correct properties set', inject(function(Schemas, Filter) {
    var blob = {
      'fieldName': 'test_crime_type',
      'cardSize': 2,
      'cardCustomStyle': { 'test_barColor': '#659CEF' },
      'expandedCustomStyle': { 'test_zebraStripeRows' : true } ,
      'displayMode': 'figures',
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

    var requiredKeys = Schemas.regarding('card_metadata').getSchemaWithVersion('0').required;

    var instance = Card.deserialize(new Page('fake-asdf'), blob);
    expect(instance).to.be.instanceof(Card);
    expect(instance.page).to.be.instanceof(Page);

    var out = {fieldName: blob.fieldName};
    expect(instance.getCurrentValue('activeFilters')).to.deep.equal([
        new Filter.IsNullFilter(false)
      ]);
    out['activeFilters'] = _.invoke(instance.getCurrentValue('activeFilters'), 'serialize');

    _.each(requiredKeys, function(field) {
      if (field === 'fieldName') { // fieldName isn't observable.
        expect(instance[field]).to.exist;
      } else if (field === 'cardType') {
        return; // cardType is determined asynchronously, and is covered in separate tests.
      } else {
        expect(instance.observe(field)).to.exist;
        instance.observe(field).subscribe(function(v) { 
          out[field] = v;
        });
      }
    });
    expect(out).to.deep.equal(blob);
    expect(out).to.have.property('displayMode').that.equals('figures');
  }));

  it('should provide a sane default cardType if none is provided', function(done) {
    var blob = {
      'fieldName': 'test_crime_type',
      'cardSize': 2,
      'cardCustomStyle': { 'test_barColor': '#659CEF' },
      'expandedCustomStyle': { 'test_zebraStripeRows' : true } ,
      'displayMode': 'figures',
      'expanded': false,
      'activeFilters': []
    };

    var page = new Page('fake-asdf');
    var dataset = new Model();
    dataset.defineObservableProperty('columns', {
      'test_crime_type': {
        physicalDatatype: 'number',
        cardinality: 10
      }
    });
    page.set('dataset', dataset);

    var instance = Card.deserialize(page, blob);

    instance.observe('cardType').filter(_.isPresent).subscribe(function(cardType) {
      expect(cardType).to.equal('column');
      done();
    });
  });

  it('should use the cardType in the serialized blob if it is provided', function(done) {
    var blob = {
      'fieldName': 'test_crime_type',
      'cardSize': 2,
      'cardCustomStyle': { 'test_barColor': '#659CEF' },
      'expandedCustomStyle': { 'test_zebraStripeRows' : true } ,
      'displayMode': 'figures',
      'expanded': false,
      'activeFilters': [],
      'cardType': 'some_magical_card_type'
    };

    var page = new Page('fake-asdf');
    var dataset = new Model();
    dataset.defineObservableProperty('columns', {
      'test_crime_type': {
        physicalDatatype: 'number',
        cardinality: 10
      }
    });
    page.set('dataset', dataset);

    var instance = Card.deserialize(page, blob);

    instance.observe('cardType').filter(_.isPresent).subscribe(function(cardType) {
      expect(cardType).to.equal('some_magical_card_type');
      done();
    });
  });

  // TODO this test and the associated product behavior is just to work around
  // Models handling exceptions badly. Instead of breaking on serialization we need
  // to break on property set. Right now the models will break badly if we do that.
  it('should throw an exception on serialization when the model values do not conform to the schema.', function() {
    var blob = {
      'fieldName': 'testField',
      'cardSize': 2,
      'cardCustomStyle': {},
      'expandedCustomStyle': {} ,
      'displayMode': 'figures',
      'expanded': false,
      'activeFilters': []
    };

    var instance = Card.deserialize(new Page('fake-asdf'), blob);
    instance.set('cardSize', '3'); // This property is expected to be an int.

    expect(function() { instance.serialize(); }).to.throw();
  });

  it('should create a clone with the same properties, including the unique id', function() {
    var blob = {
      'fieldName': 'testField',
      'cardSize': 2,
      'cardCustomStyle': {},
      'expandedCustomStyle': {} ,
      'displayMode': 'figures',
      'expanded': false,
      'activeFilters': []
    };

    var instance = Card.deserialize(new Page('fake-asdf'), blob);

    var clone = instance.clone();

    expect(clone.fieldName).to.equal(instance.fieldName);
    expect(clone.getCurrentValue('cardSize')).to.equal(instance.getCurrentValue('cardSize'));
    expect(clone.getCurrentValue('displayMode')).to.equal(instance.getCurrentValue('displayMode'));
    expect(clone.getCurrentValue('expanded')).to.equal(instance.getCurrentValue('expanded'));
    expect(clone.uniqueId).to.equal(instance.uniqueId);
  });
});
