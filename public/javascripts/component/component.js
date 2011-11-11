/**
 * Base component implementation.
 */
(function($) {
    var nextAutoID = 1;

    var components = {};

    var Component = Model.extend({
        _init: function(properties) {
            var cObj = this;
            cObj._super.apply(this, arguments);
            cObj._eventKeys = {};
            cObj._properties = properties || {};
            cObj.id = cObj._properties.id;
            if (!cObj.id)
                cObj.id = $.component.allocateId();
            // If we're given an id in the form c\d+, then make sure our
            // automatically-generated IDs start later, so they don't overlap
            else if (cObj.id.charAt(0) == 'c') {
                var sequence = parseInt(cObj.id.substring(1));
                if (sequence >= nextAutoID)
                    nextAutoID = sequence + 1;
            }
            if (components[cObj.id])
                throw new Error("Duplicate component ID " + cObj.id);
            components[cObj.id] = cObj;
            if (_.isFunction(cObj._dataReady))
                cObj._updateDataSource(properties, cObj._dataReady);

            var assets = cObj._getAssets();
            if (!_.isEmpty(assets))
            {
                cObj._loadingAssets = true;
                cObj.startLoading();
                blist.util.assetLoading.loadAssets(assets, function()
                {
                    cObj.finishLoading();
                    delete cObj._loadingAssets;
                    if (cObj._needsRender) { _.defer(function () { cObj._render(); }); }
                });
            }
        },

        /**
         * Whether or not this component can be rendered
         */
        isValid: function()
        { return true; },

        startLoading: function()
        {
            if (!$.isBlank(this.$dom))
            {
                if (!this._lsInit)
                {
                    this.$dom.loadingSpinner({showInitially: true});
                    this._lsInit = true;
                }
                else { this.$dom.loadingSpinner().showHide(true); }
            }
            this._loading = true;
        },

        finishLoading: function()
        {
            if (!$.isBlank(this.$dom) && this._lsInit)
            { this.$dom.loadingSpinner().showHide(false); }
            this._loading = false;
            this._updateValidity();
        },

        destroy: function() {
            this.remove();
            delete components[this.id];
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
         * Put the component into design mode.
         */
        design: function(designing) {
        },

        /**
         * Set active editing state.
         */
        edit: function(editing) {
        },

        /**
         * Substitute insertion variables into a string.
         */
        _template: function(template) {
            return $.template(template, this._propertyResolver());
        },

        setEditor: function(editor)
        {
            this._propEditor = editor;
        },

        /**
         * Returns a set of configurations for editing the properties of this element
         */
        configurationSchema: function()
        {
            return null;
        },

        /**
         * Override registerEvent to keep track of field names per event
         */
        registerEvent: function(evHashes)
        {
            var cObj = this;
            if (!$.isPlainObject(evHashes))
            { throw new Error('registerEvent requires a hash of event names to array of field names'); }

            var evNames = [];
            _.each(evHashes, function(fields, name)
            {
                evNames.push(name);
                cObj._eventKeys[name] = $.makeArray(fields);
            });
            return cObj._super(evNames);
        },

        /**
         * Allow other components/configurator to inspect events & their keys
         */
        getEvents: function()
        { return this._eventKeys; },

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
            { dom = document.getElementById(this.id); }
            if (!dom)
            {
                dom = document.createElement('div');
                dom.id = this.id;
            }

            if ($.isBlank(this.dom))
            {
                this.dom = dom;
                this.$dom = $(dom);
                dom._comp = this;
                dom.className = 'socrata-component component-' + this.typeName + ' ' +
                    (this._properties.customClass || '') + ' ' + (this._properties.hidden ? 'hide' : '');
                if (this._needsOwnContext)
                {
                    this.$contents = $.tag({tagName: 'div', 'class': 'content-wrapper'});
                    this.$dom.append(this.$contents);
                }
                else
                { this.$contents = this.$dom; }
                if (this._loading) { this.startLoading(); }
                this._updateValidity();
            }

            // Special handling for root components
            if (!this.parent) {
                // Need to listen for general resize events
                var cObj = this;
                $(window).bind('resize', function(e, source)
                {
                    if (source == $.component) { return; }
                    cObj._arrange();
                });
            }

            this._initialized = true;
        },

        /**
         * Render the content for this component
         */
        _render: function()
        {
            this._initDom();
            if (this._loadingAssets || this._properties.hidden)
            {
                this._needsRender = true;
                return false;
            }

            if (typeof this._properties.height == 'number')
                this.$dom.css('height', this._properties.height);
            delete this._needsRender;
            this._rendered = true;
            return true;
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
            {
                var isDisabled = !this._loading && !this.isValid();
                if (isDisabled && !this._disInit)
                {
                    this.$dom.append($.tag([{tagName: 'div', 'class': 'disabledOverlay'},
                        {tagName: 'span', 'class': 'disabledIcon'},
                        {tagName: 'div', 'class': 'disabledMessage',
                            contents: 'This component does not have a valid configuration'}]));
                    this._disInit = true;
                }
                this.$dom.toggleClass('disabled', isDisabled);
            }
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
            return $.extend(true, {}, this._properties, { type: this.typeName, id: this.id });
        },

        /**
         * Set the component's properties.  Only properties for which a key is present are written.  Whether the
         * component dynamically applies the properties is implementation dependent.
         */
        _propWrite: function(properties) {
            var cObj = this;
            $.extend(true, cObj._properties, properties);

            if (!$.isBlank(cObj.$dom))
            {
                if (!cObj._properties.hidden && cObj.$dom.hasClass('hide'))
                {
                    cObj.$dom.removeClass('hide');
                    cObj.$contents.trigger('show');
                    if (cObj._needsRender) { cObj._render(); }
                }
                else if (cObj._properties.hidden && !cObj.$dom.hasClass('hide'))
                {
                    cObj.$dom.addClass('hide');
                    cObj.$contents.trigger('hide');
                }
            }

            _.defer(function() { cObj._updateValidity(); });
        },

        /**
         * Obtain a function that can resolve substitution properties for this component's data context.
         */
        _propertyResolver: function() {
            var parentResolver = this.parent ? this.parent._propertyResolver() : $.component.rootPropertyResolver;
            var entity = this._properties.entity;
            if (entity && !$.cf.designing)
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
            if (!$.isBlank(properties.contextId) &&
                    ($.isBlank(cObj._dataContext) || cObj._dataContext.id != properties.contextId))
            {
                if ($.dataContext.getContext(properties.contextId, function(dc)
                    {
                        cObj.finishLoading();
                        cObj._dataContext = dc;
                        if (!$.isBlank(cObj._propEditor))
                        { cObj._propEditor.setComponent(cObj); }
                        if (_.isFunction(callback)) { callback.apply(cObj); }
                    }))
                {
                    cObj.startLoading();
                    if (!$.isBlank(cObj._propEditor))
                    { cObj._propEditor.setComponent(null); }
                }
                return true;
            }
            else if ($.isBlank(properties.contextId) && $.isBlank(cObj._properties.contextId))
            { delete cObj._dataContext; }
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
        var result = Model.extend.call(this, prop);
        result.extend = Component.extend;
        if (name) {
            result.catalogName = result.prototype.catalogName = name;
            result.catalogCategory = result.prototype.catalogCategory = category;
            $.component.registerCatalogType(result);
        }
        return result;
    };

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
        },

        allocateId: function() {
            return 'c' + nextAutoID++;
        },

        eachRoot: function(fn, scope) {
            for (var i in components)
                if (!components[i].parent && components[i]._persist !== false)
                    fn.call(scope || this, components[i]);
        },

        eachFunctional: function(fn, scope) {
            for (var i in functionalComponents)
                fn.call(scope || this, functionalComponents[i]);
        }
    });

    // Set up the catalog registry here, since it is required for Component.extend to actually work
    var catalog = {};

    $.extend($.component, {
        registerCatalogType: function(type) {
            $.component[type.typeName = type.prototype.typeName = type.catalogName.camelize()] = type;
            if (type.catalogCategory) {
                var category = catalog[type.catalogCategory];
                if (!category)
                    category = catalog[type.catalogCategory] = { id: type.catalogCategory, name: type.catalogCategory.camelize(), entries: [] };
                category.entries.push(type);
            }
        },

        create: function(properties) {
            if (properties == undefined)
                throw "Component create without input properties";
            if (properties instanceof $.component.Component)
                return properties;
            if (typeof properties == "string") {
                var type = properties;
                properties = {};
            } else
                type = properties.type;
            if (type == undefined)
                throw "Component create without type property";
            var componentClass = $.component[properties.type.camelize()];
            if (!componentClass)
                throw "Invalid component type " + type;
            return new componentClass(properties);
        },

        initialize: function() {
            this.roots = [];
            for (var i = 0; i < arguments.length; i++)
                if ($.isArray(arguments[i]))
                    this.initialize.apply(this, arguments[i]);
                else {
                    var component = this.create(arguments[i]);
                    component._render();
                    if (!component.dom.parentNode)
                        throw "Unparented root component " + component.id;
                    this.roots.push(component);
                }
        },

        catalog: catalog
    });

    // Set up the base of FunctionalComponents so everything can use them
    var functionalComponents = {};

    Component.extend('FunctionalComponent', {
        _init: function()
        {
            this._super.apply(this, arguments);
            functionalComponents[this.id] = this;
            var cObj = this;
            // We don't have render, so call propWrite instead
            _.defer(function() { cObj.properties(cObj._properties); });
        },

        destroy: function()
        {
            this._super.apply(this, arguments);
            delete functionalComponents[this.id];
        },

        startLoading: function() {},
        finishLoading: function() {},
        remove: function() {},
        _initDom: function() {},
        _render: function() {},
        _arrange: function() {},
        _move: function() {}
    });

})(jQuery);
