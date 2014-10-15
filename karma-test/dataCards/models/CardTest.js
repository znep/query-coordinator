describe('Card model', function() {
  var Page;
  var Card;

  beforeEach(module('dataCards'));

  beforeEach(inject(function($injector) {
    Card = $injector.get('Card');
    Page = $injector.get('Page');
  }));

  it('should define a serializedCard JSON schema', inject(function(Card, JJV) {
    expect(JJV.schema).to.have.property('serializedCard');
  }));

  it('deserialization should return an instance of Card with correct properties set', inject(function(JJV, Filter) {
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

    var requiredKeys = JJV.schema.serializedCard.required;

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
});
