/**
 * Base implementation for components that contain other components.
 */
(function($) {
    $.component.Component.extend('Container', 'content', {
        _init: function()
        {
            var props = arguments[0];
            this._childrenToLoad = props.children;
            delete props.children;

            this._super.apply(this, arguments);
//            this._childrenLoading = {};
        },

        _initDom: function() {
            this._super();

            this.$ct = this._getContainer();
            this.$ct.addClass('socrata-container');
            this._addChildren();
        },

        /**
         * Add a child (or children) to the container.
         *
         * @param child the child to add as properties or Component derivative
         * @param position the node before which the child is added; default is end-of-list
         */
        add: function(child, position)
        {
            if ($.isBlank(child)) return;
            if ($.isArray(child)) {
                // Set flag to prevent layout as we recurse into arrays
                if (!this._blockArrange)
                    var arrange = this._blockArrange = true;

                // Add the children
                var result = _.map(child.slice(), function(c) {
                    return this.add(c, position);
                }, this);

                // Arrange if we're the owners of the arrange block
                if (arrange) {
                    this._blockArrange = false;
                    this._arrange();
                }

                return result;
            }

            if (!(child instanceof $.component.Component))
            { child = $.component.create(child, this._componentSet); }

            // We want to initialize any functional components, but they go into their own store
            // and not into the DOM
            if (child instanceof $.component.FunctionalComponent)
            {
                this._funcChildren = this._funcChildren || [];
                this._funcChildren.push(child);
                return null;
            }

            if (!this._visibility)
            { child.hide(); }

            // Disable spinner aggregation for now, since we've switched to a smaller throbber
//            var cObj = this;
//            child.bind('start_loading', function()
//                {
//                    cObj._childrenLoading[this.id] = true;
//                    cObj._adjustLoading();
//                })
//                .bind('finish_loading', function()
//                {
//                    delete cObj._childrenLoading[this.id];
//                    cObj._adjustLoading();
//                });
            child._move(this, position);

            return child;
        },

//        _adjustLoading: function()
//        {
//            var numLoading = _.size(this._childrenLoading);
//            if (numLoading > 1 && !this._loadingForChildren)
//            {
//                this._loadingForChildren = true;
//                this.each(function(child) { child.suspendLoading(true); });
//                this.startLoading();
//            }
//            else if (numLoading < 2 && this._loadingForChildren)
//            {
//                this._loadingForChildren = false;
//                this.each(function(child) { child.suspendLoading(false); });
//                this.finishLoading();
//            }
//        },

        _addChildren: function()
        {
            if (!$.isBlank(this._childrenToLoad))
            {
                this.add(this._childrenToLoad);
                delete this._childrenToLoad;
            }
        },

        _move: function()
        {
            this._super.apply(this, arguments);
            this._addChildren();
        },

        /**
         * Callback invoked by children that are newly parented by this container or moved within the container.
         */
        _childMoved: function(child, oldParent, oldPrev, oldNext)
        {
            // Record keeping -- update first & last
            if (!this.first)
            { this.first = this.last = child; }
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
            {
                this._moveChildDom(child);
            }
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
        _moveChildDom: function(child)
        {
            if (!this._initialized)
            {
                if (child._initialized)
                { $(child.dom).detach(); }
                return;
            }
            if (!child._initialized)
            {
                child._initDom();
                if (this._designing) { child.design(true); }
            }

            if ($.subKeyDefined(child, 'next.$dom') && child.next.$dom.parent().index(this.$ct) >= 0)
            { child.next.$dom.parent()[0].insertBefore(child.$dom[0], child.next.$dom[0]); }
            else if (!$.isBlank(this.$ct) && (child.$dom.parent().index(this.$ct) < 0 ||
                        child.hasOwnProperty('next') && $.isBlank(child.next)))
            { this.$ct[0].appendChild(child.$dom[0]); }

            if (child.$dom.parent().length > 0 && this._rendered && !child._rendered)
            { child._render(); }

            var cObj = this;
            child.bind('shown', function() { cObj._arrange(); }, this);
            child.bind('hidden', function() { cObj._arrange(); }, this);

            this._arrange();
        },

        /**
         * Remove child from DOM.
         */
        _removeChildDom: function(child) {
            if (!this._initialized)
                return;
            child.$dom.detach();
            child.unbind(null, null, this);
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
        count: function()
        {
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
        destroy: function()
        {
            this.empty();
            this._super();
        },

        empty: function()
        {
            this.each(function(child)
            {
                delete child.parent;
                child.destroy();
            });
            delete this.first;
            delete this.last;
            if (!$.isBlank(this.$contents))
            { this.$contents.empty(); }
            _.each(this._funcChildren, function(c) { c.destroy(); });
            delete this._funcChildren;
        },

        setVisibility: function()
        {
            var origArgs = arguments;
            this._super.apply(this, origArgs);
            this.each(function(c) { c.setVisibility.apply(c, origArgs); });
        },

        fetchChildren: function(start, count, callback)
        {
            // Implement me if you can
        },

        // Override render to render children as well
        _render: function() {
            if (!this._super()) { return false; }

            this.each(this._moveChildDom, this);

            this._arrange();
            return true;
        },

        // Override to create separate container component
        _getContainer: function() {
            return this.$contents;
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
        _readChildren: function()
        {
            var children = [];
            this.each(function(child) { children.push(child.properties()); });
            _.each(this._funcChildren, function(child) { children.push(child.properties()); });
            return children;
        },

        _shown: function()
        {
            this._super();
            this.each(function(child) { child._shown(); });
        },

        _hidden: function()
        {
            this._super();
            this.each(function(child) { child._hidden(); });
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
        _arrange: function()
        {
            this.each(function(child) {
                if (child._arrange)
                    child._arrange();
            });
            this._super();
            if (!$.isBlank(this.$dom))
            { this.$dom.trigger('canvas_container_updated'); }
        },

        // Propagate design mode to children
        design: function(designing)
        {
            var cObj = this;
            this._super.apply(this, arguments);
            this.each(function(child) { child.design(designing); });
            if (!$.isBlank(this.$dom) && this.canEdit('drop') &&
                    !this.$dom.isControlClass('nativeDropTarget'))
            {
                if (designing)
                {
                    this.$dom.nativeDropTarget({
                        contentEditable: false,
                        acceptCheck: function($item)
                        {
                            // Don't allow dropping a Container into itself or a child
                            return !$item.find(cObj.$dom).exists() &&
                                $item[0] != cObj.$dom[0] &&
                                $item.data('typename') != 'MapLayer' &&
                                ($item.hasClass('socrata-component') ||
                                $item.hasClass('componentCreate'));
                        },
                        dragOverCallback: function() { return cObj._handleDragOver.apply(cObj, arguments); },
                        dragLeaveCallback: function()
                        {
                            if (!$.isBlank(cObj._$dropCursor))
                            { cObj._$dropCursor.addClass('hide'); }
                            // Don't save positions when moving out; but we want to be sure
                            // these are around for drop to handle
                            _.defer(function()
                            {
                                delete cObj._dropPosition;
                                delete cObj._dropChild;
                            });
                        },
                        dropCallback: function(dropId, dropType)
                        {
                            if (!$.isBlank(cObj._$dropCursor))
                            { cObj._$dropCursor.addClass('hide'); }

                            if (dropType == 'move')
                            {
                                var moveComp = $.component(dropId, cObj._componentSet);
                                if (!$.isBlank(moveComp) && (moveComp.parent != cObj ||
                                            (moveComp != cObj._dropPosition &&
                                                 moveComp.next != cObj._dropPosition)))
                                {
                                    $.cf.edit.execute('move', {
                                        newContainer: cObj,
                                        newPosition: cObj._dropPosition,
                                        oldContainer: moveComp.parent,
                                        oldPosition: moveComp.next,
                                        child: moveComp
                                    });
                                }
                            }
                            else if (dropType == 'copy')
                            {
                                $.cf.edit.beginTransaction();

                                $.cf.edit.execute('add', {
                                    container: cObj,
                                    position: cObj._dropPosition,
                                    childTemplate: { type: dropId }
                                });
                            }
                        }
                    });
                }
            }
            else if (!$.isBlank(this.$dom) && this.$dom.isControlClass('nativeDropTarget'))
            {
                if (designing)
                { this.$dom.nativeDropTarget().enable(); }
                else
                { this.$dom.nativeDropTarget().disable(); }
            }
        },

        _handleDragOver: function(pos, dropInfo)
        {
            // Get closest child to drop cursor
            if (!$.isBlank(this._dropChild))
            {
                if (!this._testChildHit(this._dropChild, pos))
                { delete this._dropChild; }
            }

            if ($.isBlank(this._dropChild))
            { this._dropChild = this._getDropChild(pos); }

            if ($.isBlank(this._dropChild))
            {
                this._dropPosition = null;
                // Empty container, so don't draw a cursor, but accept the drop
                return;
            }

            // Determine orientation on it
            var targetOrientation = this._getDropOrientation(this._dropChild, pos);

            this._dropPosition = this._getDropPosition(this._dropChild, targetOrientation);

            if (dropInfo.type == 'move')
            {
                var moveChild = $.component(dropInfo.id, this._componentSet);
                if (!$.isBlank(moveChild) && moveChild.parent == this &&
                        (this._dropPosition == moveChild || this._dropPosition == moveChild.next))
                {
                    delete this._dropPosition;
                    delete this._dropChild;
                    if (!$.isBlank(this._$dropCursor)) { this._$dropCursor.addClass('hide'); }
                    return false; // Don't accept drop here
                }
            }

            // Draw cursor
            this._drawDropCursor(this._dropChild, targetOrientation);
        },

        _getDropChild: function(pos)
        {
            var cObj = this;
            var lastChild;
            var result = cObj.each(function(child)
            {
                if (cObj._testChildHit(child, pos, true))
                { return child; }
                lastChild = child;
            });
            if ($.isBlank(result) && !$.isBlank(lastChild))
            { return lastChild; }
            return result;
        },

        _testChildHit: function(child, pos, inSequence)
        {
            var childOffset = child.$dom.offset();
            return (inSequence && childOffset.top > pos.y) ||
                childOffset.top <= pos.y && childOffset.top + child.$dom.outerHeight(true) >= pos.y;
        },

        _getDropOrientation: function(child, pos)
        {
            var offs = child.$dom.offset();
            var mpX = offs.left + child.$dom.outerWidth(true) / 2;
            var mpY = offs.top + child.$dom.outerHeight(true) / 2;
            return { vPos: mpY >= pos.y ? 'top' : 'bottom', hPos: mpX >= pos.x ? 'left' : 'right' };
        },

        _getDropPosition: function(child, targetOrientation)
        {
            var cursorDir = this._dropCursorDirection();
            return cursorDir == 'horizontal' && targetOrientation.vPos == 'top' ||
                cursorDir == 'vertical' && targetOrientation.hPos == 'left' ? child : child.next;
        },

        _drawDropCursor: function(child, targetOrientation)
        {
            if ($.isBlank(this._$dropCursor))
            {
                this._$dropCursor = $.tag({tagName: 'div', 'class': 'dropCursor'});
                this.$dom.append(this._$dropCursor);
            }

            var direction = this._dropCursorDirection();
            this._$dropCursor.removeClass('horizontal vertical hide').addClass(direction);

            var pos = 0;
            var side;
            switch (direction)
            {
                case 'horizontal':
                    side = 'top';
                    if (targetOrientation.vPos == 'bottom')
                    { pos = child.$dom.outerHeight(); }
                    break;
                case 'vertical':
                    side = 'left';
                    if (targetOrientation.hPos == 'right')
                    { pos = child.$dom.outerWidth(); }
                    break;
            }
            pos += child.$dom.offset()[side] - this.$dom.offset()[side];
            this._$dropCursor.css(side, pos);
        },

        _dropCursorDirection: function()
        { return 'horizontal'; },

        // Propagate substitution parameter scan
        listTemplateSubstitutions: function(list) {
            this._super(list);
            this.each(function(child) {
                child.listTemplateSubstitutions(list);
            });
        }
    });

    $.component.Container.extend('Horizontal Container', 'content', {
        // Override rendering to add a (eww) clearing element
        _initDom: function() {
            this._super.apply(this, arguments);

            var $clear = this.$dom.children('.socrata-ct-clear');
            if ($clear.length < 1)
            {
                this.$dom.append('<div class="socrata-ct-clear"></div>');
                $clear = $(this.dom.lastChild);
            }
            else if (!$clear.is(':last-child'))
            {
                this.$dom.append($clear);
            }
            this._$clear = $clear;
        },

        // Override child move to wrap child in extra div
        _moveChildDom: function(child)
        {
            if (!child._initialized)
            {
                child._initDom();
                if (this._designing) { child.design(true); }
            }
            if (!child.wrapper)
            {
                var $w = child.$dom.parent('.component-wrapper');
                if ($w.length < 1)
                {
                    child.wrapper = document.createElement('div');
                    child.wrapper.className = 'component-wrapper';
                    child.wrapper.appendChild(child.dom);
                    child.$wrapper = $(child.wrapper);
                }
                else
                {
                    child.$wrapper = $w;
                    child.wrapper = $w[0];
                }
            }
            if ($.subKeyDefined(child, 'next.$wrapper') &&
                    child.next.$wrapper.parent().index(this.$ct) >= 0)
            { child.next.$wrapper.parent()[0].insertBefore(child.$wrapper[0], child.next.$wrapper[0]); }
            else if (!$.isBlank(this._$clear))
            { this._$clear.parent()[0].insertBefore(child.$wrapper[0], this._$clear[0]); }
            else if (!$.isBlank(this.$ct))
            { this.$ct[0].appendChild(child.$wrapper[0]); }
            if (child.$wrapper.parent().length > 0 && this._rendered && !child._rendered)
            { child._render(); }

            var cObj = this;
            child.bind('shown', function() { cObj._arrange(); }, this);
            child.bind('hidden', function() { cObj._arrange(); }, this);

            this._arrange();
        },

        // Override child remove to 1.) unwrap child, and 2.) update layout
        _removeChildDom: function(child)
        {
            if (child.$wrapper)
            {
                child.$wrapper.detach();
                delete child.wrapper;
                delete child.$wrapper;
                child.unbind(null, null, this);
            }
            this._arrange();
        },

        _arrange: function()
        {
            var cObj = this;
            if (this._blockArrange) { return; }

            if (this._initialized)
            { this.$contents.toggleClass('inlineDisplay', !!this._properties.inlineDisplay); }

            var visibleChildren = [];
            var totalWeight = 0;
            this.each(function(child)
            {
                if (child._isHidden || !child._isRenderable()) { return; }
                visibleChildren.push(child);
                totalWeight += child.properties().weight || 1;
            });

            var pos = 0;
            _.each(visibleChildren, function(child)
            {
                var isWrapped = $.subKeyDefined(child, '$wrapper');
                if (cObj._properties.inlineDisplay)
                {
                    if (isWrapped) { child.$wrapper.css({marginLeft: 0, width: 'auto'}); }
                }
                else
                {
                    var weight = child.properties().weight || 1;
                    if (isWrapped)
                    {
                        child.$wrapper.css({
                            marginLeft: -(100 - pos / totalWeight * 100) + '%',
                            width: (weight / totalWeight * 100) + '%'
                        });
                    }
                    pos += weight;
                }
            });

            this._super();

            if (visibleChildren.length > 0)
            {
                $(this.dom).children('first-child').removeClass('first-child');
                $(_.first(visibleChildren).wrapper).addClass('first-child');
            }
        },

        _testChildHit: function(child, pos, inSequence)
        {
            var childOffset = child.$dom.offset();
            return (inSequence && childOffset.left > pos.x) ||
                childOffset.left <= pos.x && childOffset.left + child.$dom.outerWidth(true) >= pos.x;
        },

        _dropCursorDirection: function()
        { return 'vertical'; }
    });

    $.extend($.component.Container, {
        /**
         * Wrap a child component in a container.  This is used to create space for new components when performing
         * layout into a space perpendicular to the parent container.
         */
        wrap: function(child, wrapperConfig)
        {
            var parent = child.parent;
            if (!parent)
                throw new Error("Cannot wrap unparented child");
            var position = child.next;

            parent._blockArrange = true;
            try {
                if (wrapperConfig.weight === undefined)
                    wrapperConfig.weight = child.properties().weight;
                var wrapper = $.component.create(wrapperConfig, this._componentSet);
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
