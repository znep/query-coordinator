describe("ViewFacet model", function() {
  beforeEach(module('dataCards'));
  it('should correctly report the id passed into the constructor.', inject(function(ViewFacet) {
    var id = 'dead-beef';
    var instance = new ViewFacet(id);
    expect(instance.id).to.equal(id);
  }));
});
