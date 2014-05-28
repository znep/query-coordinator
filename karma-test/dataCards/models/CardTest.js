describe("Card model", function() {
  beforeEach(module('dataCards'));
  it('should correctly report the id passed into the constructor.', inject(function(Card) {
    var id = 'dead-beef';
    var instance = new Card(id);
    expect(instance.id).to.equal(id);
  }));
});
