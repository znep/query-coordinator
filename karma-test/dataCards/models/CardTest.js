describe('Card model', function() {
  var Model;
  var Page;
  var Card;

  beforeEach(module('dataCards'));

  beforeEach(inject(function($injector) {
    Model = $injector.get('Model');
    Card = $injector.get('Card');
    Page = $injector.get('Page');
    Mockumentary = $injector.get('Mockumentary');
  }));

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

    var requiredKeys = Schemas.regarding('card_metadata').getSchemaDefinition('1').required;
    var page = Mockumentary.createPage();
    var instance = Card.deserialize(page, blob);
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

  // TODO this test and the associated product behavior is just to work around
  // Models handling exceptions badly. Instead of breaking on serialization we need
  // to break on property set. Right now the models will break badly if we do that.
  it('should throw an exception on serialization when the model values do not conform to the schema.', function() {
    var blob = {
      'fieldName': 'testField',
      'cardSize': 2,
      'cardType': 'column',
      'expanded': false,
      'activeFilters': []
    };

    var page = Mockumentary.createPage();
    var instance = Card.deserialize(page, blob);
    instance.set('cardSize', '3'); // This property is expected to be an int.

    expect(function() { instance.serialize(); }).to.throw();
  });

  it('should create a clone with the same properties, including the unique id', function() {
    var blob = {
      'fieldName': 'testField',
      'cardSize': 2,
      'cardType': 'column',
      'expanded': false,
      'activeFilters': []
    };

    var page = Mockumentary.createPage();
    var instance = Card.deserialize(page, blob);
    var clone = instance.clone();

    expect(clone.fieldName).to.equal(instance.fieldName);
    expect(clone.getCurrentValue('cardSize')).to.equal(instance.getCurrentValue('cardSize'));
    expect(clone.getCurrentValue('cardType')).to.equal(instance.getCurrentValue('cardType'));
    expect(clone.getCurrentValue('expanded')).to.equal(instance.getCurrentValue('expanded'));
    expect(clone.uniqueId).to.equal(instance.uniqueId);
  });
});
