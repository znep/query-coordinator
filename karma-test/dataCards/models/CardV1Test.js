describe('Card model', function() {
  var Model;
  var Page;
  var CardV1;

  beforeEach(module('dataCards'));

  beforeEach(inject(function($injector) {
    Model = $injector.get('Model');
    CardV1 = $injector.get('CardV1');
    Page = $injector.get('Page');
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

    var instance = CardV1.deserialize(new Page('fake-asdf'), blob);
    expect(instance).to.be.instanceof(CardV1);
    expect(instance.page).to.be.instanceof(Page);

    var out = {fieldName: blob.fieldName};
    expect(instance.getCurrentValue('activeFilters')).to.deep.equal([
        new Filter.IsNullFilter(false)
      ]);
    out['activeFilters'] = _.invoke(instance.getCurrentValue('activeFilters'), 'serialize');

    _.each(requiredKeys, function(field) {
      if (field === 'fieldName') { // fieldName isn't observable.
        expect(instance[field]).to.exist;
      } else {
        expect(instance.observe(field)).to.exist;
        instance.observe(field).subscribe(function(v) { 
          out[field] = v;
        });
      }
    });
    expect(out).to.deep.equal(blob);
    expect(out).to.have.property('cardType').that.equals('column');
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

    var instance = CardV1.deserialize(new Page('fake-asdf'), blob);
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

    var instance = CardV1.deserialize(new Page('fake-asdf'), blob);

    var clone = instance.clone();

    expect(clone.fieldName).to.equal(instance.fieldName);
    expect(clone.getCurrentValue('cardSize')).to.equal(instance.getCurrentValue('cardSize'));
    expect(clone.getCurrentValue('cardType')).to.equal(instance.getCurrentValue('cardType'));
    expect(clone.getCurrentValue('expanded')).to.equal(instance.getCurrentValue('expanded'));
    expect(clone.uniqueId).to.equal(instance.uniqueId);
  });
});
