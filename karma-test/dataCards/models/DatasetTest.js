describe("Dataset model", function() {
  beforeEach(module('dataCards'));
  it('should correctly report the id passed into the constructor.', inject(function(Dataset) {
    var id = 'dead-beef';
    var instance = new Dataset(id);
    expect(instance.id).to.equal(id);
  }));
  it('should reject bad/no 4x4s passed into the constructor.', inject(function(Dataset) {
    expect(function(){new Dataset();}).to.throw();
    expect(function(){new Dataset(5);}).to.throw();
    expect(function(){new Dataset(null);}).to.throw();
    expect(function(){new Dataset('1234-12345');}).to.throw();
    expect(function(){new Dataset('12345-1234');}).to.throw();
    expect(function(){new Dataset('foo.-beef');}).to.throw();
  }));
});
