(function($) {
  var numberValue = function(editObj) {
    var v = editObj.originalValue;
    var ret = v || '';
    if (v instanceof Object) {
      ret = v[editObj.type.subColumns.phone_number.name];
    }
    return ret || '';
  };

  var typeValue = function(editObj) {
    var v = editObj.originalValue;
    var ret = '';
    if (v instanceof Object) {
      ret = v[editObj.type.subColumns.phone_type.name];
    }
    return ret || '';
  };

  var renderTypeValue = function(value) {
    var $row = $(this);
    var $spanIcon = $('<span class="icon"></span>');
    var $spanLabel = $('<span class="label"></span>').html(value.label);
    $row.addClass(value.id).empty().append($spanIcon).append($spanLabel);
  };

  $.blistEditor.addEditor('phone', {
    editorAdded: function() {
      this._super.apply(this, arguments);

      var editObj = this;
      var typeValues = _.map(editObj.type.subColumns.phone_type.dropDownList.values,
        function(v) {
          return {
            id: v.id,
            label: v.description
          };
        });
      typeValues.unshift({
        id: 'null',
        label: '(Blank)'
      });
      editObj.setFullSize();
      editObj.$dom().addClass('combo-container');
      editObj.$editor().find('.type-combo').combo({
        ddClass: 'table-editor-combo',
        name: 'type-combo',
        values: typeValues,
        value: typeValue(editObj) || 'null',
        renderFn: renderTypeValue,
        adjustDropdownLayout: this.inContainer() ? function(layout) {
          // Move dropdown
          layout.top += 4;
          layout.left -= 2;
          layout.width += 4;
        } : null
      });
      editObj.$dom().find(':text.phoneNumber').keydown(function(e) {
        if (e.keyCode == 9 && !e.shiftKey) {
          e.stopPropagation();
        }
      });
      editObj.$dom().find('.type-combo').keydown(function(e) {
        if (e.keyCode == 9 && e.shiftKey) {
          e.stopPropagation();
        }
      });
    },

    $editor: function() {
      if (!this._$editor) {
        var value = $.htmlEscape(this.newValue || numberValue(this));
        this._$editor = $('<div class="blist-table-editor' +
          ' type-' + this.type.name + '">' +
          '<input type="text" class="phoneNumber" value="' +
          value + '" />' +
          '<div class="blist-combo-wrapper">' +
          '<div class="type-combo"></div></div></div>');
      }
      return this._$editor;
    },

    currentNumberValue: function() {
      var newNum = this.$editor().find(':text.phoneNumber').val();
      return newNum === '' || newNum === undefined ? null : newNum;
    },

    currentValue: function() {
      var newNum = this.currentNumberValue();

      var newType = this.$editor().find('.type-combo').value();
      newType = newType == 'null' || newType === undefined ?
        null : newType;
      if (newNum === null && newType === null) {
        return null;
      }

      var ret = {};
      ret[this.type.subColumns.phone_number.name] = newNum;
      ret[this.type.subColumns.phone_type.name] = newType;
      return ret;
    },

    setSize: function(width, height) {
      var $outer = this.$dom();
      var $sz = $(this.getSizeElement());
      var outerWidth = width + ($outer.width() - $sz.width());
      var outerHeight = height + ($outer.height() - $sz.height());

      $sz.css({
        width: width + 'px',
        height: height + 'px'
      });
      $outer.width(outerWidth).height(outerHeight);

      var $input = this.$dom().find(':text.phoneNumber');
      var padding = $input.innerHeight() - $input.height();
      $input.height(height - padding);
    },

    querySize: function() {
      return {
        width: 240
      };
    }
  });

})(jQuery);
