/**
 * Base implementation for components that contain other components.
 */
(function($) {
    $.component.Component.extend('Container', {
        _init: function(properties) {
            var children = properties.children;
            if (children) {
                delete properties.children;
                this.add(children);
            }
            this._super(properties);
        },

        /**
         * Add a child (or children) to the container.
         *
         * @param child the child to add as properties or Component derivative
         * @param position the node before which the child is added; default is end-of-list
         */
        add: function(child, position) {
            if ($.isArray(child))
                return _.map(child, function(child) {
                    return this.add(child, position);
                }, this);

            if (!(child instanceof $.component.Component))
                child = $.component.create(child);

            child._move(this, position);

            return child;
        },

        /**
         * Callback invoked by children that are newly parented by this container or moved within the container.
         */
        _childMoved: function(child, oldParent, oldPrev, oldNext) {
            // Record keeping -- update first & last
            if (!this.first)
                this.first = this.last = child;
            else {
                if (this.first == child) {
                    if (child.prev)
                        this.first = oldNext;
                } else if (!child.prev)
                    this.first = child;

                if (this.last == child) {
                    if (child.next)
                        this.last = oldPrev;
                } else if (!child.next)
                    this.last = child;
            }

            // Synchronize DOM
            if ((oldParent != this || oldNext != child.next) && this._rendered)
                this._moveChildDom(child);
        },

        /**
         * Callback invoked by children that are no longer parented by this container.
         */
        _childRemoved: function(child, oldPrev, oldNext) {
            // Record keeping -- update first & last
            if (this.first == child)
                this.first = oldNext;
            if (this.last == child)
                this.last = oldPrev;

            // Synchronize DOM
            this._removeChildDom(child);
        },

        /**
         * Synchronize child's position in the DOM.  Allows derivative containers to adjust position.
         */
        _moveChildDom: function(child) {
            if (!child._rendered)
                child._render();
            this.ct.insertBefore(child.dom, child.next && child.next.dom);
        },

        /**
         * Remove child from DOM.
         */
        _removeChildDom: function(child) {
            this.ct.removeChild(child.dom);
        },

        /**
         * Apply a function to all children of this container.  Iteration terminates when the first child returns
         * something other than undefined and that value is returned.
         */
        each: function(fn, scope) {
            var child = this.first;
            while (child) {
                var result = fn.call(scope || this, child);
                if (result !== undefined)
                    return result;
                child = child.next;
            }
        },

        /**
         * Map all children of this container based on the result of a function.
         */
        map: function(fn, scope) {
            var result = [];
            this.each(function(child) {
                result.push(fn.call(scope, child));
            });
            return result;
        },

        /**
         * Recursively apply a function to all descendants of this container.
         */
        visit: function(fn, scope) {
            this.each(function(child) {
                fn.call(this, child);
                if (child.visit)
                    child.visit(fn, scope);
            }, scope);
        },

        // Override destroy to propagate to children
        destroy: function() {
            this.each(function(child) {
                child.destroy();
            });
            this._super();
        },

        // Override render to render children as well
        _render: function() {
            this._super();

            this.ct = this._getContainer();
            $(this.ct).addClass('socrata-container');

            this.each(this._moveChildDom, this);
        },

        // Override to create separate container component
        _getContainer: function() {
            return this.dom;
        },

        // Override Component._propRead to include children property
        _propRead: function() {
            var properties = this._super();
            var children;
            if (this._rendered)
                // Rendered state
                this.each(function(child) {
                    (children || (children = [])).push(child.properties());
                });
            else if (this.children) {
                // Pre-render state with children.  Ask instantiated components for properties, otherwise treat as raw
                // property bag.  Note that we don't use each() because we don't want to trigger instantiation
                children = this.children.slice();
                for (var i = 0; i < children.length; children++)
                    if (children[i] instanceof $.component.Component)
                        children[i] = children[i].properties();
            }
            if (children)
                properties.children = children;
            return properties;
        }
    });

    $.component.Container.extend('HorizontalContainer', {
        // A hint for drag implementation
        horizontal: true,

        _render: function() {
            this._super();
            this._arrange();
        },

        add: function(child, position) {
            // Set flag to prevent layout as we recurse into arrays
            if (!this._adding)
                var arrange = this._adding = true;

            // Perform the actual add
            this._super(child, position);

            // Position children
            if (arrange) {
                this._adding = false;
                this._arrange();
            }
        },

        // Override child move to 1.) wrap child in extra div, and 2.) update layout
        _moveChildDom: function(child) {
            if (!child._rendered)
                child._render();
            if (!child.wrapper) {
                child.wrapper = document.createElement('div');
                child.wrapper.className = 'component-wrapper';
                child.wrapper.appendChild(child.dom);
            }
            this.ct.insertBefore(child.wrapper, child.next && child.next.wrapper);
            this._arrange();
        },

        // Override child remove to 1.) unwrap child, and 2.) update layout
        _removeChildDom: function(child) {
            if (child.wrapper) {
                this.ct.removeChild(child.wrapper);
                delete child.wrapper;
            }
            this._arrange();
        },

        _arrange: function() {
            if (this._adding)
                return;
            var totalWeight = 0;
            this.each(function(child) {
                totalWeight += child.weight || 1;
            });
            var pos = 0;
            this.each(function(child) {
                var weight = child.weight || 1;
                $(child.wrapper).css({
                    marginLeft: -(100 - pos / totalWeight * 100) + '%',
                    width: (weight / totalWeight * 100) + '%'
                });
                pos += weight;
            });
        }
    });
})(jQuery);
