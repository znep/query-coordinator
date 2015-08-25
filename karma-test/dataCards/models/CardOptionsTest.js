describe('CardOptions', function() {
  'use strict';

  var CardOptions;
  var Model;
  var model;
  var TEST_CARD_OPTIONS = {
    mapExtent: {'foo': 'bar'},
    bucketSize: 'a gajillion'
  };

  beforeEach(module('dataCards'));

  beforeEach(inject(function($injector) {
    Model = $injector.get('Model');
    CardOptions = $injector.get('CardOptions');
    model = new Model();
    model.version = 2;
  }));

  it('has default values', function() {
    var cardOptions = new CardOptions(model, {});
    expect(cardOptions.getCurrentValue('mapExtent')).to.eql({});
    expect(cardOptions.getCurrentValue('bucketSize')).to.eql(1);
  });

  it('initialized its values', function() {
    var cardOptions = new CardOptions(model, TEST_CARD_OPTIONS);
    expect(cardOptions.getCurrentValue('mapExtent')).to.eql(TEST_CARD_OPTIONS.mapExtent);
    expect(cardOptions.getCurrentValue('bucketSize')).to.eql(TEST_CARD_OPTIONS.bucketSize);
  });

  it('deserializes', function() {
    expect(CardOptions.deserialize).to.exist;
    var cardOptions = CardOptions.deserialize(model, TEST_CARD_OPTIONS);
    expect(cardOptions.getCurrentValue('mapExtent')).to.eql(TEST_CARD_OPTIONS.mapExtent);
    expect(cardOptions.getCurrentValue('bucketSize')).to.eql(TEST_CARD_OPTIONS.bucketSize);
  });

  it('serializes', function() {
    var cardOptions = new CardOptions(model, TEST_CARD_OPTIONS);
    expect(cardOptions.serialize).to.exist;
    var serialized = cardOptions.serialize();
    expect(serialized).to.eql(TEST_CARD_OPTIONS);
  });

  it('sets ephemeral properties', function() {
    var cardOptions = new CardOptions(model, TEST_CARD_OPTIONS);
    expect(cardOptions._isObservablePropertyEphemeral('mapExtent')).to.equal(false);
    expect(cardOptions._isObservablePropertyEphemeral('bucketSize')).to.equal(true);
  });

  it('serializes ephemeral properties even though they are ephemeral', function() {
    var cardOptions = new CardOptions(model, TEST_CARD_OPTIONS);
    expect(cardOptions.serialize).to.exist;
    expect(cardOptions._isObservablePropertyEphemeral('bucketSize')).to.equal(true);
    var serialized = cardOptions.serialize();
    expect(serialized.bucketSize).to.exist;
  });

});
