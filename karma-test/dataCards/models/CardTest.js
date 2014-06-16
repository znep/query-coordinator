describe("Card model", function() {
  beforeEach(module('dataCards'));

  it('should define a serializedCard JSON schema', inject(function(Card, JJV) {
    expect(JJV.schema).to.have.property('serializedCard');
  }));

  it('deserialization should return an instance of Card with correct properties set', inject(function(Card, Page, JJV) {
    var blob = {
      "fieldName": "test_crime_type",
      "cardSize": 2,
      "cardCustomStyle": { "test_barColor": "#659CEF" },
      "expandedCustomStyle": { "test_zebraStripeRows" : true } ,
      "displayMode": "figures",
      "expanded": false
    };

    // Ensure the test has an up-to-date blob. If this fails, update the above blob.
    var requiredKeys = JJV.schema.serializedCard.required;
    expect(blob).to.have.keys(requiredKeys);

    var instance = Card.deserialize(new Page('fake-asdf'), blob);
    expect(instance).to.be.instanceof(Card);
    expect(instance.page).to.be.instanceof(Page);

    var out = {fieldName: blob.fieldName};
    _.each(requiredKeys, function(field) {
      expect(instance).to.have.property(field);
      if (field === 'fieldName') return; // fieldName isn't observable.
      instance[field].subscribe(function(v) { 
        out[field] = v;
      });
    });
    expect(out).to.deep.equal(blob);

    instance.description = 'test';
    expect(out).to.have.property('displayMode').that.equals('figures');
  }));
});
