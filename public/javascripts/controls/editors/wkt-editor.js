(function($) {

  var typeMapping = {
    'point': 'point',
    'multipoint': 'multipoint',
    'line': 'linestring',
    'multiline': 'multilinestring',
    'polygon': 'polygon',
    'multipolygon': 'multipolygon'
  };

  /**
   * @function flatten
   * @description
   * A highly specialized flatten for the case of an Array within an Array.
   * Approach: Clean out parent array, add each item from the child array.
   *
   * WARNING: This function mutates the original array. This is intentional.
   *
   * @param {Array} parent - The parent array.
   * @param {Array} child - The child array.
   */
  function flatten(parent, child) {
    parent.splice(0);
    Array.prototype.push.apply(parent, child);
  };

  /**
   * @function removeExcessParentheses
   * @description
   * In the one-off Multipoint cases, we remove unnecessary parens.
   * For example: MULTIPOINT((100 100)) => {type: "Multipoint", coordinates: [[100, 100]]}
   *
   * WARNING: This function mutates the original array. This is intentional.
   *
   * @param {Array} item - An array potentially containing excess array dimensionality.
   */
  function removeExcessParentheses(item) {
    if (Array.isArray(item) && !item.every(_.isNumber)) {
      item.forEach(removeExcessParentheses, item);
    }

    if(this.length === 1) {
      flatten(this, item);
    }
  };

  var wktEditor = {

    /**
     * @function toGeoJSON
     * @desc Converts Well-known Text into GeoJSON.
     * @param {String} wkt - A candidate WKT string.
     * @returns {Object|null} - Returns a GeoJSON object, or null if WKT cannot be converted.
     */
    toGeoJSON: function (wkt) {
      var parsed = WKT.parse(wkt);

      // Multipoint are specifically declared by the OGC as follows:
      // <empty set> | <left paren> <point text> {<comma> <point text>}* <right paren>
      // where <point text> = <empty set> | <left paren> <point> <right paren>
      // Most implementations of multipoint chose <point> instead of <point text>.
      // Our crappy WKT parser is one of those implementations, so here we are...
      if (parsed && parsed.coordinates && /multipoint/i.test(wkt)) {
        removeExcessParentheses.call(parsed.coordinates, parsed.coordinates);
      }

      return parsed;
    },

    /**
     * @function toWKT
     * @desc Converts GeoJSON into Well-known Text.
     * @param {String} geoJSON - A candidate GeoJSON string.
     * @returns {String|null} - A string representation of WKT.
     */
    toWKT: function (geoJSON) {
      return WKT.stringify(geoJSON);
    },

    // This is the editable version of value.
    flattenValue: function() {
      if ($.isPlainObject(this.originalValue)) {
        this.originalValue = this.toWKT(this.originalValue);
      }
    },

    isValid: function() {
      var type = typeMapping[this.type.name];
      var geoJSON = this.toGeoJSON(this.wktValue());

      // WKT.parse returns null if it's invalid.
      return type && geoJSON && geoJSON.type.toLowerCase() === type.toLowerCase();
    },

    // WKT.parse(null) doesn't handle well. Default to empty string.
    wktValue: function() {
      return this.textValue() || '';
    },

    // This is the value we're sending up to the server.
    currentValue: function() {
      var wktValue = this.wktValue(),
          geoJSON = this.toGeoJSON(wktValue);

      // If GeoJSON is null, wktValue is invalid.
      // This is to keep it visible in the UI.
      return (this.isValid() && geoJSON) || wktValue;
    }
  };

  $.blistEditor.addEditor('point', wktEditor, 'text');
  $.blistEditor.addEditor('multipoint', wktEditor, 'text');
  $.blistEditor.addEditor('line', wktEditor, 'text');
  $.blistEditor.addEditor('multiline', wktEditor, 'text');
  $.blistEditor.addEditor('polygon', wktEditor, 'text');
  $.blistEditor.addEditor('multipolygon', wktEditor, 'text');

})(jQuery);

