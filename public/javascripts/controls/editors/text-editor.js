(function($) {
  $.blistEditor.addEditor('text', {
    editorAdded: function() {
      this._super.apply(this, arguments);
      this.textValidationHookup();
    },

    $editor: function() {
      if (!this._$editor) {
        var value = $.htmlEscape(this.newValue ||
          this.originalTextValue());
        var align = this.format.align ?
          ' align-' + this.format.align : '';
        this._$editor = $('<div class="blist-table-editor' +
          ' type-' + this.type.name +
          '"><input type="text" class="' + align + '" value="' +
          value + '" /></div>');
      }
      return this._$editor;
    },

    getSizeElement: function() {
      return this.$editor()[0].childNodes[0];
    },

    originalTextValue: function() {
      this.flattenValue();
      return this.originalValue || '';
    },

    textValidationHookup: function() {
      var editObj = this;
      editObj.$dom().find(':input').keypress(function() {
        setTimeout(function() {
          editObj.textModified();
        }, 0);
      });
    },

    querySize: function() {
      // Compute visual width of text
      var width = ((this.originalValue || '') + '').visualLength(this.$editor().css('font-size'));

      // Adjust width for cursor slop
      // XXX - I don't know why this is nessary.  On FF w/out this the cursor disappears at the end of the
      // line.  Maybe only necessary on FF?
      width += 2;

      return {
        width: width
      };
    },

    textValue: function() {
      var newVal = this.$editor().find(':text').val();
      return newVal === '' ? null : newVal;
    },

    currentValue: function() {
      return this.textValue();
    },

    textModified: function() {
      if (this.isValid()) {
        this.$dom().removeClass('invalid');
      } else {
        this.$dom().addClass('invalid');
      }
    }
  });

})(jQuery);
