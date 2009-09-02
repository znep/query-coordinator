(function($)
{
    // Convert the element into a javascript value
    var makeCombo = function(options)
    {
        var $this = $(this);
        var $dropdown;

        // Initialize for rendering
        var values = options.values;
        var renderFn = options.renderFn || function(value)
            { this.html(value.label || value); };
        var rowRenderFn = options.rowRenderFn || renderFn;

        // Get the default value
        var defaultValue = options.defaultValue;
        if (defaultValue === undefined)
        { defaultValue = null; }

        // Get the value and create an HTML element to house it
        var value = options.value;
        if (value == null)
        { value = defaultValue; }
        var $value = $('<div class="blist-combo-value"></div>');
        var $input = $('<input class="blist-combo-keyhandler" />');

        // This object handles value management for the element.  See values.js
        // for details on how this works
        var valueManager = {
            name: options.name,

            get: function()
            { return value; },

            set: function(val)
            {
                value = val;
                if (value == null)
                { value = defaultValue; }
                renderValue();
                $this.trigger('change');
            }
        };

        var valueLookup = {};
        $.each(values, function(i, v)
        {
            var val = v instanceof String ? v : v.label;
            if (val) { valueLookup[val.charAt(0)] = i; }
        });

        var getValueIndex = function()
        {
            var curVal = valueManager.get();
            var curI = -1;
            $.each(values, function(i, v)
                {
                    if (v.id == curVal || v == curVal)
                    {
                        curI = i;
                        return false;
                    }
                });
            return curI;
        };

        var setValueIndex = function(newI)
        {
            if (newI >= 0 && newI < values.length)
            {
                var newVal = values[newI];
                if (newVal !== undefined)
                { valueManager.set(newVal.id || newVal); }
            }
        };

        var dropdownOpen = false;
        var hideDropdown = function()
        {
            dropdownOpen = false;
            $dropdown.scrollTop(0);
            $dropdown.children('li.selected').removeClass('selected');
            $dropdown.slideUp(100);
        };

        var showDropdown = function()
        {
            // Create the drop-down
            if (!$dropdown)
            {
                $dropdown = $('<ul class="blist-combo-dd"></ul>');
                $this.closest(".blist-combo-wrapper").append($dropdown);
                for (var i = 0; i < values.length; i++)
                {
                    var $li = $('<li></li>');
                    $dropdown.append($li);
                    rowRenderFn.apply($li, [ values[i] ]);
                }
                $dropdown.click(onDropdownClick)
                    .mousemove(onDropdownMouseMove);
            }

            // Display the drop-down
            var pos = $this.position();
            var left = pos.left;
            var top = pos.top + $this.outerHeight() - 1;
            $dropdown.css('left', left);
            $dropdown.css('top', top);

            dropdownOpen = true;
            $dropdown.css({ width: ($this.outerWidth() - 2) + 'px' });
            $dropdown.slideDown(100);
        };

        // Handle clicks on the drop-down
        var onDropdownClick = function(event)
        {
            setValueIndex($dropdown.children('li')
                .index($(event.target).closest("li")));
            hideDropdown();
            $this.find(':input')[0].focus();
        };

        // Handles mousing over a list item
        var onDropdownMouseMove = function(event)
        {
            updateSelectedItem($dropdown.children('li')
                .index($(event.target).closest("li")));
        };

        // Handle clicks on the control (the part that's always visible)
        var onClick = function()
        {
            if (dropdownOpen) { hideDropdown(); }
            else { showDropdown(); }
            $this.find(':input')[0].focus();
        };

        var getSelectedValueObject = function(value)
        {
            var valueObj;
            if (value != null && value != '')
            {
                for (var i = 0; i < values.length && valueObj === undefined; i++)
                {
                    var id = values[i].id;
                    if (id === undefined)
                    { id = values[i]; }
                    if (id === value)
                    { valueObj = values[i]; }
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
            $value.removeClass().addClass("blist-combo-value");

            // Render empty values
            if (valueObj === undefined)
            {
                $this.addClass('blist-combo-empty');
                $value.html('&nbsp;');
                return;
            }

            // Render non-empty values
            $this.removeClass('blist-combo-empty');
            renderFn.apply($value, [ valueObj ]);
        };

        var onFocus = function(event)
        {
            $this.find(':input')[0].focus();
        };

        var updateSelectedItem = function(i)
        {
            $dropdown.children('li.selected').removeClass('selected');
            var $li = $dropdown.children('li').eq(i).addClass('selected');
            if ($li.length < 1) { return; }

            var ddST = $dropdown.scrollTop();
            var liT = $li.position().top + ddST;
            var liB = liT + $li.outerHeight();
            var ddH = $dropdown.outerHeight();
            if (liB > ddH + ddST)
            { $dropdown.scrollTop(liB - ddH); }
            else if (liT < ddST)
            { $dropdown.scrollTop(liT); }
        };

        var onKeyDown = function(event)
        {
            var i;
            if (dropdownOpen)
            {
                switch (event.keyCode)
                {
                    case 27: // ESC
                        event.stopPropagation();
                        hideDropdown();
                        break;
                    case 13: // Enter
                        event.stopPropagation();
                    case 32: // Space
                        setValueIndex($dropdown.children('li')
                                .index($dropdown.children('li.selected')));
                        hideDropdown();
                        break;
                    case 38: // Up arrow
                        var $sel = $dropdown.find('li.selected');
                        i = $dropdown.children('li').index($sel);
                        if (i < 0) { i = values.length; }
                        i--;
                        if (i >= 0) { updateSelectedItem(i); }
                        break;
                    case 40: // Down arrow
                        var $sel = $dropdown.find('li.selected');
                        i = $dropdown.children('li').index($sel) + 1;
                        if (i < values.length) { updateSelectedItem(i); }
                        break;
                    default:
                        // Handle just letters/numbers
                        if (event.keyCode >= 65 && event.keyCode <= 90 ||
                            event.keyCode >= 48 && event.keyCode <= 57)
                        {
                            updateSelectedItem(valueLookup[String.fromCharCode(
                                event.keyCode)]);
                        }
                        break;
                }
            }
            else
            {
                switch (event.keyCode)
                {
                    case 32: // Space
                        event.stopPropagation();
                        showDropdown();
                        break;
                    case 38: // Up arrow
                        i = getValueIndex();
                        if (i >= 0)
                        { setValueIndex(i - 1); }
                        break;
                    case 40: // Down arrow
                        setValueIndex(getValueIndex() + 1);
                        break;
                    default:
                        // Handle just letters/numbers
                        if (event.keyCode >= 65 && event.keyCode <= 90 ||
                            event.keyCode >= 48 && event.keyCode <= 57)
                        {
                            setValueIndex(valueLookup[String.fromCharCode(
                                event.keyCode)]);
                        }
                        break;
                }
            }
        };

        // Initialize the component
        $this
            .html($value)
            .addClass('blist-combo')
            .valueManager(valueManager)
            .click(onClick)
            .append($input)
            .focus(onFocus)
            .find(':input')
            .keydown(onKeyDown);
        renderValue();
        
        var comboValueObj = function()
        {
            this.selectedValueObject = function()
            {
                return getSelectedValueObject(value);
            };
        };
        $this.data('comboValueObj', new comboValueObj());
    };

    var blistComboDefaults = {
        name: undefined,    // Value name, or this.name or this.id
        renderFn: null,     // Value rendering function, or defaults to
                            // (value).label or (value)
        rowRenderFn: null,  // Row rendering function, or defaults to previous
                            // method
        values: [],         // List of values
        value: null,        // Current value
        defaultValue: null  // Value to use if the value is null; leave this as
                            // null to allow for blanks
    };

    $.fn.extend({
        /**
         * Make an element into a Blist Combo.
         */
        combo: function(options)
        {
            // Create the table
            return this.each(function()
            {
                if (!$(this).is('.blist-combo'))
                {
                    makeCombo.apply(this,
                        [ $.extend({}, blistComboDefaults, options) ]);
                }
            });
        },
        valueObjectAccessor: function()
        {
            return this.data('comboValueObj');
        }
    });
})(jQuery);
