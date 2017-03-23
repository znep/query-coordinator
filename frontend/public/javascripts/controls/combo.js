(function($) {
  // Convert the element into a javascript value
  var makeCombo = function(options) {
    var $this = $(this);
    var $dropdown;
    var $scrollBindings;

    // Initialize for rendering
    var values = options.values;
    $this.data('keyName', options.keyName);
    var renderFn = options.renderFn || function(_value) {
      this.html(_value.label || _value);
    };
    var rowRenderFn = options.rowRenderFn || renderFn;

    // Get the default value
    var defaultValue = options.defaultValue;
    if (defaultValue === undefined) {
      defaultValue = null;
    }

    // Get the value and create an HTML element to house it
    var value = options.value;
    if (value == null) {
      value = defaultValue;
    }
    var $value = $('<div class="blist-combo-value clearfix"></div>');
    var $valueText;
    var $input = $('<input class="hiddenTextField" />');

    if (options.allowFreeEdit) {
      $valueText = $('<input type="text" class="blist-combo-text hide"/>');
      $valueText.attr('name', $(this).attr('id') + '_freeText');
    }

    // This object handles value management for the element.  See values.js
    // for details on how this works
    var valueManager = {
      name: options.name,

      get: function() {
        if (options.allowFreeEdit && $this.data('freeEditOn')) {
          var $textEl = $this.find('.blist-combo-text');
          return $textEl.val();
        } else {
          return value;
        }
      },

      set: function(val) {
        value = val;
        if (value == null) {
          value = defaultValue;
        }
        renderValue();
        $this.trigger('change');
      }
    };

    var valueLookup = {};
    $.each(values, function(i, v) {
      var val = v instanceof String ? v : v[options.keyAccProp];
      if (val) {
        var c = val.charAt(0).toLowerCase();
        if (valueLookup[c] === undefined) {
          valueLookup[c] = [];
        }
        valueLookup[c].push(i);
      }
    });

    var getValueIndex = function() {
      var curVal = valueManager.get();
      var curI = -1;
      $.each(values, function(i, v) {
        if (v[$this.data('keyName')] == curVal || v == curVal) {
          curI = i;
          return false;
        }
      });
      return curI;
    };

    var setValueIndex = function(newI) {
      if (newI >= 0 && newI < values.length) {
        var newVal = values[newI];
        if (newVal !== undefined) {
          valueManager.set(newVal[$this.data('keyName')] || newVal);
        }
      }
    };

    var dropdownOpen = false;
    var hideDropdown = function() {
      dropdownOpen = false;
      $dropdown.scrollTop(0);
      $dropdown.children('li.selected').removeClass('selected');
      $dropdown.slideUp(100);
      $dropdown.remove();
      $dropdown = undefined;

      $this.closest('.blist-combo-wrapper').removeClass('active');
      $(document).unbind('.combo');
      if ($scrollBindings !== undefined) {
        $scrollBindings.unbind('scroll.combo');
      }
    };

    var showDropdown = function() {
      // Create the drop-down
      if (!$dropdown) {
        $dropdown = $('<ul class="blist-combo-dd ' + options.ddClass + '"></ul>');
        $('body').append($dropdown);
        for (var i = 0; i < values.length; i++) {
          var $li = $('<li></li>');
          $dropdown.append($li);
          rowRenderFn.apply($li, [values[i]]);
        }
        $dropdown.click(onDropdownClick).
          mousedown(onDropdownMouseDown).
          mouseover(onDropdownMouseMove).
          mousemove(onDropdownMouseMove);
      }

      positionDropdown();
      dropdownOpen = true;
      $dropdown.slideDown(100, function() {
        sizeDropdownHeight();
      });

      $this.closest('.blist-combo-wrapper').addClass('active');

      // Register for cancel clicks outside the dropdown
      $(document).bind('mousedown.combo', function(event) {
        var $target = $(event.target);
        if ($target.parents().index($this.closest('.blist-combo-wrapper')) < 0) {
          // they clicked outside the control; collapse.
          hideDropdown();
          var $inputs = $this.find(':input.hiddenTextField');
          if ($inputs.length > 0) {
            $inputs[0].focus();
          }
        }
      });

      $scrollBindings = $this.parents().add(window);
      $scrollBindings.bind('scroll.combo', function() {
        positionDropdown();
        sizeDropdownHeight();
      });
    };

    var positionDropdown = function() {
      // Compute the dropdown position
      var pos = $this.offset();
      var layout = {
        left: pos.left,
        top: pos.top + $this.offsetParent().outerHeight(true),
        width: $this.outerWidth() - 2
      };
      if (options.adjustDropdownLayout)
        options.adjustDropdownLayout(layout);

      // Display the drop-down
      $dropdown.css('left', layout.left);
      $dropdown.css('top', layout.top);
      $dropdown.css('width', layout.width);
    };

    var sizeDropdownHeight = function() {
      // Protect against race conditions
      if ($dropdown === null || $dropdown === undefined) {
        return;
      }

      var ddTop = $dropdown.offset().top;
      var ddBottom = $dropdown.height() + ddTop;
      var $win = $(window);
      var winHeight = $win.height() + $win.scrollTop();
      if (ddBottom > winHeight) {
        $dropdown.css('max-height', Math.max(0, winHeight - ddTop));
      } else {
        $dropdown.css('max-height', '');
      }
    };

    // Handle clicks on the drop-down
    var onDropdownClick = function(event) {
      setValueIndex($dropdown.children('li').index($(event.target).closest('li')));
      hideDropdown();
      $this.find(':input.hiddenTextField')[0].focus();
    };

    var onDropdownMouseDown = function(event) {
      event.stopPropagation();
    };

    // Handles mousing over a list item
    var onDropdownMouseMove = function(event) {
      if ($.contains($dropdown[0], event.target)) {
        updateSelectedItem($dropdown.children('li').index($(event.target).closest('li')));
      }
    };

    // Handle clicks on the control (the part that's always visible)
    var onClick = function() {
      if (dropdownOpen) {
        hideDropdown();
      } else {
        showDropdown();
      }

      $this.find(':input.hiddenTextField')[0].focus();
      fixCombo();
    };

    var onDblClick = function(event) {
      toggleComboText(event);
    };

    var getSelectedValueObject = function() {
      var valueObj;
      if (value != null && value != '') {
        for (var i = 0; i < values.length && valueObj === undefined; i++) {
          var id = values[i][$this.data('keyName')];
          if (id === undefined) {
            id = values[i];
          }
          if (id === value) {
            valueObj = values[i];
          }
        }
      }

      return valueObj;
    };

    // Render the current value (in the variable "value") into the value
    // container (in the variable "$value")
    var renderValue = function() {
      // Locate the object associated with the value

      var valueObj = getSelectedValueObject(value);

      // Reset all classes on the value.
      $value.removeClass().addClass('blist-combo-value');

      // Render empty values
      if (valueObj === undefined) {
        if (!options.allowFreeEdit) {
          $this.addClass('blist-combo-empty');
          $value.html('&nbsp;');
          return;
        } else {
          $this.find('.blist-combo-text').val(value);
          if ($this.closest('#gridSidebar').length <= 0 && !$this.data('freeEditOn')) {
            $this.removeClass('blist-combo-empty');
            $this.find('.blist-combo-text').val(value);
            $this.find('.blist-combo-value').text(value);
          } else {
            $this.addClass('blist-combo-empty');
            $value.html('&nbsp;');
          }
          return;
        }
      }

      // Render non-empty values
      $this.removeClass('blist-combo-empty');
      renderFn.apply($value, [valueObj]);
    };

    var onFocus = function() {
      $this.find(':input.hiddenTextField')[0].focus();
    };

    var updateSelectedItem = function(i) {
      $dropdown.children('li.selected').removeClass('selected');
      var $li = $dropdown.children('li').eq(i).addClass('selected');
      if ($li.length < 1) {
        return;
      }

      var ddST = $dropdown.scrollTop();
      var liT = $li.position().top + ddST;
      var liB = liT + $li.outerHeight();
      var ddH = $dropdown.outerHeight();
      if (liB > ddH + ddST) {
        $dropdown.scrollTop(liB - ddH);
      } else if (liT < ddST) {
        $dropdown.scrollTop(liT);
      }
    };

    var getNextCharItem = function(c, curI) {
      var l = valueLookup[c.toLowerCase()];
      if (l === undefined) {
        return -1;
      }

      var newI = l[0];
      $.each(l, function(j, i) {
        if (i > curI) {
          newI = i;
          return false;
        }
      });

      return newI;
    };

    var onKeyDown = function(event) {
      var i;
      var $sel;
      if (dropdownOpen) {
        switch (event.keyCode) {
          case 27: // ESC
            event.stopPropagation();
            hideDropdown();
            break;
          case 13: // Enter
          case 32: // Space
            event.stopPropagation();
            setValueIndex($dropdown.children('li').index($dropdown.children('li.selected')));
            hideDropdown();
            break;
          case 38: // Up arrow
            event.preventDefault();
            $sel = $dropdown.find('li.selected');
            i = $dropdown.children('li').index($sel);
            if (i < 0) {
              i = values.length;
            }
            i--;
            if (i >= 0) {
              updateSelectedItem(i);
            }
            break;
          case 40: // Down arrow
            event.preventDefault();
            $sel = $dropdown.find('li.selected');
            i = $dropdown.children('li').index($sel) + 1;
            if (i < values.length) {
              updateSelectedItem(i);
            }
            break;
          default:
            // Handle just letters/numbers
            if (event.keyCode >= 65 && event.keyCode <= 90 ||
              event.keyCode >= 48 && event.keyCode <= 57) {
              $sel = $dropdown.find('li.selected');
              i = $dropdown.children('li').index($sel);
              updateSelectedItem(getNextCharItem(
                String.fromCharCode(event.keyCode), i));
            }
            break;
        }
      } else if (!$this.data('freeEditOn')) {

        switch (event.keyCode) {
          case 32: // Space
            if ($this.data('freeEditOn')) {
              break;
            }
            event.stopPropagation();
            showDropdown();
            break;
          case 38: // Up arrow
            event.preventDefault();
            i = getValueIndex();
            if (i >= 0) {
              setValueIndex(i - 1);
            }
            break;
          case 40: // Down arrow
            event.preventDefault();
            setValueIndex(getValueIndex() + 1);
            break;
          default:
            // Handle just letters/numbers
            if (event.keyCode >= 65 && event.keyCode <= 90 || event.keyCode >= 48 && event.keyCode <= 57) {
              setValueIndex(getNextCharItem(String.fromCharCode(event.keyCode), getValueIndex()));
            }
            break;
        }
      }
    };

    var fieldFocus = function() {
      $this.addClass('blist-combo-focused');
    };

    var fieldBlur = function() {
      $this.removeClass('blist-combo-focused');
    };

    var textBlur = function() {
      var $textEl = $this.find('.blist-combo-text');
      valueManager.set($textEl.val());
    };

    /**
     * Sidebar create and destroy editor is causing combobox problem in
     * free edit mode.  Some inner contents were lost.
     * This function fixes the problem and is only needed when the object
     * lives inside gridSidebar.
     */
    var fixCombo = function() {
      if (!options.allowFreeEdit || $this.closest('#gridSidebar').length <= 0) {
        return;
      }
      if ($this.data('freeEditOn') == true) {
        return;
      }
      var $valEl = $this.find('.blist-combo-value');
      if ($valEl.find('span').length <= 0) {
        $valEl.html('<SPAN class="icon-filler"></SPAN><SPAN class="label">(Blank)</SPAN>');
      }

      if ($.browser.msie) {
        $this.removeAttr('style');
      } else {
        $this.css('backgroundPosition', '');
      }
    };

    var toggleComboText = function() {
      var $valEl = $this.find('.blist-combo-value');
      var $textEl = $this.find('.blist-combo-text');

      var $toggleComboText = $this.parent().find('.toggleComboText');

      if ($valEl.is(':visible')) {
        // show text hide combo
        $this.data('comboValueCopy', $this.value());
        $this.data('freeEditOn', true);
        $this.unbind('click');
        // css class affects dimension calculation so it is done before
        // calculating width and height.
        $this.removeClass('blist-combo');
        if ($this.closest('#gridSidebar').length <= 0) {
          $textEl.width($textEl.parent().outerWidth() - ($textEl.outerWidth() - $textEl.width()));
          $textEl.height($textEl.parent().outerHeight() - ($textEl.outerHeight() - $textEl.height()));
        }

        $textEl.unbind('blur', textBlur);
        $textEl.blur(textBlur);
        $textEl.removeClass('hide');
        if ($this.data('comboValueCopy') != 'null') {
          $textEl.val($this.data('comboValueCopy'));
        }

        $textEl.show();
        $valEl.hide();
        $this.css('backgroundPosition', '-100px');
        $toggleComboText.find('a').text('List');
        // show free text edit validation error if it exists
        $this.find('label.error').show();
        $textEl.focus();
      } else {
        // show combo hide text
        $this.value($this.data('comboValueCopy'));
        $this.data('freeEditOn', false);
        $this.addClass('blist-combo');
        $textEl.hide();
        $valEl.show();
        // setting background to null works in FF but not IE, Chrome
        if ($this.closest('#gridSidebar').length <= 0) {
          $this.css('backgroundPosition', 'right center');
        }

        $this.click(onClick);
        $toggleComboText.find('a').text('Custom');
        // hide free text edit validation error if it exists
        $this.find('label.error').hide();
      }

      if (dropdownOpen) {
        hideDropdown();
      }

      // fix issue when used inside sidebar
      fixCombo();
    };

    // Initialize the component
    $this.html($value);

    if (options.allowFreeEdit) {
      $this.append($valueText);
    }

    $this.addClass('blist-combo').
      valueManager(valueManager).
      click(onClick).
      append($input).
      focus(onFocus).
      find(':input.hiddenTextField').
      keydown(onKeyDown).
      focus(fieldFocus).
      blur(fieldBlur);

    var $toggle;
    if (options.allowFreeEdit) {
      if (options.freeEditButton) {
        $toggle = $('<ul class="actionButtons toggleComboText" style="position:absolute;top:0px;right:-9em;"><li><a style="cursor:pointer;width:5em;text-align:center;">Custom</a></li></ul>');
        $toggle.find('a').click(toggleComboText);
        $this.parent().append($toggle);
      } else {
        $this.dblclick(onDblClick);
      }
    }

    renderValue();

    var ComboValueObj = function() {
      this.selectedValueObject = function() {
        return getSelectedValueObject(value);
      };
    };
    $this.data('comboValueObj', new ComboValueObj());
  };

  var blistComboDefaults = {
    ddClass: '',
    name: undefined, // Value name, or this.name or this.id
    renderFn: null, // Value rendering function, or defaults to
    // (value).label or (value)
    rowRenderFn: null, // Row rendering function, or defaults to previous
    // method
    values: [], // List of values
    value: null, // Current value
    keyName: 'id', // the property name where value will return
    keyAccProp: 'label', // key accelerator property
    allowFreeEdit: false,
    freeEditButton: false, // whether to use trailing button or double click to toggle free edit and selction mode.
    defaultValue: null // Value to use if the value is null; leave this as
      // null to allow for blanks
  };

  $.fn.extend({
    /**
     * Make an element into a Blist Combo.
     */
    combo: function(options) {
      // Create the table
      return this.each(function() {
        if (!$(this).is('.blist-combo')) {
          makeCombo.apply(this, [$.extend({}, blistComboDefaults, options)]);
        }
      });
    },
    valueObjectAccessor: function() {
      return this.data('comboValueObj');
    }
  });
})(jQuery);
