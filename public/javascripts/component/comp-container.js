/**
 * Base implementation for components that contain other components.
 */
(function($) {
    $.component.Component.extend('Container', {
        /**
         * Add a child to the container.
         *
         * @param child the child to add as properties or Component derivative
         * @param position the node before which the child is added; default is end-of-list
         */
        add: function(child, position) {
            if (!(child instanceof $.component.Component))
                child = $.component.create(child);
            if (!child._rendered)
                child._render();

            var positionDom = position && position.dom;
            if (child._parent != this || child.dom.nextSibling != positionDom) {
                this.ct.insertBefore(child.dom, positionDom);
                child._addedTo(this);
            }
            return child;
        },

        /**
         * Apply a function to all children of this container.
         */
        each: function(fn, scope) {
            if (!this._rendered) {
                var children = this.children;
                if (children)
                    // Pre-rendered state
                    for (var i = 0; i < children.length; i++) {
                        // Lazy instantiation
                        if (!(children[i] instanceof $.component.Component))
                            children[i] = $.component.create(children[i]);
                        fn.call(scope || this, children[i]);
                    }
            } else {
                var child = this.ct.firstChild;
                while (child) {
                    if (child._comp)
                        fn.call(scope || this, child._comp);
                    child = child.nextSibling;
                }
            }
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

        /**
         * Callback invoked by children that are no longer parented by this container.
         */
        _childRemoved: function(child) {
            child._removedFrom(this);
        },

        // Override render to render children as well
        _render: function() {
            this._super();

            if (!this.ct)
                this.ct = this.dom;
            $(this.ct).addClass('socrata-container');

            var children = this.children;
            if (children) {
                for (var i = 0; i < children.length; i++)
                    this.add(children[i]);
                delete this.children;
            }
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
})(jQuery);
