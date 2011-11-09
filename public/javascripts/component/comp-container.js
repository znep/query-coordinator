/**
 * Base implementation for components that contain other components.
 */
(function($) {
    $.component.Component.extend('Container', {
        // A hint for drag implementation
        horizontal: false,

        _init: function(properties) {
            this._initializing = true;
            var children = properties.children;
            delete properties.children;
            this._super(properties);
            if (children) { this.add(children); }
            delete this._initializing;
        },

        /**
         * Add a child (or children) to the container.
         *
         * @param child the child to add as properties or Component derivative
         * @param position the node before which the child is added; default is end-of-list
         */
        add: function(child, position) {
            if ($.isArray(child)) {
                // Set flag to prevent layout as we recurse into arrays
                if (!this._blockArrange)
                    var arrange = this._blockArrange = true;

                // Add the children
                var result = _.map(child, function(child) {
                    return this.add(child, position);
                }, this);

                // Arrange if we're the owners of the arrange block
                if (arrange) {
                    this._blockArrange = false;
                    this._arrange();
                }

                return result;
            }

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
            if ((oldParent != this || oldNext != child.next) && this._initialized)
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
            if (!this._initialized) {
                if (child._initialized)
                    $(child.dom).remove();
                return;
            }
            if (!child._rendered)
                child._render();
            if ($.subKeyDefined(child, 'next.$dom') && child.next.$dom.parent().index(this.$ct) >= 0)
            { child.next.$dom.before(child.$dom); }
            else
            { this.$ct.append(child.$dom); }
            this._arrange();
        },

        /**
         * Remove child from DOM.
         */
        _removeChildDom: function(child) {
            if (!this._rendered)
                return;
            child.$dom.remove();
            this._arrange();
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
         * Collect children into an array.
         */
        children: function() {
            return this.map(function(child) { return child });
        },

        /**
         * Count the children in the container.
         */
        count: function() {
            var count = 0;
            this.each(function() {
                count++;
            });
            return count;
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
                delete child.parent;
                child.destroy();
            });
            this._super();
        },

        // Override render to render children as well
        _render: function() {
            this._super();

            this.$ct = this._getContainer();
            this.$ct.addClass('socrata-container');

            this.each(this._moveChildDom, this);

            this._arrange();
        },

        // Override to create separate container component
        _getContainer: function() {
            return this.$dom;
        },

        // Override Component._propRead to include children property
        _propRead: function() {
            var properties = this._super();
            var children = this._readChildren();
            if (children)
                properties.children = children;
            return properties;
        },

        // Extension point that retrieves the list of children for property extraction
        _readChildren: function() {
            var children;
            this.each(function(child) {
                (children || (children = [])).push(child.properties());
            });
            return children;
        },

        // Override Component._propWrite to update children (currently brute replace)
        _propWrite: function(properties) {
            this._super(properties);
            if (properties.children) {
                while (this.first)
                    this.first.destroy();
                this.add(properties.children);
            }
        },

        // Override to perform layout beyond simple DOM order
        _arrange: function() {
            this.each(function(child) {
                if (child._arrange)
                    child._arrange();
            });
            this._super();
        },

        // Propagate design mode to children
        design: function(designing) {
            this.each(function(child) {
                child.design(designing);
            });
        }
    });

    $.component.Container.extend('Horizontal Container', {
        // A hint for drag implementation
        horizontal: true,

        // Override rendering to add a (eww) clearing element
        _render: function() {
            this._super();

            var clear = this.dom.lastChild;
            if (!clear || clear.className != 'socrata-ct-clear') {
                $(this.dom).append('<div class="socrata-ct-clear"></div>');
                clear = this.dom.lastChild;
            }
            this._$clear = $(clear);
        },

        // Override child move to wrap child in extra div
        _moveChildDom: function(child) {
            if (!child._rendered)
                child._render();
            if (!child.wrapper) {
                child.wrapper = document.createElement('div');
                child.wrapper.className = 'component-wrapper';
                child.wrapper.appendChild(child.dom);
                child.$wrapper = $(child.wrapper);
            }
            if ($.subKeyDefined(child, 'next.$wrapper') &&
                    child.next.$wrapper.parent().index(this.$ct) >= 0)
            { child.next.$wrapper.before(child.$wrapper); }
            else if (!$.isBlank(this._$clear))
            { this._$clear.before(child.$wrapper); }
            else
            { this.$ct.append(child.$wrapper); }
            this._arrange();
        },

        // Override child remove to 1.) unwrap child, and 2.) update layout
        _removeChildDom: function(child) {
            if (child.wrapper) {
                child.$wrapper.remove();
                delete child.$wrapper;
            }
            this._arrange();
        },

        _arrange: function() {
            if (this._blockArrange)
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

            this._super();

            if (this.first) {
                $(this.dom).children('first-child').removeClass('first-child');
                $(this.first.wrapper).addClass('first-child');
            }
        }
    });

    $.extend($.component.Container, {
        /**
         * Wrap a child component in a container.  This is used to create space for new components when performing
         * layout into a space perpendicular to the parent container.
         */
        wrap: function(child, wrapperConfig) {
            var parent = child.parent;
            if (!parent)
                throw new Error("Cannot wrap unparented child");
            var position = child.next;

            parent._blockArrange = true;
            try {
                var wrapper = $.component.create(wrapperConfig);
                wrapper.add(child);
                parent.add(wrapper, position);
                parent._blockArrange = false;
                parent._arrange();
            } finally {
                parent._blockArrange = false;
            }

            return wrapper;
        },

        /**
         * The inverse of wrap -- replaces a child's container with the child.
         */
        unwrap: function(child) {
            if (child.prev || child.next)
                throw new Error("Cannot unwrap child with siblings");
            var wrapper = child.parent;
            if (!wrapper)
                throw new Error("Cannot unwrap unparented child");
            var parent = wrapper.parent;
            if (!wrapper)
                throw new Error("Cannot unwrap child with root parent");

            parent._blockArrange = true;
            try {
                parent.add(child, wrapper.next);
                wrapper.destroy();
                parent._blockArrange = false;
                parent._arrange();
            } finally {
                parent._blockArrange = false;
            }
        }
    })
})(jQuery);
