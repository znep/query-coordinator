describe('SortedTileLayout', function() {
  var SortedTileLayout;
  var instance;
  var actual;
  var tierOne = {cardSize: '1'};
  var tierTwo = {cardSize: '2'};
  var tierThree = {cardSize: '3'};

  var testCases = [
    {
      items: [tierOne],
      expected: {
        '1': [[tierOne]]
      }
    },
    {
      items: [tierOne, tierOne, tierOne],
      expected: {
        '1': [[tierOne], [tierOne, tierOne]]
      }
    },
    {
      items: [tierOne, tierOne, tierOne, tierOne],
      expected: {
        '1': [[tierOne, tierOne], [tierOne, tierOne]]
      }
    },
    {
      items: [tierOne, tierOne, tierOne, tierOne, tierOne],
      expected: {
        '1': [[tierOne], [tierOne, tierOne], [tierOne, tierOne]]
      }
    },
    {
      items: [tierTwo],
      expected: {
        '2': [[tierTwo]]
      }
    },
    {
      items: _.fill(new Array(4), tierTwo),
      expected: {
        '2': [[tierTwo, tierTwo], [tierTwo, tierTwo]]
      }
    },
    {
      items: _.fill(new Array(5), tierTwo),
      expected: {
        '2': [[tierTwo, tierTwo], [tierTwo, tierTwo, tierTwo]]
      }
    },
    {
      items: _.fill(new Array(6), tierTwo),
      expected: {
        '2': [[tierTwo, tierTwo, tierTwo], [tierTwo, tierTwo, tierTwo]]
      }
    },
    {
      items: _.fill(new Array(7), tierTwo),
      expected: {
        '2': [[tierTwo, tierTwo], [tierTwo, tierTwo], [tierTwo, tierTwo, tierTwo]]
      }
    },
    {
      items: _.fill(new Array(8), tierTwo),
      expected: {
        '2': [[tierTwo, tierTwo], [tierTwo, tierTwo, tierTwo], [tierTwo, tierTwo, tierTwo]]
      }
    },
    {
      items: _.fill(new Array(10), tierTwo),
      expected: {
        '2': [[tierTwo, tierTwo], [tierTwo, tierTwo], [tierTwo, tierTwo, tierTwo], [tierTwo, tierTwo, tierTwo]]
      }
    },
    {
      items: [tierThree],
      expected: {
        '3': [[tierThree]]
      }
    },
    {
      items: _.fill(new Array(4), tierThree),
      expected: {
        '3': [[tierThree, tierThree, tierThree, tierThree]]
      }
    },
    {
      items: _.fill(new Array(5), tierThree),
      expected: {
        '3': [[tierThree, tierThree], [tierThree, tierThree, tierThree]]
      }
    },
    {
      items: _.fill(new Array(6), tierThree),
      expected: {
        '3': [[tierThree, tierThree, tierThree], [tierThree, tierThree, tierThree]]
      }
    },
    {
      items: _.fill(new Array(7), tierThree),
      expected: {
        '3': [[tierThree, tierThree, tierThree], [tierThree, tierThree, tierThree, tierThree]]
      }
    },
    {
      items: _.fill(new Array(9), tierThree),
      expected: {
        '3': [[tierThree, tierThree, tierThree], [tierThree, tierThree, tierThree], [tierThree, tierThree, tierThree]]
      }
    },
    {
      items: [tierOne, tierOne, tierTwo, tierThree],
      expected: {
        '1': [[tierOne, tierOne]],
        '2': [[tierTwo]],
        '3': [[tierThree]]
      }
    },
    {
      items: [
        tierOne, tierOne,
        tierTwo, tierTwo, tierTwo,
        tierThree, tierThree, tierThree, tierThree
      ],
      expected: {
        '1': [[tierOne, tierOne]],
        '2': [[tierTwo, tierTwo, tierTwo]],
        '3': [[tierThree, tierThree, tierThree, tierThree]]
      }
    }
  ];

  beforeEach(module('dataCards.services'));
  beforeEach(inject(function(_SortedTileLayout_) {
    SortedTileLayout = _SortedTileLayout_;
  }));
  beforeEach(function() {
    var options = {
      tiers: {
        '1': 2,
        '2': 3,
        '3': 4
      }
    };

    instance = new SortedTileLayout(options);
  });

  it('should expect an optional configuration object in the constructor.', function() {
    new SortedTileLayout();
    expect(function() { new SortedTileLayout(3); }).to.throw();
    expect(function() { new SortedTileLayout(''); }).to.throw();
  });

  describe('#doLayout', function() {
    _.forEach(testCases, function(testCase) {
      it('should generate layout for {0}'.format(JSON.stringify(testCase.items)), function() {
        actual = instance.doLayout(testCase.items);
        expect(actual).to.deep.equal(testCase.expected);
      });
    });
  });
});
