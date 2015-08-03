(function($) {

    var typeMapping = {
      'point': 'point',
      'multipoint': 'multipoint',
      'line': 'linestring',
      'multiline': 'multilinestring',
      'polygon': 'polygon',
      'multipolygon': 'multipolygon'
    };

    var wktEditor = {

      /**
       * @function toGeoJSON
       * @desc Converts Well-known Text into GeoJSON.
       * @param {String} wkt - A candidate WKT string.
       * @returns {Object|null} - Returns a GeoJSON object, or null if WKT cannot be converted.
       */
      toGeoJSON: function (wkt) {
        return WKT.parse(wkt);
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

