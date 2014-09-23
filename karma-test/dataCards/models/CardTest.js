describe('Card model', function() {
  beforeEach(module('dataCards'));

  it('should define a serializedCard JSON schema', inject(function(Card, JJV) {
    expect(JJV.schema).to.have.property('serializedCard');
  }));

  it('deserialization should return an instance of Card with correct properties set', inject(function(Card, Page, JJV, Filter) {
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
});
