(function($) {
    // Convert the element into a javascript value
    var makeCombo = function(options) {
        var $this = $(this);
        var $dropdown;
        
        // Initialize for rendering
        var values = options.values;
        var renderFn = options.renderFn || function(value) {
            this.html(value.label || value);
        }
        var rowRenderFn = options.rowRenderFn || renderFn;

        // Get the default value
        var defaultValue = options.defaultValue;
        if (defaultValue === undefined)
            defaultValue = null;

        // Get the value and create an HTML element to house it
        var value = options.value;
        if (value == null)
            value = defaultValue;
        var $value = $('<div class="blist-combo-value"></div>');

        // This object handles value management for the element.  See values.js for details on how this works
        var valueManager = {
            name: options.name,

            get: function() {
                return value;
            },

            set: function(val) {
                value = val;
                if (value == null)
                    value = defaultValue;
                renderValue();
                $this.trigger('change');
            }
        }

        // Handle clicks on the drop-down
        var onDropdownClick = function(event) {
            var newValue = values[$dropdown.children().index($(event.target).closest("li"))];
            if (newValue !== undefined)
                valueManager.set(newValue.id || newValue);

            $dropdown.slideUp(100);
        }

        // Handle clicks on the control (the part that's always visible)
        var onClick = function() {
            // Create the drop-down
            if (!$dropdown) {
                $dropdown = $('<ul class="blist-combo-dd"></ul>');
                $this.closest(".blist-combo-wrapper").append($dropdown);
                for (var i = 0; i < values.length; i++) {
                    var $li = $('<li></li>');
                    $dropdown.append($li);
                    rowRenderFn.apply($li, [ values[i] ]);
                }
                $dropdown.click(onDropdownClick);
            }

            // Display the drop-down
            var pos = $this.position();
            var left = pos.left;
            var top = pos.top + $this.outerHeight() - 1;
            
            $dropdown.css({ width: ($this.outerWidth() - 2) + 'px' });
            $dropdown.slideDown(100);
        }

        // Render the current value (in the variable "value") into the value container (in the variable "$value")
        var renderValue = function() {
            // Locate the object associated with the value
            var valueObj;
            if (value != null && value != '')
                for (var i = 0; i < values.length && valueObj === undefined; i++) {
                    var id = values[i].id;
                    if (id === undefined)
                        id = values[i];
                    if (id === value)
                        valueObj = values[i];
                }
            
            // Reset all classes on the value.
            $value.removeClass().addClass("blist-combo-value");
            
            // Render empty values
            if (valueObj === undefined) {
                $this.addClass('blist-combo-empty');
                $value.html('');
                return;
            }

            // Render non-empty values
            $this.removeClass('blist-combo-empty');
            renderFn.apply($value, [ valueObj ]);
        }

        // Initialize the component
        $this
            .html($value)
            .addClass('blist-combo')
            .valueManager(valueManager)
            .click(onClick);
        renderValue();
    }

    var blistComboDefaults = {
        name: undefined,    // Value name, or this.name or this.id
        renderFn: null,     // Value rendering function, or defaults to (value).label or (value)
        rowRenderFn: null,  // Row rendering function, or defaults to previous method
        values: [],         // List of values
        value: null,        // Current value
        defaultValue: null  // Value to use if the value is null; leave this as null to allow for blanks
    };
    
    $.fn.extend({
        /**
         * Make an element into a Blist Combo.
         */
        combo: function(options) {
            // Create the table
            return this.each(function() {
                if (!$(this).is('.blist-combo'))
                    makeCombo.apply(this, [ $.extend({}, blistComboDefaults, options) ]);
            });
        }
    });
})(jQuery);
