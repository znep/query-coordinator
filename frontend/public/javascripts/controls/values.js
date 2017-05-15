(function($) {
  $.fn.extend({
    /**
     * Set the value manager associated with an element.  The value() and values() function interact with the
     * value manager to get or set the element's value.
     */
    valueManager: function(valueManager) {
      if (valueManager === undefined) {
        return this.data('value-manager');
      }
      this.data('value-manager', valueManager);
      return this;
    },

    /**
     * Access the name of the value provided by this element.  If a value manager is present, it is first given
     * the option of providing the name.  If this fails, the element's name or ID are used.
     */
    name: function() {
      var name;
      var valueManager = this.data('value-manager');
      if (valueManager && valueManager.name) {
        name = (typeof valueManager.name == 'function' ? valueManager.name() : valueManager.name);
      }
      if (name == null) {
        name = this.attr('name') || this.attr('id');
      }
      return name || undefined;
    },

    /**
     * Get or set the element's value.  If a value manager is present, the call is fielded by the manager.
     * Otherwise returns a value from the underlying HTML element if available.
     */
    value: function(value) {
      // Handle value get
      if (value === undefined) {
        var returnValue = value;

        this.each(function() {
          var $this = $(this);
          var valueManager = $this.data('value-manager');
          if (value === undefined) {
            if (valueManager && valueManager.get) {
              returnValue = valueManager.get(value);
            } else if (this.tagName == 'TEXTAREA') {
              returnValue = $this.val();
              if (returnValue === '') {
                // Convert empty textarea elements to a "null" value
                returnValue = null;
              }
            } else if (this.tagName == 'INPUT' || this.tagName == 'SELECT') {
              if ($this.attr('type') == 'checkbox' ||
                $this.attr('type') == 'radio') {
                returnValue = $this.attr('checked') ? true : false;
              } else {
                returnValue = this.value;
                if (returnValue === '') {
                  // Convert empty form elements to a "null" value
                  returnValue = null;
                }
              }
            }
            if (returnValue !== undefined) {
              // Found a value
              return false;
            }
          }
        });

        return returnValue;
      }

      // Handle value set
      this.each(function() {
        var $this = $(this);
        var valueManager = $this.data('value-manager');
        if (valueManager && valueManager.set) {
          valueManager.set(value);
        } else if (this.tagName == 'TEXTAREA') {
          $this.val(value == null ? '' : value);
        } else if (this.tagName == 'INPUT' || this.tagName == 'SELECT') {
          if ($this.attr('type') == 'checkbox' ||
            $this.attr('type') == 'radio') {
            $this.attr('checked', value ? true : false);
          } else {
            this.value = value == null ? '' : value;
          }
        }
      });

      return this;
    },

    /**
     * Get or set values from a tree of values.
     */
    values: function(values, get) {
      // Ensure values are present and default to get mode if the user didn't specify a mode
      if (values === undefined) {
        values = {};
        if (get == undefined) {
          get = true;
        }
      }

      // Apply to each child
      this.each(function() {
        // Determine if this node has a value; if not, no need to proceed
        var hasValue = false;
        var $this = $(this);
        if ($this.data('value-manager')) {
          // Element manages values explicitly
          hasValue = true;
        } else switch (this.tagName) {
          case 'INPUT':
          case 'SELECT':
          case 'TEXTAREA':
            // Uses built-in jQuery form value support
            hasValue = true;
            break;
        }

        // If the element provides a value, get or set the value
        if (hasValue) {
          var name = $this.name();
          if (name) {
            if (get) {
              values[name] = $this.value();
            } else {
              $this.value(values[name]);
            }
          }
        }
      });

      // Recurse
      var $children = $(this).children();
      if ($children.length) {
        $children.values(values, get);
      }
      return values;
    },

    // TODO
    valuesRead: function() {},

    // TODO
    valuesWrite: function() {}
  });
})(jQuery);
