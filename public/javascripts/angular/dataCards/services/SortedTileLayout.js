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
      throw new Error('Only up to four columns supported for this layout.');
    }

    var count = items.length;
    // One row
    if (count <= maxPerRow) {
      return [items];
    }

    var remainder = count % maxPerRow;
    var chunkedRows = _(items).drop(remainder).chunk(maxPerRow).value();

    // Even number of rows with size maxPerRow
    if (remainder === 0) {
      return chunkedRows;
    }

    // If first whole row, plus remainder, can be combined and evenly distributes over
    // two rows, do it, and add the other full rows after
    var fullRowPlusRemainder = (remainder + maxPerRow);
    if (chunkedRows.length > 1 && fullRowPlusRemainder % 2 === 0) {
      var firstTwoRows = _(items).take(fullRowPlusRemainder).chunk(fullRowPlusRemainder / 2).value();
      var restRows = _(items).drop(fullRowPlusRemainder).chunk(maxPerRow).value();
      return firstTwoRows.concat(restRows);
    }

    // If the gap between the remainder and the maxPerRow is greater than 1,
    // recompute rows with a maxPerRow of one fewer
    // This might not scale up to rows with maxPerRow greater than 4
    if (remainder < maxPerRow - 1) {
      return splitRows(maxPerRow - 1, items);
    }

    // If we've made it this far, we can combine a row made from the remainder,
    // with the other full rows
    var remainderRow = _.take(items, remainder);
    return [remainderRow].concat(chunkedRows);

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
  }

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
