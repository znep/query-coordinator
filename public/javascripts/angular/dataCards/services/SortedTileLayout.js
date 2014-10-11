/**
 * SortedTileLayout is a facility to group a list of tiles into tiers, each tier being
 * composed of a list of lines having a particular number of columns.  If the number of
 * items does not evenly divide into the number of columns for a given tier, the items are
 * rebalanced evenly across lines.
 */
angular.module('dataCards.services').factory('SortedTileLayout', function() {
  var defaultOptions = {
    // Key: The name of the tier
    // Value: The max number of items per row in that tier
    tiers: {
      1: 2,
      2: 3,
      3: 4,
      4: 1
    },
    tierAccessor: _.property('cardSize')
  };


  /**
   * Splits the given items into rows, where each row can contain at max maxPerRow items.
   *
   * @param {number} maxPerRow The maximum number of items one row can hold. No greater
   * than 4 right now.
   * @param {object[]} items An array of items.
   *
   * @return {object[][]} An array of rows, where each row is an array of items.
   */
  function splitRows(maxPerRow, items) {
    if (maxPerRow > 4) {
      throw new Error("Only up to four columns supported for this layout.");
    }

    var count = items.length;
    if (count <= maxPerRow) {
      return [items];
    }

    var numFullRows = Math.floor(count / maxPerRow);
    var remainder = count % maxPerRow;

    var outputRows = [];
    if (remainder === 0) {
      for(var i=0; i<numFullRows; i++) {
        outputRows.push(items.slice(i * maxPerRow, (i + 1) * maxPerRow));
      }
    } else {
      // Try to fill out the firstRow (that's not full) by borrowing from the full rows.
      // 'gap' is the number of items to borrow from the other rows, to get the firstRow
      // relatively full without becoming full (ie if we become full by making the
      // rows below us non-full, that'd look top-heavy. Stay non-full, because /someone/
      // has to)
      var gap = maxPerRow - remainder - 1;

      // Borrow one item from each of the full rows until we fill out the firstRow.
      var numItemsBorrowed = Math.min(numFullRows, gap);

      var firstRowLength = remainder + numItemsBorrowed
      var firstRow = _.first(items, firstRowLength);
      var restRows = _.rest(items, firstRowLength);

      // We borrowed one item from each of the reduced rows, so now their length is one
      // less.
      var reducedRowLength = maxPerRow - 1;
      var numReducedRowItems = reducedRowLength * numItemsBorrowed;
      var reducedRowItems = _.first(restRows, numReducedRowItems);
      var fullRowItems = _.rest(restRows, numReducedRowItems);

      outputRows.push(firstRow);

      // Slice up the reduced rows data into its rows of length numItemsBorrowed
      for(var i=0; i<numItemsBorrowed; i++) {
        outputRows.push(reducedRowItems.slice(
          i * reducedRowLength,
          (i + 1) * reducedRowLength));
      }

      // Now fill up
      for(var i = 0, fullRowsRemaining = numFullRows - numItemsBorrowed;
          i < fullRowsRemaining;
          i++) {
        outputRows.push(fullRowItems.slice(i * maxPerRow, (i + 1) * maxPerRow));
      }
    }

    return outputRows;
  }

  /**
   * @param {object} options has any of these optional keys:
   * @property {object} tiers Key is arbitrary tier name. Value is the natural column
   *   count for that tier.
   * @property {function} tierAccessor Given an item passed to doLayout, returns the tier
   *   name. The tier name must be in the tiers hash.
   * @constructor
   */
  function SortedTileLayout(options) {
    if (!_.isUndefined(options) && !_.isObject(options)) {
      throw new Error('Options object expected.');
    }

    this.options = $.extend({}, defaultOptions, options);
  };

  /**
   * Given an enumeration of item objects, returns an object whose keys are the tier
   * names, and the corresponding values are arrays of lines (which are themselves arrays
   * containing objects from the items enumeration).
   *
   * @param {object[]} items An enumeration of item objects.
   *
   * @return {object} Where the key is the tierId, and the value is an array of rows.
   */
  SortedTileLayout.prototype.doLayout = function(items) {
    // tiers is a hash of tierId -> itemsInThatTier[]
    var tiers = _.groupBy(items, this.options.tierAccessor);

    var out = {};
    _.forOwn(tiers, function(tierItems, tierId) {
      out[tierId] = splitRows(this.options.tiers[tierId], tierItems);
    }, this);

    return out;
  };

  return SortedTileLayout;
});
