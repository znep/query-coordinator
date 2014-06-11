describe("SortedTileLayout", function() {
  var _layout;

  beforeEach(module('dataCards.services'));
  beforeEach(inject(function(SortedTileLayout) {
    _layout = SortedTileLayout;
  }));

  it('should expect an optional configuration object in the constructor.', function() {
    new _layout();
    expect(function() { new _layout(3); }).to.throw();
    expect(function() { new _layout(""); }).to.throw();
  });

  it('should correctly handle <= column count per tier', function() {
    var options = {
      tiers: {
        '1': 2,
        '2': 3,
        '3': 4
      }
    };

    var instance = new _layout(options);
    
    var tierOne = {cardSize: '1'};
    var tierTwo = {cardSize: '2'};
    var tierThree = {cardSize: '3'};

    expect(instance.doLayout([tierOne])).to.deep.equal(
      {
        '1': [[tierOne]]
      });

    expect(instance.doLayout([tierTwo])).to.deep.equal(
      {
        '2': [[tierTwo]]
      });

    expect(instance.doLayout([tierOne, tierOne, tierTwo, tierThree])).to.deep.equal(
      {
        '1': [[tierOne, tierOne]],
        '2': [[tierTwo]],
        '3': [[tierThree]]
      });

    expect(instance.doLayout([tierOne, tierOne, tierTwo, tierTwo, tierTwo, tierThree, tierThree, tierThree, tierThree])).to.deep.equal(
      {
        '1': [[tierOne, tierOne]],
        '2': [[tierTwo, tierTwo, tierTwo]],
        '3': [[tierThree, tierThree, tierThree, tierThree]]
      });
  });

  it('should correctly handle > column count per tier', function() {
    var options = {
      tiers: {
        '1': 2,
        '2': 3,
        '3': 4
      }
    };

    var instance = new _layout(options);
    
    var tierOne = {cardSize: '1'};
    var tierTwo = {cardSize: '2'};
    var tierThree = {cardSize: '3'};

    expect(instance.doLayout([tierOne, tierOne, tierOne])).to.deep.equal(
      {
        '1': [[tierOne], [tierOne, tierOne]]
      });

    expect(instance.doLayout([tierOne, tierOne, tierOne, tierOne])).to.deep.equal(
      {
        '1': [[tierOne, tierOne], [tierOne, tierOne]]
      });

    expect(instance.doLayout([tierOne, tierOne, tierOne, tierOne, tierOne])).to.deep.equal(
      {
        '1': [[tierOne], [tierOne, tierOne], [tierOne, tierOne]]
      });

    expect(instance.doLayout([tierTwo, tierTwo, tierTwo, tierTwo])).to.deep.equal(
      {
        '2': [[tierTwo, tierTwo], [tierTwo, tierTwo]]
      });

    expect(instance.doLayout([tierTwo, tierTwo, tierTwo, tierTwo])).to.deep.equal(
      {
        '2': [[tierTwo, tierTwo], [tierTwo, tierTwo]]
      });

    expect(instance.doLayout([tierTwo, tierTwo, tierTwo, tierTwo, tierTwo, tierTwo])).to.deep.equal(
      {
        '2': [[tierTwo, tierTwo, tierTwo], [tierTwo, tierTwo, tierTwo]]
      });

    expect(instance.doLayout([tierTwo, tierTwo, tierTwo, tierTwo, tierTwo])).to.deep.equal(
      {
        '2': [[tierTwo, tierTwo], [tierTwo, tierTwo, tierTwo]]
      });
  });
});
