/**
 * Base component implementation.
 */
(function($) {
    var nextAutoID = 1;

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
        },

        destroy: function() {
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
         * Unlink a child from its parent.
         */
        remove: function() {
            var parent = this.parent;
            if (parent) {
                if (this.prev)
                    this.prev.next = this.next;
                if (this.next)
                    this.next.prev = this.prev;
                delete this.parent;
                parent._childRemoved(this, this.prev, this.next);
            }
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
        _move: function(parent, position) {
            // Confirm that position makes sense
            if (position && position.parent != parent)
                throw "Illegal position -- new following sibling is not parented by new parent";

            // Ignore identity moves
            if (position ? position == this || position == this.next : parent.last == this)
                return;

            var oldParent = this.parent;
            var oldPrev = this.prev;
            var oldNext = this.next;

            // Nothing to do if we're already in position
            if (oldParent == parent && oldNext == position)
                return;

            // Unlink from old position
            if (oldPrev)
                oldPrev.next = this.next;
            if (oldNext)
                oldNext.prev = this.prev;

            // Link into new position
            if (position)
                this.prev = position.prev;
            else {
                this.prev = parent.last;
                delete this.next;
            }
            if (this.prev)
                this.prev.next = this;
            this.next = position;
            if (position)
                position.prev = this;

            // Update parent
            if (oldParent != parent) {
                this.parent = parent;
                if (oldParent)
                    oldParent._childRemoved(this, oldPrev, oldNext);
            }
            this.parent._childMoved(this, oldParent, oldPrev, oldNext);
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

    // That extra five characters is annoying in Firebug
    $.comp = $.component;

    $.extend($.component, {
        Component: Component
    });
})(jQuery);
