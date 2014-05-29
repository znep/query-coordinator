describe("Card model", function() {
  beforeEach(module('dataCards'));

  it('deserialization should return an instance of Card with correct properties set', inject(function(Card, Page) {
    var blob = {
      "description": "test_I am a fancy card",
      "fieldName": "test_crime_type",
      "importance": 2,
      "cardCustomStyle": { "test_barColor": "#659CEF" },
      "expandedCustomStyle": { "test_zebraStripeRows" : true } ,
      "displayMode": "test_figures",
      "expanded": false
    };

    // Ensure the test has an up-to-date blob. If this fails, update the above blob.
    expect(blob).to.have.keys(Card._serializedFields);

    var instance = Card.deserialize(new Page(), blob);
    expect(instance).to.be.instanceof(Card);
    expect(instance.page).to.be.instanceof(Page);

    var out = {fieldName: blob.fieldName};
    _.each(Card._serializedFields, function(field) {
      expect(instance).to.have.property(field);
      if (field === 'fieldName') return; // fieldName isn't observable.
      instance[field].subscribe(function(v) { 
        out[field] = v;
      });
    });
    expect(out).to.deep.equal(blob);

    instance.description = 'test';
    expect(out).to.have.property('description').that.equals('test');
  }));
});
