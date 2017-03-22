(function($) {
  $.blistEditor.addEditor('checkbox', {
    editorAdded: function() {
      this._super.apply(this, arguments);

      var editObj = this;
      editObj.$dom().
        click(function() {
          editObj.focus();
        }).
        find(':input').
        mousedown(function(e) {
          e.stopPropagation();
        }).
        mouseup(function(e) {
          e.stopPropagation();
        }).
        keydown(function(e) {
          if (e.keyCode == 32) {
            e.stopPropagation();
          }
        }).
        keypress(function(e) {
          if (e.keyCode == 32) {
            e.stopPropagation();
          }
        }).
        click(function() {
          editObj.changed();
        });
    },

    $editor: function() {
      if (!this._$editor) {
        this.flattenValue();
        var align = this.format.align ?
          ' align-' + this.format.align : '';
        this._$editor = $('<div class="blist-table-editor ' +
          'type-' + this.type.name + align + '">' +
          '<input type="checkbox"' +
          (this.originalValue === true ? ' checked="checked"' : '') +
          ' /></div>');
      }
      return this._$editor;
    },

    isValid: function() {
      var curVal = this.currentValue();
      return _.isBoolean(curVal) || _.isNull(curVal);
    },

    currentValue: function() {
      var val = this.$editor().find(':checkbox').value();
      // Kind of a hack; we need to keep original invalid values,
      // so we assume that if the box is not checked and they had an
      // invalid value, keep it; but if they had a boolean before, then
      // they must have unchecked it
      if (val === false) {
        return _.isBoolean(this.originalValue) ? null : this.originalValue;
      }
      return val;
    },

    focus: function() {
      this.$dom().find(':checkbox').focus();
    }
  });

})(jQuery);
