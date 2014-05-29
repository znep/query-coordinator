describe("Card model", function() {
  beforeEach(module('dataCards'));

  it('deserialization should return an instance of Card', inject(function(Card) {
    var instance = Card.deserialize({});
    expect(instance).to.be.instanceof(Card);
  }));

  it('deserialization should return an instance of Card with correct properties set', inject(function(Card) {
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

    var instance = Card.deserialize(blob);
    expect(instance).to.be.instanceof(Card);

    var out = {};
    _.each(Card._serializedFields, function(field) {
      expect(instance).to.have.property(field);
      instance[field].subscribe(function(v) { 
        out[field] = v;
      });
    });
    expect(out).to.deep.equal(blob);

    instance.description = 'test';
    expect(out).to.have.property('description').that.equals('test');
  }));
});
