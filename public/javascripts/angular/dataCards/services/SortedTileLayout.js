// SortedTileLayout is a facility to group a list of tiles into tiers, each tier being
// composed of a list of lines having a particular number of columns.
// If the number of items does not evenly divide into the number of column
// for a given tier, the items are rebalanced evenly across lines.
angular.module('dataCards.services').factory('SortedTileLayout', function() {
  var defaultOptions = {
    tiers: {
      '1': 2,
      '2': 3,
      '3': 4,
      '4': 1
    },
    tierAccessor: _.property('cardSize')
  };


  var splitRows = function(maxPerRow, items) {
    if (maxPerRow > 4) { throw new Error("Only up to four columns supported for this layout."); }

    var count = items.length;
    var numFullRows = Math.floor(count / maxPerRow);
    var remainder = count % maxPerRow;

    if (count <= maxPerRow) { return [items]; }

    var outputRows = [];
    if (remainder === 0) {
      for(var i=0; i<numFullRows; i++) {
        outputRows.push(items.slice(i * maxPerRow, (i + 1) * maxPerRow));
      }
    } else {
      var gap = maxPerRow - remainder - 1;
      var reducedRows = Math.min(numFullRows, gap);

      var firstRow = _.first(items, remainder + reducedRows);

      var restRows = _.rest(items, remainder + reducedRows);

      var reducedRowItems = _.first(restRows, (maxPerRow - 1) * reducedRows);
      var fullRowItems = _.rest(restRows, (maxPerRow - 1) * reducedRows);

      outputRows.push(firstRow);

      for(var i=0; i<reducedRows; i++) {
        outputRows.push(reducedRowItems.slice(i * (maxPerRow - 1), (i + 1) * (maxPerRow - 1)));
      }

      for(var i=0; i<numFullRows - reducedRows; i++) {
        outputRows.push(fullRowItems.slice(i * maxPerRow, (i + 1) * maxPerRow));
      }
    }

    return outputRows;
  };

  // Constructor. Options has any of these optional keys:
  // tiers: Hash. Key is arbitrary tier name. Value is the natural column count for that tier.
  // tierAccessor. Function. Given an item passed to doLayout, returns the tier name.
  //               The tier name must be in the tiers has.
  function SortedTileLayout(options) {
    if (!_.isUndefined(options) && !_.isObject(options)) { throw new Error('Options object expected.') };

    this.options = $.extend({}, defaultOptions, options);
  };

  // Given an enumeration of items, returns an object whose keys
  // are the tier names, and the corresponding values are arrays
  // of lines (which are themselves arrays containing objects
  // from the items enumeration).
  SortedTileLayout.prototype.doLayout = function(items) {
    var self = this;
    var tiers = _.groupBy(items, this.options.tierAccessor);

    var out = _.reduce(tiers, function(acc, tierItems, tierId) {
      acc[tierId] = splitRows(self.options.tiers[tierId], tierItems);
      return acc;
    }, {});

    return out;
  };

  return SortedTileLayout;
});
