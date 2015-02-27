describe('Card model', function() {
  var Model;
  var Page;
  var CardV0;

  beforeEach(module('dataCards'));

  beforeEach(inject(function($injector) {
    Model = $injector.get('Model');
    CardV0 = $injector.get('CardV0');
    Page = $injector.get('Page');
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

    var requiredKeys = Schemas.regarding('card_metadata').getSchemaDefinition('0').required;

    var instance = CardV0.deserialize(new Page('fake-asdf'), blob);
    expect(instance).to.be.instanceof(CardV0);
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

    _.each(requiredKeys, function(field) {
      if (field === 'fieldName') { // fieldName isn't observable.
        expect(instance[field]).to.exist;
      } else if (field === 'cardType') {
        return; // cardType is determined asynchronously, and is covered in separate tests.
      } else {
        expect(instance.observe(field)).to.exist;
        instance.observe(field).subscribe(function(v) { 
          readBackProperties[field] = v;
        });
      }
    });
    expect(readBackProperties).to.deep.equal(blob);
    expect(readBackProperties).to.have.property('displayMode').that.equals('figures');
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
        fred: 'category',
        cardinality: 10,
        dataset: dataset
      }
    });
    dataset.version = '1';
    page.set('dataset', dataset);

    var instance = CardV0.deserialize(page, blob);

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

    var instance = CardV0.deserialize(page, blob);

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

    var instance = CardV0.deserialize(new Page('fake-asdf'), blob);
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

    var instance = CardV0.deserialize(new Page('fake-asdf'), blob);

    var clone = instance.clone();

    expect(clone.fieldName).to.equal(instance.fieldName);
    expect(clone.getCurrentValue('cardSize')).to.equal(instance.getCurrentValue('cardSize'));
    expect(clone.getCurrentValue('displayMode')).to.equal(instance.getCurrentValue('displayMode'));
    expect(clone.getCurrentValue('expanded')).to.equal(instance.getCurrentValue('expanded'));
    expect(clone.uniqueId).to.equal(instance.uniqueId);
  });
});
