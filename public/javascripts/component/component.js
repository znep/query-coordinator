/**
 * Base component implementation.
 */
(function($) {
    var nextAutoID = 1;
    var primarySet = '__primary';

    var componentSets = {};
    componentSets[primarySet] = {};

    var roots = {};

    var winSpin = $('body').loadingSpinner({ metric: 'dataslate-global' });
    var wsCounter = 0;
    function startGlobalLoading()
    {
        if (wsCounter < 1)
        { winSpin.showHide(true); }
        wsCounter++;
    };
    function finishGlobalLoading()
    {
        wsCounter--;
        if (wsCounter < 1)
        { winSpin.showHide(false); }
    };

    var Component = Model.extend({
        _init: function(properties, componentSet)
        {
            var cObj = this;
            cObj._super.apply(this, arguments);
            cObj._eventKeys = {};
            cObj.registerEvent({ 'start_loading': [], 'finish_loading': [], 'update_properties': [],
                'shown': [], 'hidden': [] });

            cObj._visibility = true;
            cObj._componentSet = componentSet || primarySet;
            cObj._updateProperties(properties);
            cObj.id = cObj._properties.id;
            if (!cObj.id)
            { cObj.id = $.component.allocateId(); }
            // If we're given an id in the form c\d+, then make sure our
            // automatically-generated IDs start later, so they don't overlap
            else if (cObj.id.charAt(0) == 'c')
            {
                var sequence = parseInt(cObj.id.substring(1));
                if (sequence >= nextAutoID)
                { nextAutoID = sequence + 1; }
            }
            if (componentSets[cObj._componentSet][cObj.id])
            { throw new Error("Duplicate component ID in " + cObj._componentSet + ': ' + cObj.id); }
            componentSets[cObj._componentSet][cObj.id] = cObj;
            cObj._isDirty = true;

            if (_.isFunction(cObj._dataReady))
            { _.defer(function() { cObj._updateDataSource(properties, cObj._dataReady); }); }

            var assets = cObj._getAssets();
            if (!_.isEmpty(assets))
            {
                cObj._loadingAssets = true;
                cObj.startLoading();
                blist.util.assetLoading.loadAssets(assets, function()
                {
                    cObj.finishLoading();
                    delete cObj._loadingAssets;
                    cObj._assetsAvailable();
                    if (cObj._needsRender) { _.defer(function () { cObj._render(); }); }
                    if (cObj._needsEdit) { _.defer(function () { cObj.edit(true); }); }
                }, function() { cObj._stylesLoaded() });
            }

            // Allow configuring static properties via dynamic code
            if (cObj._properties.setup)
            {
                _(cObj._properties.setup).each(function(definitions, key)
                {
                    var props = {};
                    _(definitions).each(function(template, propName)
                    {
                        template.type || (template.type = 'StringResolver');
                        var resolver = $.component.create(template, cObj._componentSet);
                        props[propName] = resolver.asString();
                    });
                    cObj[key](props);
                });
                delete properties.setup;
            }

            _.defer(function() { $.component.globalNotifier.trigger('component_added', [cObj]); });
        },

        /**
         * Whether or not this component can be rendered
         */
        isValid: function()
        { return true; },

        startLoading: function()
        {
            if (!this._loadingSuspended && !$.isBlank(this.$dom))
            {
                if (!this._lsInit)
                {
                    this.$dom.loadingSpinner({ metric: 'dataslate-component', showInitially: true, minimal: true });
                    this._lsInit = true;
                }
                else { this.$dom.loadingSpinner().showHide(true); }
            }
            if (this._loading) { return; }
            this._loading = true;
            this.trigger('start_loading');
            startGlobalLoading();
        },

        finishLoading: function()
        {
            if (!$.isBlank(this.$dom) && this._lsInit)
            { this.$dom.loadingSpinner().showHide(false); }
            if (!this._loading) { return; }
            this._loading = false;
            this.trigger('finish_loading');
            finishGlobalLoading();
            this._updateValidity();
        },

        suspendLoading: function(doSuspend)
        {
            this._loadingSuspended = doSuspend;
            if (!this._loading) { return; }
            if (!$.isBlank(this.$dom))
            {
                if (this._lsInit)
                { this.$dom.loadingSpinner().showHide(!doSuspend); }
                else if (!doSuspend)
                {
                    this.$dom.loadingSpinner({metric: 'dataslate-component', showInitially: true});
                    this._lsInit = true;
                }
            }
        },

        destroy: function()
        {
            this.remove();
            if (!$.isBlank(this.$dom)) { this.$dom.remove(); }
            delete componentSets[this._componentSet][this.id];
            this._destroyed = true;
            var cObj = this;
            _.defer(function() { $.component.globalNotifier.trigger('component_removed', [cObj]); });
        },

        /**
         * Read or write properties.
         */
        properties: function(properties)
        {
            if (properties)
            { this._propWrite(properties); }
            return this._propRead();
        },

        /**
         * Unlink a child from its parent.
         */
        remove: function() {
            $(window).unbind('scroll.component-' + this.id);
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
        design: function(designing)
        {
            this._designing = designing;
            this.properties({'__hidden': false});
            if ($.isBlank(this.$dom)) { return; }

            if (designing && this.canEdit('drag') && !this.$dom.isControlClass('nativeDraggable'))
            {
                this.$dom.nativeDraggable({
                    dropId: this.id,
                    dropType: 'move',
                    startDisabled: true
                });
            }

            if (!designing && this.$dom.isControlClass('nativeDraggable'))
            { this.$dom.nativeDraggable().disable(); }
        },

        dragFocus: function(isFocus)
        {
            if (!this.$dom.isControlClass('nativeDraggable')) { return; }

            if (isFocus)
            { this.$dom.nativeDraggable().enable(); }
            else
            { this.$dom.nativeDraggable().disable(); }
        },

        select: function(selected)
        {
            var cObj = this;
            cObj._selected = selected;

            cObj._updateSelectedIcons();

            cObj.$dom.toggleClass('cf-selected', cObj._selected);
            if (cObj.canEdit('resize'))
            {
                if (selected)
                {
                    if (!cObj.$dom.hasClass('ui-resizable'))
                    {
                        cObj.$dom.resizable({
                            handles: 's',
                            start: _.bind(cObj._onUiResizableResizeStart, cObj),
                            stop: _.bind(cObj._onUiResizableResizeStop, cObj),
                            zIndex: 3001
                        });
                        // This unhides children, so fix them up
                        cObj.$dom.find('.socrata-component .ui-resizable-handle').hide();
                    }
                    else
                    { cObj.$dom.children('.ui-resizable-handle').show(); }
                }
                else if (cObj.$dom.hasClass('ui-resizable'))
                { cObj.$dom.children('.ui-resizable-handle').hide(); }
            }
        },

        /**
         * Set active editing state.
         */
        edit: function(editing)
        {
            var cObj = this;

            if (editing == (cObj._editing || false))
            { return false; }

            if (editing && !cObj._disableEditCapture && !cObj._boundEditEvent)
            {
                cObj.$contents.click(function(e)
                    { if (cObj._editing || cObj._needsEdit) { e.preventDefault(); } });
                cObj._boundEditEvent = true;
            }

            if (cObj._loadingAssets || cObj._loadingEditAssets)
            {
                cObj._needsEdit = true;
                return false;
            }

            if (editing && !cObj._loadedEditAssets)
            {
                cObj._loadedEditAssets = true;
                var assets = cObj._getEditAssets();
                if (!_.isEmpty(assets))
                {
                    cObj._loadingEditAssets = true;
                    cObj._needsEdit = true;
                    cObj.startLoading();
                    blist.util.assetLoading.loadAssets(assets, function()
                    {
                        cObj.finishLoading();
                        delete cObj._loadingEditAssets;
                        if (cObj._needsEdit)
                        {
                            _.defer(function ()
                            {
                                cObj.edit(true);
                                if (cObj._isActiveEdit)
                                { $.cf.side.enableProperties(true); }
                            });
                        }
                    });
                    return false;
                }
            }

            delete cObj._needsEdit;
            cObj._editing = editing;

            if (cObj._supportsCustomEditors() && cObj._properties.editor)
            {
                if (editing) {
                    cObj._prepareCustomEdit();
                    cObj.$customEditContents = $.tag({
                        tagName: 'div', 'class': 'socrata-component-edit'
                    });
                    cObj.$contents.append(cObj.$customEditContents);

                    // todo: get value other than asString
                    var props = $.extend(true, {}, cObj._properties.editor, {
                        value: cObj.asString(),
                        type: blist.datatypes[cObj._properties.editor.dataType]
                    });
                    cObj._customEditor = cObj.$customEditContents
                        .blistEditor(props);
                }
                else {
                    cObj._customEditor.finishEdit();
                    cObj._customEditFinished(cObj._customEditor);
                    cObj.$customEditContents.remove();
                }
                // todo: do we always want to bail here?
                return false;
            }
            return true;
        },

        isEditing: function()
        { return this._editing; },

        canEdit: function(type)
        {
            if (this._locked || this._properties.locked ||
                    (!$.isBlank(this.parent) && !this.parent.canEdit('locked')))
            { return false; }

            switch (type)
            {
                case 'resize':
                    return !$.isBlank(this.parent);
                    break;
                case 'drag':
                case 'drop':
                case 'locked':
                    return true;
                    break;
                default:
                    return !this._editDisabled && !this._properties.editDisabled;
                    break;
            }
        },

        /**
         * Component received or lost focus in edit mode.
         * Usually used to update properties
         */
        editFocus: function(focused)
        {
            if (focused == (this._focused || false))
            { return false; }

            this._focused = focused;
            if (focused)
            { return true; }

            // Update properties from custom editor
            if (this._supportsCustomEditors() && this._properties.editor) {
                this._updatePrimaryValue(this._customEditor.currentValue());
                return false;
            }
            return true;
        },

        hide: function()
        { this.setVisibility(false); },

        show: function()
        { this.setVisibility(true); },

        setVisibility: function(isVisible)
        {
            this._visibility = isVisible;
            this._propWrite({});
        },

        /**
         * Called when we know styles have been loaded. This is not accurate in IE
         */
        _stylesLoaded: function()
        {
            // Implement me
        },

        _updatePrimaryValue: function(value)
        {
            var propKey = this._valueKey(),
                properties = {};
            if ($.isBlank(propKey) || this._properties[propKey] == value) { return; }

            properties[propKey] = value;
            this._executePropertyUpdate(properties);
        },

        _executePropertyUpdate: function(properties)
        {
            $.cf.edit.execute('properties', {
                component: this,
                properties: properties
            });
        },

        /**
         * Called before a custom editor takes over
         */
        _prepareCustomEdit: function() {
            this.$contents.empty();
        },

        _updateSelectedIcons: function()
        {
            var cObj = this;

            if ($.isBlank(cObj._$editIcon))
            {
                cObj._$editIcon = $.tag2({ _: 'a', className: ['actionIcon', 'editIcon', 'ss-write'],
                    href: '#', title: 'Edit this component' });
                cObj.$dom.append(cObj._$editIcon);
                cObj._$editIcon.click(function(e)
                {
                    e.preventDefault();
                    $.cf.focus(cObj);
                });
            }
            cObj.$dom.toggleClass('editActive', !$.isBlank(cObj.parent) && cObj._selected);

            if ($.isBlank(cObj._$removeIcon))
            {
                cObj._$removeIcon = $.tag2({ _: 'a', className: ['actionIcon', 'removeIcon', 'ss-delete'],
                    href: '#', title: $.t('dataslate.component.remove') });
                cObj.$dom.append(cObj._$removeIcon);
                cObj._$removeIcon.click(function(e)
                {
                    e.preventDefault();
                    $.cf.blur(true);
                    $.cf.edit.execute('remove', {
                        component: cObj,
                        container: cObj.parent,
                        position: cObj.next
                    });
                });
            }
            cObj.$dom.toggleClass('removeActive', !$.isBlank(cObj.parent) && cObj._selected);
        },

        /**
         * Substitute insertion variables into a string.
         */
        _stringSubstitute: function(obj, resolver)
        {
            return $.stringSubstitute(obj, resolver || this._propertyResolver(), this._substitutionHelpers());
        },

        _evalIf: function(ifValue)
        {
            var cObj = this;
            return _.all($.makeArray(ifValue), function(v)
            {
                var r = !$.isBlank(cObj._stringSubstitute('{' + (v.key || v) + ' ||}'));
                if (v.negate) { r = !r; }
                return r;
            });
        },

        /**
         * Indicate what key in the component's properties holds the 'value'
         * Used for setting the initial value based on string resolving
         */
        _valueKey: function() {
        },

        setActiveEdit: function(isActive)
        {
            this._isActiveEdit = isActive;
        },

        /**
         * Returns a set of configurations for editing the properties of this element
         */
        configurationSchema: function()
        {
            if (this._loadingAssets || this._loadingEditAssets)
            { return false; }
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

        _assetsAvailable: function()
        { },

        /**
         * Javascript and CSS that needs to be loaded to edit the component
         */
        _getEditAssets: function()
        { return null; },

        /**
         * Initialize DOM representation of this component.
         */
        _initDom: function()
        {
            var domId = (this._componentSet == primarySet ? '' : this._componentSet + '_') + this.id;
            var $dom = this.$dom;
            if ($.isBlank($dom))
            { $dom = $('#' + domId); }
            if ($dom.length < 1)
            { $dom = $.tag({ tagName: 'div', id: domId }); }

            if ($.isBlank(this.$dom))
            {
                this.$dom = $dom;
                this.dom = $dom[0];
                this.dom._comp = this;
                this.$dom.addClass('socrata-component component-' + this.typeName + ' ' +
                    (this._properties.customClass || '') + ' ' +
                    (this._isHidden ? 'hide' : ''));
                if (this._needsOwnContext)
                {
                    this.$contents = this.$dom.children('.content-wrapper');
                    if (this.$contents.length < 1)
                    {
                        this.$contents = $.tag({tagName: 'div', 'class': 'content-wrapper'});
                        this.$dom.append(this.$contents);
                    }
                }
                else
                { this.$contents = this.$dom; }
                if (!$.isBlank(this._properties.htmlClass))
                { this.$contents.addClass($.makeArray(this._properties.htmlClass).join(' ')); }
                if (this._loading) { this.startLoading(); }
                this._updateValidity();

                if (this._delayUntilVisible)
                {
                    var cObj = this;
                    // Defer so that the DOM has a chance to be added before waypoints tries to
                    // find the parent context
                    _.defer(function()
                    {
                        var sp = cObj.$dom.scrollParent()[0];
                        cObj.$dom.waypoint({delayRefresh: true, offset: '100%', checkTop: true,
                            context: sp.nodeType == 9 ? window : sp, // if got document, use window
                            handler: function()
                            {
                                if (!cObj.$dom.parent().exists()) return;

                                delete cObj._delayUntilVisible;
                                cObj.$dom.waypoint('destroy');
                                if (!cObj._destroyed && cObj._needsRender)
                                { cObj._render(); }
                            }
                        });
                    });
                }
            }

            // Special handling for root components
            if (!this.parent && !this._resizeBound) {
                // Need to listen for general resize events
                var cObj = this;
                $(window).bind('resize', function(e, source)
                {
                    if (source == $.component) { return; }
                    cObj._arrange();
                });
                this._resizeBound = true;
            }
            else if (!this._resizeBound)
            {
                // A resize directly on the contents means we've already handled everything that
                // matters; so stop it from going up to the window and causing cascading reflows
                this.$contents.resize(function(e) { e.stopPropagation(); });
                this._resizeBound = true;
            }

            this._initialized = true;
        },

        /**
         * Whether the component should be included in the dom tree
         */
        _isRenderable: function()
        {
            return true;
        },

        /**
         * Whether the component can use blist editors
         */
        _supportsCustomEditors: function()
        { return false; },

        /* Processes a numerical property.
         * propName      -  the property name in _properties.
         * onValidValue  -  Function or value, used when the specified property is
         *                  defined and is a number. If a function, it is invoked with
         *                  the parsed numerical value and the property name,
         *                  and the return value is in turn returned from this function.
         *                  If a value, it is returned verbatim. If undefined, the
         *                  parsed value is returned.
         * onInvalidValue-  Function or value, used when the specified property is
         *                  either undefined or is not a number. If a function, it is invoked with
         *                  the original value (possibly undefined) and the property name,
         *                  and the return value is in turn returned from this function.
         *                  If a value, it is returned verbatim. If undefined, null
         *                  is returned.
         */
        _getNumericalProperty: function(propName, onValidValue, onInvalidValue)
        {
            var value = this._properties[propName];
            var parsed = parseInt(value);
            return _.isNaN(parsed) ?
                (_.isFunction(onInvalidValue) ?
                    onInvalidValue(value, propName) :
                        (_.isUndefined(onInvalidValue) ? null : onInvalidValue)) :
                (_.isFunction(onValidValue) ?
                    onValidValue(parsed, propName) :
                        (_.isUndefined(onValidValue) ? parsed : onValidValue));
        },

        // Alias to _getNumericalProperty(propName, undefined, onInvalidValue)
        _getNumericalPropertyWithFallback: function (propName, onInvalidValue)
        {
            this._getNumericalProperty(propName, undefined, onInvalidValue);
        },

        // Called when someone starts resizing us via the resize handle.
        _onUiResizableResizeStart: function()
        {
            // Nada
        },

        // Called when someone stops resizing us via the resize handle.
        _onUiResizableResizeStop: function()
        {
            this._executePropertyUpdate({ height: this.$dom.height() });
        },

        _applyHeightProperties: function()
        {
            var cObj = this;
            var applyFunc = function(value, propName)
            {
                cObj.$dom.css(propName, value);
            }
            var unApplyFunc = function(value, propName)
            {
                applyFunc('', propName);
            }

            this._getNumericalProperty('height', applyFunc, unApplyFunc);
            this._getNumericalProperty('minHeight', applyFunc, unApplyFunc);
            this._getNumericalProperty('maxHeight', applyFunc, unApplyFunc);
        },

        /**
         * Render the content for this component
         */
        _render: function()
        {
            var cObj = this;
            if (!this._isRenderable() || !this._isDirty) { return false; }
            this._initDom();
            if (this.$dom.hasClass('serverRendered'))
            {
                this.$dom.removeClass('serverRendered');
                if (!this._designing && !this._properties.requiresContext)
                {
                    this._rendered = true;
                    this._isDirty = false;
                    delete this._needsRender;
                    return false;
                }
            }

            this._applyHeightProperties();

            if (this._loadingAssets || this._isHidden || this._delayUntilVisible)
            {
                this._needsRender = true;
                return false;
            }
            // HACK: forceContext is for allowing a page developer to force loading of a context
            // to work around string substitute not resolving. It is meant to be a temporary fix
            // until something better and automatic can be put in.
            if (cObj._properties.forceContext && $.isBlank(cObj._dataContext))
            {
                cObj._needsRender = true;
                if (cObj._updateDataSource(cObj._properties, function() { cObj._render(); }))
                { return false; }
            }

            if (cObj._properties.requiresContext || cObj._properties.ifValue ||
                    !$.isBlank(cObj._properties.htmlClass) || !_.isEmpty(cObj._properties.htmlAttributes) ||
                    !_.isEmpty(cObj._properties.styles) || !_.isEmpty(cObj._properties.styleDimensions))
            {
                var finishedDCGet = function()
                {
                    if (!cObj._designing &&
                            (cObj._properties.requiresContext && _.isEmpty(cObj._dataContext) ||
                             cObj._properties.ifValue && !cObj._evalIf(cObj._properties.ifValue)))
                    { cObj.properties({'__hidden': true}); }

                    var comp = $.makeArray(cObj._properties.htmlClass).join(' ');
                    cObj.$contents.removeClass(comp);
                    cObj.$contents.addClass(cObj._stringSubstitute(comp));

                    var custComp = $.makeArray(cObj._properties.customClass).join(' ');
                    cObj.$dom.removeClass(custComp);
                    cObj.$dom.addClass(cObj._stringSubstitute(custComp));

                    cObj.$dom.css(blist.configs.styles.convertProperties(
                                cObj._stringSubstitute(cObj._properties)));

                    _.each(cObj._stringSubstitute(cObj._properties.htmlAttributes), function(attr)
                    {
                        if (!_.include(['class', 'id', 'style'], attr.key))
                        { cObj.$dom.attr(attr.key, attr.value); }
                    });
                };
                if (!cObj._updateDataSource(cObj._properties, finishedDCGet))
                { finishedDCGet(); }
            }

            delete this._needsRender;
            this._rendered = true;
            this._isDirty = false;
            $.component.sizeRenderRefresh();
            this._updateValidity();
            return true;
        },

        /**
         * Called when this component is resized, moved, added, etc. so it can update
         */
        _arrange: function()
        {
            this._isDirty = true;
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
                        {tagName: 'div', 'class': ['disabledMessage', 'badConfig'],
                            contents: $.t('dataslate.component.invalid_config') },
                        {tagName: 'div', 'class': ['disabledMessage', 'notReady'],
                            contents: $.t('dataslate.component.loading') }]));
                    this._disInit = true;
                }
                this.$dom.toggleClass('disabled', isDisabled);
                this.$dom.toggleClass('notRendered', !this._rendered);
            }
        },

        _shown: function()
        {
            // Called when component is shown after being hidden
            this.trigger('shown');
        },

        _hidden: function()
        {
            // Called when component is hidden after being shown
            this.trigger('hidden');
        },

        /**
         * Lifecycle management -- called when a component is added to a container or its position has moved within
         * its container.
         */
        _move: function(parent, position)
        {
            // Base container doesn't support by index
            if (_.isNumber(position))
            { position = null; }

            // Confirm that position makes sense
            if (position && position.parent != parent)
            { throw new Error("Illegal position -- new following sibling is not parented by new parent"); }

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
         * This is not a deep extend (which is a bit more expensive), so the
         * results should be used only for reference
         */
        _propRead: function() {
            return $.extend({}, this._properties, { type: this.typeName, id: this.id });
        },

        /**
         * Set the component's properties.  Only properties for which a key is present are written.  Whether the
         * component dynamically applies the properties is implementation dependent.
         */
        _propWrite: function(properties)
        {
            var cObj = this;
            cObj._updateProperties(properties);
            cObj._isDirty = true;
            cObj.trigger('update_properties');

            if (!$.isBlank(cObj.$dom))
            {
                cObj.$dom.removeClass('serverRendered');
                if (!cObj._isHidden && cObj.$dom.hasClass('hide'))
                {
                    cObj.$dom.removeClass('hide');
                    cObj._shown();
                    if (cObj._needsRender) { cObj._render(); }
                }
                else if (cObj._isHidden && !cObj.$dom.hasClass('hide'))
                {
                    cObj.$dom.addClass('hide');
                    cObj._hidden();
                }
                cObj._applyHeightProperties();
            }

            _.defer(function() { cObj._updateValidity(); });
        },

        _updateProperties: function(properties)
        {
            this._properties = this._properties || {};
            this._privateProperties = this._privateProperties || {};
            var privProps = {};
            _.each(_.keys(properties || {}), function(k)
            {
                if (k.startsWith('__'))
                {
                    privProps[k.slice(2)] = properties[k];
                    delete properties[k];
                }
            });
            $.extend(true, this._properties, properties);
            $.extend(true, this._privateProperties, privProps);
            this._isHidden = (!this._visibility ||
                    this._properties.hidden || this._privateProperties.hidden) &&
                !this._designing && !this._editing;
        },

        /**
         * Obtain a function that can resolve substitution properties for this component's data context.
         */
        _propertyResolver: function()
        {
            var cObj = this;
            var parentResolver = this.parent ? this.parent._propertyResolver() :
                $.component.rootPropertyResolver;
            var keyedDC = {};
            _.each($.makeArray(cObj._dataContext), function(d) { keyedDC[d.id] = d; });
            var dcResolver = function(name)
            {
                var result = $.deepGetStringField(keyedDC, name);
                // dc.dataset is the only time we care about applying an
                // object to a function
                if (_.isFunction(result))
                { result = result.call(keyedDC[_.first(name.split('.', 1))].dataset); }

                if (result !== undefined)
                { return result; }
                _.any($.makeArray(cObj._dataContext), function(dc)
                {
                    result = $.deepGetStringField(dc, name);
                    // dc.dataset is the only time we care about applying an
                    // object to a function
                    if (_.isFunction(result))
                    { result = result.call(dc.dataset); }
                    return result !== undefined;
                });
                return result;
            };
            var entity = cObj._properties.entity;
            if (entity)
            {
                return function(name)
                {
                    var result;
                    if (!_.isEmpty(cObj._dataContext)) { result = dcResolver(name); }
                    if (result !== undefined)
                    { return result; }
                    result = $.deepGetStringField(entity, name);
                    if (result !== undefined)
                    { return result; }
                    return parentResolver(name);
                };
            }

            if (!_.isEmpty(cObj._dataContext))
            {
                return function(name)
                {
                    var result = dcResolver(name);
                    if (result !== undefined)
                        return result;
                    return parentResolver(name);
                };
            }
            return parentResolver;
        },

        _substitutionHelpers: function()
        {
            return $.extend(true, $.isBlank(this.parent) ? {} : this.parent._substitutionHelpers(),
                    this._properties.substitutionHelpers);
        },

        _getDatasetListFromContext: function(context)
        {
            var datasets = [];
            _.each($.makeArray(context), function(dc)
            {
                switch (dc.type)
                {
                    case 'dataset':
                        datasets.push(dc.dataset);
                        break;
                    case 'datasetList':
                        datasets = datasets.concat(_.pluck(dc.datasetList, 'dataset'));
                        break;
                }
            });
            return datasets;
        },

        /**
         * Helper when updating the data source on a component. Not called automatically
         * since not all components have a data source.
         */
        _updateDataSource: function(properties, callback)
        {
            var cObj = this;
            properties = _.isEmpty(properties) ? cObj._properties : properties;
            var gotDCGen = function(count)
            {
                var finishCallback = _.after(count, function()
                {
                    cObj.finishLoading();
                    if (cObj._isActiveEdit)
                    { $.cf.side.enableProperties(true); }
                    if (_.isFunction(callback)) { callback.apply(cObj); }
                });
                cObj._clearDataContext();
                return {
                    success: function(dc)
                    {
                        cObj._addDataContext(dc);
                        finishCallback();
                    },
                    error: function(dcId)
                    {
                        cObj._nullDataContexts = cObj._nullDataContexts || [];
                        cObj._nullDataContexts.push(dcId);
                        // We're just going to say we're done; it is up to the component
                        // to detect no dataContext exists
                        finishCallback();
                    }
                };
            };

            var startDCGet = function()
            { cObj.startLoading(); };

            var cxt = properties.context;
            var cIds = properties.contextId;
            var curItem = cObj.parent;
            while ($.isBlank(cIds) && $.isBlank(cxt) && !$.isBlank(curItem))
            {
                var props = curItem.properties();
                cxt = props.context;
                cIds = props.childContextId || props.contextId;
                curItem = curItem.parent;
            }
            cIds = cObj._stringSubstitute($.makeArray(cIds));
            var existIds =
                _.compact(
                    _.pluck($.makeArray(cObj._dataContext), 'id')
                    .concat(cObj._nullDataContexts)
                    );

            var hasNewInheritedId = (!$.isBlank(cxt) || !_.isEmpty(cIds)) && !_.isEqual(cIds.sort(), existIds.sort());

            // Process if we have a new inherited context id, or
            // we have ONLY a non-blank local context (we will look
            // at the latter in more detail below).
            if ( (!$.isBlank(cxt) && _.isEmpty(cIds)) || hasNewInheritedId)
            {
                cObj.unbind('update_properties', null, cObj);
                if (!_.isEmpty(cIds))
                {
                    var finishDC = gotDCGen(cIds.length);
                    _.map(cIds, function(cId)
                        {
                            if (!$.dataContext.getContext(cId, finishDC.success,
                                    function() { finishDC.error(cId); }))
                            {
                                if ((cObj._properties.entity || {}).hasOwnProperty(cId))
                                {
                                    var eDC = { id: cObj.id + '-' + cId, type: 'entity',
                                        value: cObj._properties.entity[cId] };
                                    _.defer(function() { finishDC.success(eDC); });
                                }
                                else
                                {
                                    var p = cObj.parent;
                                    if (!$.isBlank(p))
                                    {
                                        var findContextItem = function()
                                        {
                                            var item = $.deepGetStringField(p._dataContext || {}, cId);
                                            if (!$.isBlank(item))
                                            {
                                                var dDC = { id: cObj.id + '-' + cId,
                                                    type: 'entity', value: item };
                                                _.defer(function() { finishDC.success(dDC); });
                                            }
                                            else
                                            { _.defer(function() { finishDC.error(cId); }); }
                                        };
                                        if (!p._updateDataSource(null, findContextItem))
                                        { findContextItem(); }
                                    }
                                    else
                                    { _.defer(function() { finishDC.error(cId); }); }
                                }
                            }
                        });
                    startDCGet();
                }
                else if (!$.isBlank(cxt))
                {
                    cObj._inlineContextConfigs = {};
                    var isArr = _.isArray(cxt);
                    // Hmm; maybe this is taking templating a bit too far?
                    cxt = $.makeArray(cxt);
                    _.each(cObj._stringSubstitute(cxt), function(c, i)
                    {
                        var id = c.id;
                        if ($.isBlank(id))
                        {
                            id = 'context-' + cObj.id + (isArr ? '-' + i : '');
                            c.id = id;
                            // Only set contextId if we got the context at this level
                            if (!$.isBlank(properties.context))
                            {
                                // Maybe this was a failed context?
                                var hasNewContextId = !cObj._nullDataContexts || !_.include(cObj._nullDataContexts, id);
                                if (hasNewContextId)
                                {
                                    if (!_.isArray(properties.contextId))
                                    { properties.contextId = []; }
                                    properties.contextId.push(id);
                                }
                            }
                            cxt[i].id = id;
                        }
                        startDCGet();
                        var finishDC = gotDCGen(1);
                        $.dataContext.loadContext(id, c, finishDC.success,
                            function() { finishDC.error(id); });
                        cObj._inlineContextConfigs[c.id] = c;
                    });
                    if (_.isArray(properties.contextId) && properties.contextId.length == 1)
                    { properties.contextId = _.first(properties.contextId); }

                    cObj.bind('update_properties', function()
                    {
                        _.each(cObj._stringSubstitute(cxt), function(c, i)
                        {
                            if (!_.isEqual(c, cObj._inlineContextConfigs[c.id]))
                            {
                                $.dataContext.updateContext(c);
                                cObj._inlineContextConfigs[c.id] = c;
                            }
                        });
                    }, cObj);
                }
                return true;
            }
            else if ($.isBlank(cxt) && $.isBlank(cObj._properties.context) &&
                    _.isEmpty(cIds) && $.isBlank(cObj._properties.contextId))
            { delete cObj._dataContext; }
            return false;
        },

        _clearDataContext: function()
        {
            delete this._dataContext;
            delete this._nullDataContexts;
            this._isDirty = true;
            if (this._isActiveEdit)
            { $.cf.side.enableProperties(false); }
        },

        _addDataContext: function(dc)
        {
            if (_.any($.makeArray(this._dataContext), function(curDC) { return curDC.id == dc.id; }))
            { return; }

            if ($.isBlank(this._dataContext))
            { this._dataContext = dc; }
            else
            {
                this._dataContext = $.makeArray(this._dataContext);
                this._dataContext.push(dc);
            }
            this._isDirty = true;
        },

        /**
         * List all template substitution tokens for this component hierarchy.  Default implementation scans all
         * string properties.  If this is not appropriate then override.
         */
        listTemplateSubstitutions: function(list) {
            _.each(_.values(this._properties), function(propertyValue) {
                if (typeof propertyValue == 'string') {
                    var matcher = /\{([^}]+)\}/g;
                    while (match = matcher.exec(propertyValue))
                        list.push(match[1]);
                }
            });
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
            var translatedName = result.prototype.catalogName; // Hack to make translations happen.
            result.catalogName = result.prototype.catalogName = name;
            result.catalogCategory = result.prototype.catalogCategory = category;
            $.component.registerCatalogType(result);
            if (translatedName)
            { result.catalogName = result.prototype.catalogName = translatedName; }
        }
        return result;
    };

    $.component = function(id, compSet)
    {
        if (typeof id == 'number') { id = 'c' + id; }
        if (compSet === true)
        { return _.compact(_.map(componentSets, function(cs) { return cs[id]; })); }
        else
        { return componentSets[compSet || primarySet][id]; }
    }

    // That extra five characters is annoying in Firebug
    $.comp = $.component;

    var queryParams;
    var envItems;

    var $win = $(window);
    var $doc = $(document);
    var prevWinPercent = 0;
    var disableWinUpdate = false;
    var winUpdateTimer;

    $.extend($.component, {
        Component: Component,

        rootPropertyResolver: function(name) {
            if (name.charAt(0) == '?')
            {
                if ($.isBlank(queryParams))
                {
                    queryParams = blist.configuration.pageVariables;
                    if ($.isBlank(queryParams))
                    {
                        queryParams = {};
                        _.each(window.location.search.substring(1).split('&'), function(p)
                            {
                                var s = p.split('=');
                                queryParams[s[0]] = unescape(s[1]);
                            });
                    }
                }
                return queryParams[name.substring(1)];
            }
            else if (name.startsWith('env.'))
            {
                if ($.isBlank(envItems))
                { envItems = blist.configuration.env; }
                return envItems[name.substring(4)];
            }
        },

        allocateId: function() {
            return 'c' + nextAutoID++;
        },

        sizeRenderRefresh: _.debounce(function()
        {
            var newWinPercent = getWinPercent();
            if (newWinPercent != prevWinPercent)
            { $win.scrollTop(prevWinPercent * $doc.height()); }

            disableWinUpdate = true;
            $.waypoints('refresh');

            if (!$.isBlank(winUpdateTimer))
            { clearTimeout(winUpdateTimer); }
            winUpdateTimer = setTimeout(function()
            {
                disableWinUpdate = false;
                winUpdateTimer = null;
            }, 500);
        }, 200),

        isLoading: function()
        { return wsCounter > 0; }
    });

    // Set up the catalog registry here, since it is required for Component.extend to actually work
    var catalog = {};

    $.extend($.component, {
        globalNotifier: new (Model.extend(
        {
            _init: function()
            {
                this._super.apply(this, arguments);
                this.registerEvent(['component_added', 'component_removed'])
            }
        }))(),

        registerCatalogType: function(type) {
            $.component[type.typeName = type.prototype.typeName = type.catalogName.camelize()] = type;
            if (type.catalogCategory) {
                var category = catalog[type.catalogCategory];
                if (!category)
                    category = catalog[type.catalogCategory] = { id: type.catalogCategory, name: type.catalogCategory.camelize(), entries: [] };
                category.entries.push(type);
            }
        },

        create: function(properties, compSet)
        {
            if (properties == undefined)
            { throw new Error("Component create without input properties"); }
            if (properties instanceof $.component.Component)
            { return properties; }
            if (typeof properties == "string")
            {
                var type = properties;
                properties = {};
            }
            else
            { type = properties.type; }
            if (type == undefined)
            { throw new Error("Component create without type property"); }
            var componentClass = $.component[properties.type.camelize()];
            if (!componentClass)
            { throw new Error("Invalid component type " + type); }
            return new componentClass($.extend(true, {}, properties), compSet);
        },

        initialize: function(configRoot, componentSet)
        {
            componentSet = componentSet || primarySet;
            roots[componentSet] = null;
            componentSets[componentSet] = componentSets[componentSet] || {};
            if ($.isPlainObject(configRoot))
            {
                if ($.subKeyDefined(configRoot, 'bodyClass'))
                { $('body').addClass(configRoot.bodyClass); }
                var component = this.create(configRoot, componentSet);
                component._render();
                if (component._isRenderable() && !component.dom.parentNode)
                { throw new Error("Unparented root component " + component.id); }
                roots[componentSet] = component;
            }

            $(document).trigger('canvas_initialized');
        },

        root: function(componentSet)
        {
            return componentSet === true ? roots : roots[componentSet || primarySet];
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
        _move: function() {},
        _isRenderable: function()
        {
            return false;
        }
    });

    $win.scroll(function()
    {
        if (!disableWinUpdate)
        { prevWinPercent = getWinPercent(); }
    });

    var getWinPercent = function()
    { return $win.scrollTop() / $doc.height(); };

})(jQuery);
