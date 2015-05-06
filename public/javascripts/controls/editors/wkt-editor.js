(function($)
{
    var wktEditor = {

      // This is the editable version of value.
      flattenValue: function() {
        if ($.isPlainObject(this.originalValue)) {
          this.originalValue = WKT.stringify(this.originalValue);
        }
      },

      isValid: function() {
        // WKT.parse returns null if it's invalid.
        return !!WKT.parse(this.wktValue());
      },

      // WKT.parse(null) doesn't handle well. Default to empty string.
      wktValue: function() {
        return this.textValue() || '';
      },

      // This is the value we're sending up to the server.
      currentValue: function() {
        var wktValue = this.wktValue(),
            parsedWKT = WKT.parse(wktValue);

        // If parsedWKT is null, wktValue is invalid.
        // This is to keep it visible in the UI.
        return parsedWKT || wktValue;
      }
    };

    $.blistEditor.addEditor('point', wktEditor, 'text');
    // $.blistEditor.addEditor('line', wktEditor, 'text');
    // $.blistEditor.addEditor('polygon', wktEditor, 'text');

})(jQuery);

