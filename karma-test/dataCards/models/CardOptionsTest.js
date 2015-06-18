describe('CardOptions', function() {
  'use strict';

  var CardOptions;
  var Model;
  var model;
  var TEST_CARD_OPTIONS = {
    mapExtent: {'foo': 'bar'}
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
  });

  it('initialized its values', function() {
    var cardOptions = new CardOptions(model, TEST_CARD_OPTIONS);
    expect(cardOptions.getCurrentValue('mapExtent')).to.eql(TEST_CARD_OPTIONS.mapExtent);
  });

  it('deserializes', function() {
    expect(CardOptions.deserialize).to.exist;
    var cardOptions = CardOptions.deserialize(model, TEST_CARD_OPTIONS);
    expect(cardOptions.getCurrentValue('mapExtent')).to.eql(TEST_CARD_OPTIONS.mapExtent);
  });

  it('serializes', function() {
    var cardOptions = new CardOptions(model, TEST_CARD_OPTIONS);
    expect(cardOptions.serialize).to.exist;
    var serialized = cardOptions.serialize();
    expect(serialized).to.eql(TEST_CARD_OPTIONS);
  })

});
