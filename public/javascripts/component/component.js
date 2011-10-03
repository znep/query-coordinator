/**
 * Base component implementation.
 */
(function($) {
    var nextAutoID = 1;

    var components = {};

    var Component = Class.extend({
        _init: function(properties) {
            var cObj = this;
            cObj._properties = properties || {};
            if (!cObj._properties.id)
                cObj._properties.id = 'c' + nextAutoID++;
            else if (cObj._properties.id.charAt[0] == 'c') {
                var sequence = parseInt(cObj._properties.id.substring(1));
                if (sequence > nextAutoID)
                    nextAutoID = sequence + 1;
            }
            if (components[cObj._properties.id])
                throw new Error("Duplicate component ID " + cObj._properties.id);
            components[cObj._properties.id] = cObj;
            if (_.isFunction(cObj._dataReady))
                cObj._updateDataSource(properties, cObj._dataReady);
            cObj.startLoading();
            blist.util.assetLoading.loadAssets(cObj._getAssets(), function()
            {
                cObj.finishLoading();
                _.defer(function() { cObj._render(); });
            });

            // Need to listen for general resize events if we are the top component
            $(window).bind('resize', function(e, source)
            {
                if (source == $.component) { return; }
                if ($.isBlank(cObj.parent)) { cObj._arrange(); }
            });
        },

        /**
         * Whether or not this component can be rendered
         */
        isValid: function()
        { return true; },

        startLoading: function()
        {
            if (!$.isBlank(this.$dom))
            { this.$dom.loadingSpinner().showHide(true); }
            this._loading = true;
        },

        finishLoading: function()
        {
            if (!$.isBlank(this.$dom))
            { this.$dom.loadingSpinner().showHide(false); }
            this._loading = false;
            this._updateValidity();
        },

        destroy: function() {
            this.remove();
            delete components[this._properties.id];
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
                var prev = this.prev;
                var next = this.next;
                delete this.parent;
                delete this.prev;
                delete this.next;
                parent._childRemoved(this, prev, next);
            }
        },

        /**
         * Substitute insertion variables into a string.
         */
        _template: function(template) {
            return $.template(template, this._propertyResolver());
        },

        /**
         * Returns a set of configurations for editing the properties of this element
         */
        configurationSchema: function()
        {
            return null;
        },

        configurationSchema: function()
        {
            return null;
        },

        /**
         * Javascript and CSS that needs to be loaded to render the component
         */
        _getAssets: function()
        { return null; },

        /**
         * Initialize DOM representation of this component.
         */
        _initDom: function()
        {
            var dom = this.dom;
            if (!dom)
            { dom = document.getElementById(this._properties.id); }
            if (!dom)
            {
                dom = document.createElement('div');
                dom.id = this._properties.id;
            }
            if ($.isBlank(this.dom))
            {
                this.dom = dom;
                this.$dom = $(dom);
                dom._comp = this;
                dom.className = 'socrata-component component-' + this.typeName;
                this.$contents = $.tag({tagName: 'div', 'class': 'content-wrapper'});
                this.$dom.append(this.$contents);
                this.$dom.loadingSpinner({showInitially: this._loading});
                this.$dom.append($.tag([{tagName: 'div', 'class': 'disabledOverlay'},
                    {tagName: 'div', 'class': 'disabledMessage',
                        contents: 'This component does not have a valid configuration'}]));
                this._updateValidity();
            }
            this._initialized = true;
        },

        /**
         * Render the content for this component
         */
        _render: function() {
            this._initDom();
            if (typeof this._properties.height == 'number')
                this.$dom.css('height', this._properties.height);
            this._rendered = true;
        },

        /**
         * Called when this component is resized, moved, added, etc. so it can update
         */
        _arrange: function()
        {
            if (!$.isBlank(this.$dom))
            { this.$dom.trigger('resize', [$.component]); }
        },

        /**
         * Checks whether to hide or show the invalid overlay
         */
        _updateValidity: function()
        {
            if (!$.isBlank(this.$dom))
            { this.$dom.toggleClass('disabled', !this._loading && !this.isValid()); }
        },

        /**
         * Lifecycle management -- called when a component is added to a container or its position has moved within
         * its container.
         */
        _move: function(parent, position) {
            // Confirm that position makes sense
            if (position && position.parent != parent)
                throw new Error("Illegal position -- new following sibling is not parented by new parent");

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
            return $.extend(true, {}, this._properties, { type: this.typeName });
        },

        /**
         * Set the component's properties.  Only properties for which a key is present are written.  Whether the
         * component dynamically applies the properties is implementation dependent.
         */
        _propWrite: function(properties) {
            var cObj = this;
            $.extend(true, cObj._properties, properties);
            _.defer(function() { cObj._updateValidity(); });
        },

        /**
         * Obtain a function that can resolve substitution properties for this component's data context.
         */
        _propertyResolver: function() {
            var parentResolver = this.parent ? this.parent._propertyResolver() : $.component.rootPropertyResolver;
            var entity = this.entity;
            if (entity)
                return function(name) {
                    var result = entity[name];
                    if (result !== undefined)
                        return result;
                    return parentResolver(name);
                };
            return parentResolver;
        },

        /**
         * Helper when updating the data source on a component. Not called automatically
         * since not all components have a data source.
         */
        _updateDataSource: function(properties, callback)
        {
            var cObj = this;
            if (!$.isBlank(properties.viewId) &&
                    ($.isBlank(cObj._view) || cObj._view.id != properties.viewId))
            {
                cObj.startLoading();
                if (!$.isBlank(cObj._propEditor))
                { cObj._propEditor.setComponent(null); }
                $.dataContext.getContext(properties.viewId, function(view)
                {
                    cObj.finishLoading();
                    cObj._view = view;
                    if (!$.isBlank(cObj._propEditor))
                    { cObj._propEditor.setComponent(cObj); }
                    if (_.isFunction(callback)) { callback.apply(cObj); }
                });
                return true;
            }
            return false;
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
        return components[id];
    }

    // That extra five characters is annoying in Firebug
    $.comp = $.component;

    $.extend($.component, {
        Component: Component,

        rootPropertyResolver: function(name) {
            // TODO - page property pool?
        }
    });
})(jQuery);
