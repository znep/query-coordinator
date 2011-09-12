/**
 * Base component implementation.
 */
(function($) {
    var nextAutoID = 1;

    var components = {};

    var Component = Class.extend({
        _init: function(properties) {
            $.extend(this, properties);
            if (!this.id)
                this.id = 'c' + nextAutoID++;
            else if (this.id.charAt[0] == 'c') {
                var sequence = parseInt(this.id.substring(1));
                if (sequence > nextAutoID)
                    nextAutoID = sequence + 1;
            }
            this._render();
            components[this.id] = this;
        },

        destroy: function() {
            delete components[this.id];
            this.remove();
        },

        /**
         * Read or write properties.
         */
        properties: function(properties) {
            if (properties)
                this._propWrite(properties);
            return this._propRead();
        },

        /**
         * Remove the component from its parent.
         */
        remove: function() {
            if (this.dom)
                $(this.dom).remove();
            if (this.parent)
                this.parent._childRemoved(this);
        },

        /**
         * Initialize DOM representation of this component.
         */
        _render: function() {
            var dom = document.getElementById(this.id);
            if (!dom) {
                dom = document.createElement('div');
                dom.id = this.id;
            }
            this.dom = dom;
            dom._comp = this;
            dom.className = 'socrata-component component-' + this.typeName;
            this._rendered = true;
            if (typeof this.height == 'number')
                $(this.dom).css('height', this.height);
        },

        /**
         * Lifecycle management -- called when a component is added to a container or its position has moved within
         * its container.
         */
        _addedTo: function(parent) {
            if (this.parent == parent)
                return;
            if (this.parent)
                this.parent._childRemoved(this);
            this.parent = parent;
        },

        /**
         * Lifecycle management -- called when a component is removed from a container.
         */
        _removedFrom: function(parent) {
            if (this.parent == parent)
                delete this.parent;
        },

        /**
         * Obtain the component's current public properties.
         */
        _propRead: function() {
            return {
                id: this.id,
                type: this.typeName
            };
        },

        /**
         * Set the component's properties.  Only properties for which a key is present are written.  Whether the
         * component dynamically applies the properties is implementation dependent.
         */
        _propWrite: function(properties) {
        }
    });

    Component.extend = function() {
        var name, category, prop;
        if (arguments.length == 1)
            prop = arguments[0];
        else if (arguments.length == 2)
            name = arguments[0], prop = arguments[1];
        else if (arguments.length == 3)
            name = arguments[0], category = arguments[1], prop = arguments[2];
        var result = Class.extend.call(this, prop);
        result.extend = Component.extend;
        if (name) {
            result.catalogName = result.prototype.catalogName = name;
            result.catalogCategory = result.prototype.catalogCategory = category;
            $.component.registerCatalogType(result);
        }
        return result;
    }

    $.component = function(id) {
        if (typeof id == 'number')
            id = 'c' + id;
        var dom = document.getElementById(id);
        return dom && dom._comp;
    }

    $.extend($.component, {
        Component: Component,

        get: function(id) {
            return components[id];
        }
    });
})(jQuery);
