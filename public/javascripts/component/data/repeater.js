(function($) {

$.component.Container.extend('Repeater', 'content', {
    _init: function()
    {
        var props = arguments[0];
        // Take my children and give them to a "clone" template that will repeat once for each object
        var children = props.children || [];
        delete props.children;

        this._delayUntilVisible = true;

        // Normal object setup
        this._super.apply(this, arguments);

        // Record keeping preparation
        this._map = [];

        this._idPrefix = this.id + '-';

        setUpProperties(this, children);
    },

    _initDom: function()
    {
        this._super.apply(this, arguments);
        if ($.isBlank(this._properties.height) && (this._isDirty && !this.$dom.hasClass('serverRendered')))
        {
            this._tempHeight = 500;
            this.$dom.css('min-height', this._tempHeight);
        }
        // hook up the real container when rendered by the server
        if ($.isBlank(this._realContainer) && this._properties.container && $.isBlank(this.first))
        { this._setUpRealContainer(); }
    },

    _dataReady: function()
    {
        // We just need the dc loaded to hook up events; don't actually do anything
    },

    design: function(designing)
    {
        var cObj = this;
        // If we were designing, update from the edited config
        if (this._designing && !designing)
        {
            this._cloneProperties.children = this._readChildren();
            // Need to clean out a contextId when there is also a context since cId takes precedence,
            // but is probably wrong for the design item
            var cleanCId = function(item)
            {
                _.each(item.children, function(c)
                {
                    if (!$.isBlank(c.context) && !$.isBlank(c.contextId))
                    { delete c.contextId; }
                    cleanCId(c);
                });
            };
            cleanCId(this._cloneProperties);
        }

        this._super.apply(this, arguments);
        if ($.subKeyDefined(this, '_delayUntilVisible'))
        { this._delayUntilVisible = !this._designing; }
        this._render();
    },

    fetchChildren: function(start, count, callback)
    {
        var cObj = this;
        cObj.startLoading();
        cObj._loadRows(start, count, function(renderedRows)
        {
            renderedRows = _.select(renderedRows, function(r) { return $.isPlainObject(r); });
            callback(renderedRows);
            cObj.finishLoading();
        });
    },

    _clearDataContext: function()
    {
        var cObj = this;
        // Unbind anything old
        _.each($.makeArray(cObj._dataContext), function(dc)
        {
            if (dc instanceof DataContext)
            { dc.unbind(null, null, cObj); }
            if (!$.isBlank(dc.dataset))
            { dc.dataset.unbind(null, null, cObj); }
        });
        cObj._super.apply(cObj, arguments);
    },

    _addDataContext: function(dc)
    {
        var cObj = this;
        this._super.apply(this, arguments);

        if ($.subKeyDefined(dc, 'dataset') && this._properties.repeaterType != 'column')
        {
            dc.dataset.bind('query_change', function()
            {
                cObj._childrenDirty = true;
                cObj._isDirty = true;
                if (!$.isBlank(cObj.$dom))
                { cObj.$dom.removeClass('serverRendered'); }
                cObj._render();
            }, this);
            cObj.$dom.attr('aria-live', 'polite');
        }

        if (dc.type == 'datasetList')
        {
            dc.bind('data_change', function()
            {
                cObj._childrenDirty = true;
                cObj._isDirty = true;
                if (!$.isBlank(cObj.$dom))
                { cObj.$dom.removeClass('serverRendered'); }
                cObj._render();
            }, this);
            cObj.$dom.attr('aria-live', 'polite');
        }
    },

    _setUpRealContainer: function()
    {
        this._realContainer = this.add(this._properties.container || {type: 'Container'});
        delete this._containerDirty;
    },

    _loadRows: function(start, count, callback)
    {
        var cObj = this;
        var renderedRows = [];
        if ($.isBlank(cObj._dataContext))
        {
            callback();
        }
        else if (_.isArray(cObj._dataContext.value))
        {
            _.each(cObj._dataContext.value.slice(start, start + count), function(di, i)
            {
                if (!_.isObject(di))
                { di = { value: di }; }
                renderedRows.push(cObj._createRow(di, i + start, di));
            });
            callback(renderedRows);
        }
        else if (_.isArray(cObj._dataContext.list))
        {
            _.each(cObj._dataContext.list.slice(start, start + count), function(di, i)
            {
                if (!_.isObject(di))
                { di = { value: di }; }
                renderedRows.push(cObj._createRow(di, i + start, di));
            });
            callback(renderedRows);
        }
        else if (_.isArray(cObj._dataContext.goalList))
        {
            var goalItems = cObj._dataContext.goalList.slice(start, start + count);
            if (!$.isBlank(cObj._properties.groupBy))
            { renderGroupItems(cObj, goalItems, callback); }
            else
            {
                _.each(goalItems, function(di, i)
                {
                    if (!_.isObject(di))
                    { di = { value: di }; }
                    renderedRows.push(cObj._createRow(di, i + start, di));
                });
                callback(renderedRows);
            }
        }
        else if (cObj._dataContext.type == 'goalDashboard')
        {
            var catItems = cObj._dataContext.dashboard.categories.slice(start, start + count);
            if (!$.isBlank(cObj._properties.groupBy))
            { renderGroupItems(cObj, catItems, callback); }
            else
            {
                _.each(catItems, function(di, i)
                {
                    if (!_.isObject(di))
                    { di = { value: di }; }
                    renderedRows.push(cObj._createRow(di, i + start, di));
                });
                callback(renderedRows);
            }
        }
        else if (_.isArray(cObj._dataContext.categoryList))
        {
            var catItems = cObj._dataContext.categoryList.slice(start, start + count);
            if (!$.isBlank(cObj._properties.groupBy))
            { renderGroupItems(cObj, catItems, callback); }
            else
            {
                _.each(catItems, function(di, i)
                {
                    if (!_.isObject(di))
                    { di = { value: di }; }
                    renderedRows.push(cObj._createRow(di, i + start, di));
                });
                callback(renderedRows);
            }
        }
        else if (view = (cObj._dataContext || {}).dataset)
        {
            if (cObj._properties.repeaterType == 'column')
            {
                var exF = cObj._stringSubstitute(cObj._properties.excludeFilter);
                var incF = cObj._stringSubstitute(cObj._properties.includeFilter);
                _.each(_.select(cObj._dataContext.dataset.visibleColumns, function(c)
                {
                    if (_.all(exF, function(v, k)
                        { return !_.include($.makeArray(v), $.deepGetStringField(c, k)); }) &&
                        ($.isBlank(cObj._properties.includeFilter) ? true :
                                   _.any(incF, function(v, k)
                                       { return _.include($.makeArray(v), $.deepGetStringField(c, k)); })))
                    { return true; }
                    return false;
                }).slice(start, start + count), function(c, i)
                    { renderedRows.push(cObj._createRow(cObj._dataContext, i + start, {column: c})); });
                callback(renderedRows);
            }
            else
            {
                view.getRows(start, count, function(rows)
                {
                    rows = _.map(rows, function(r) { return view.rowToSODA2(r); });
                    if (!$.isBlank(cObj._properties.groupBy))
                    { renderGroupItems(cObj, rows, callback); }
                    else
                    {
                        callback(_.map(rows, function(r)
                            { return cObj._createRow(r, r[':index'], r); }));
                    }
                });
            }
        }
        else if (cObj._dataContext.type == 'datasetList')
        {
            cObj._dataContext.getItems(start, count, function(items)
            {
                callback(_.map(items, function(ds, i)
                        { return cObj._createRow(ds, i + start, $.extend({}, ds)); }));
            });
        }
        // Nothing to repeat on for row or column
    },

    _totalItems: function(callback)
    {
        var cObj = this;
        if ($.isBlank(cObj._dataContext))
        { callback(0); }
        else if (_.isArray(cObj._dataContext.value))
        { callback(cObj._dataContext.value.length); }
        else if (_.isArray(cObj._dataContext.list))
        { callback(cObj._dataContext.list.length); }
        else if (cObj._dataContext.type == 'goalDashboard')
        { callback(cObj._dataContext.dashboard.categories.length); }
        else if (_.isArray(cObj._dataContext.goalList))
        { callback(cObj._dataContext.goalList.length); }
        else if (_.isArray(cObj._dataContext.categoryList))
        { callback(cObj._dataContext.categoryList.length); }
        else if (view = (cObj._dataContext || {}).dataset)
        {
            if (cObj._properties.repeaterType == 'column')
            {
                var exF = cObj._stringSubstitute(cObj._properties.excludeFilter);
                var incF = cObj._stringSubstitute(cObj._properties.includeFilter);
                callback(_.select(cObj._dataContext.dataset.visibleColumns, function(c)
                {
                    if (_.all(exF, function(v, k)
                        { return !_.include($.makeArray(v), $.deepGetStringField(c, k)); }) &&
                        ($.isBlank(cObj._properties.includeFilter) ? true :
                                   _.any(incF, function(v, k)
                                       { return _.include($.makeArray(v), $.deepGetStringField(c, k)); })))
                    { return true; }
                    return false;
                }).length);
            }
            else
            {
                view.getTotalRows(function()
                { callback(view.totalRows()); });
            }
        }
        else if (cObj._dataContext.type == 'datasetList')
        { callback(cObj._dataContext.count); }
        else
        { callback(0); }
    },

    _refresh: function()
    {
        var cObj = this;
        if ($.isBlank(cObj._realContainer) || cObj._designing)
        {
            while (cObj.first)
            { cObj.first.destroy(); }
            _.each(cObj._funcChildren, function(fc) { fc.destroy(); });
            cObj._funcChildren = [];
            cObj._map = [];
            delete cObj._realContainer;
        }
        else if (!$.isBlank(cObj._realContainer))
        {
            if (cObj._containerDirty)
            {
                cObj._realContainer.destroy();
                delete cObj._realContainer;
                cObj._map = [];
            }
            else if (cObj._childrenDirty)
            {
                cObj._realContainer.empty();
                cObj._map = [];
            }
        }

        var view;
        if (cObj._designing)
        {
            // Render actual children as direct descendants
            cObj.add(cObj._cloneProperties.children);
            if (!$.isBlank(cObj._realContainer)) { cObj._realContainer.design(true); }
            cObj.each(function(c)
            { c.design(true); });

            if (!$.isBlank(cObj._realContainer)) { cObj._realContainer._designSubsidiary = true; }
            var addDesignSub = function(c)
            {
                if (_.isFunction(c.each))
                {
                    c.each(function(cc)
                    {
                        cc._designSubsidiary = true;
                        addDesignSub(cc);
                    });
                }
            };
            addDesignSub(cObj);
        }
        else
        {
            if ($.isBlank(cObj._realContainer))
            { cObj._setUpRealContainer(); }

            cObj._totalItems(function(totalCount)
            {
                var rowCount = cObj._stringSubstitute(cObj._properties.rowCount);
                var pageCount = rowCount || 100;
                var start = (cObj._stringSubstitute(cObj._properties.rowPage || 1) - 1) * pageCount;

                if (!$.isBlank(rowCount))
                { totalCount = Math.min(totalCount, rowCount); }

                if ($.subKeyDefined(cObj, '_realContainer.setCount'))
                { cObj._realContainer.setCount(totalCount); }

                var initCount;
                // Can't page with grouping
                if ($.subKeyDefined(cObj, '_realContainer.pageSize') && $.isBlank(cObj._properties.groupBy))
                { initCount = cObj._realContainer.pageSize(); }
                else
                { initCount = Math.min(totalCount, pageCount); }

                cObj.startLoading();
                cObj._loadRows(start, initCount, function(renderedRows)
                {
                    renderedRows = _.compact(renderedRows);
                    delete cObj._childrenDirty;
                    if (renderedRows.length < 1)
                    {
                        var clone = new $.component.Repeater.Clone($.extend(true, {},
                                cObj._noChildrenCloneProperties), cObj._componentSet);
                        // Insert the clone
                        cObj._realContainer.add(clone);
                    }
                    else
                    {
                        _.each(renderedRows, function(r)
                        {
                            if ($.isPlainObject(r))
                            { cObj._realContainer.add(r.row, r.index); }
                        });
                    }

                    cObj.finishLoading();
                    _.defer(function()
                    {
                        if (!$.isBlank(cObj._realContainer)) { cObj._realContainer._render(); }
                        $.component.sizeRenderRefresh();
                    });
                });
            });
        }
    },

    _render: function()
    {
        if (!this._super.apply(this, arguments)) { return false; }
        var cObj = this;

        var doRender = function()
        {
            if (!$.isBlank(cObj._tempHeight))
            {
                cObj.$dom.css('min-height', '');
                // Hack: This triggers a re-show of items
                $(window).scroll();
            }
            cObj._refresh();
        }
        if (!cObj._updateDataSource(cObj._properties, doRender))
        { doRender(); }

        return true;
    },

    _createRow: function(row, index, entity)
    {
        entity = entity || {};

        if ($.isBlank(entity._repeaterIndex)) { entity._repeaterIndex = index; }
        if ($.isBlank(entity._repeaterDisplayIndex)) { entity._repeaterDisplayIndex = index + 1; }
        if ($.isBlank(entity._evenOdd)) { entity._evenOdd = (index % 2) == 0 ? 'even' : 'odd'; }
        // Add ID prefix so repeated components will not clash
        var prefix = this._idPrefix + index + '-';
        function createTemplate(properties)
        {
            properties = _.clone(properties);
            properties.parentPrefix = prefix;
            properties.htmlClass = $.makeArray(properties.htmlClass);
            properties.htmlClass.push('id-' + properties.id);
            properties.id = prefix + (properties.id || $.component.allocateId());
            properties.entity = entity;
            var children = properties.children;
            if (properties.type != 'Repeater' && children)
            {
                if (!$.isArray(children))
                { children = [ children ]; }
                children = properties.children = children.slice();
                for (var i = 0; i < children.length; i++)
                { children[i] = createTemplate(children[i]); }
            }
            return properties;
        }
        var cloneProperties = createTemplate($.extend({},
                    this._stringSubstitute(this._properties.childProperties, entity),
                    this._cloneProperties));

        // Remove any existing row
        if (this._map[index])
        {
            if (!this._childrenDirty && this._map[index].id == cloneProperties.id)
            { return true; }
            this._map[index].remove();
            this._map[index] = undefined;
        }

        cloneProperties.childContextId = (row.id || '').toString();

        // Create clone
        var clone = this._map[index] = new $.component.Repeater.Clone(cloneProperties,
                this._componentSet);

        // Terrible hack; but core server doesn't support regexes in queries,
        // so this is the easiest way to skip some rows. This also doesn't
        // handle the fact that the number of rendered rows doesn't match up
        // directly with the position & length anymore; so it will probably not
        // behave properly if more than a page of data is present
        if (!$.isBlank(this._properties.valueRegex))
        {
            var r = new RegExp(this._stringSubstitute(this._properties.valueRegex.regex));
            var v = clone._stringSubstitute(this._properties.valueRegex.value);
            var result = r.test(v);
            if (this._properties.valueRegex.invert) { result = !result; }
            if (!result)
            {
                clone.destroy();
                return null;
            }
        }

        return { row: clone, index: index };
    },

    _readChildren: function()
    { return this._designing ? this._super() : this._cloneProperties.children; },

    _propWrite: function(properties)
    {
        var cObj = this;
        var origCloneProps = cObj._cloneProperties;
        // Make a copy so we don't screw up the original hash
        properties = $.extend(true, {}, properties);
        var origProps = $.extend(true, {}, cObj._properties);
        var children = properties.children;
        delete properties.children;

        cObj._super(properties);

        if (!$.isBlank(children))
        { setUpProperties(this, children); }

        cObj._containerDirty = !_.isEqual(cObj._properties.container, origProps.container);
        cObj._childrenDirty = !_.isEqual(cObj._cloneProperties, origCloneProps) ||
            _.any(['context', 'contextId', 'parentPrefix', 'groupBy',
                    'repeaterType', 'excludeFilter', 'includeFilter', 'valueRegex',
                    'childProperties', 'childHtmlClass', 'childStyles'], function(p)
            { return !_.isEqual(cObj._properties[p], origProps[p]); });

        if (cObj._containerDirty || cObj._childrenDirty)
        { cObj._render(); }
    }
});

$.component.Repeater.Clone = $.component.Container.extend({
    // No special behavior for clones at the moment
    _persist: false
});

var setUpProperties = function(cObj, children)
{
    cObj._cloneProperties = {
        id: 'clone',
        children: children,
        // TODO: Get rid of these out of templates so we can remove them
        htmlClass: cObj._properties.childHtmlClass,
        styles: cObj._properties.childStyles
    };

    cObj._noChildrenCloneProperties = {
        id: cObj.id + '_noChildren-clone',
        children:  cObj._properties.noResultsChildren
    };

    // Ensure that all descendants have an ID.  This ID is prefixed during object rendering.
    function allocateIds(children)
    {
        for (var i = 0; i < children.length; i++)
        {
            var child = children[i];
            if (child.id == undefined)
            { child.id = $.component.allocateId(); }
            if (child.children)
            { allocateIds(child.children); }
        }
    }
    allocateIds(cObj._cloneProperties);
    allocateIds(cObj._noChildrenCloneProperties);
    updateContainerPrefix(cObj);
};

var renderGroupItems = function(cObj, items, callback)
{
    var groupConfig = cObj._properties.groupBy;
    var groupIndex = {};
    var groups = [];
    _.each(items, function(item)
    {
        var group = cObj._stringSubstitute(groupConfig.value, item);
        if ($.isBlank(group)) { return; }
        var addGroupItem = function(g)
        {
            if ($.isBlank(groupIndex[g]))
            {
                groups.push(g);
                groupIndex[g] = [item];
            }
            else
            { groupIndex[g].push(item); }
        };

        if (!$.isBlank(groupConfig.splitOn))
        {
            _.each(group.split(groupConfig.splitOn), function(g)
            { addGroupItem(g); });
        }
        else { addGroupItem(group); }
    });

    if (groupConfig.sortAlpha)
    { groups = groups.sort(); }
    callback(_.map(groups, function(g, i)
    { return cObj._createRow({id: g}, i, {_groupValue: g, _groupItems: groupIndex[g]}); }));
};

var updateContainerPrefix = function(cObj)
{
    var parPrefix = cObj._properties.parentPrefix || '';
    if ($.subKeyDefined(cObj, '_properties.container.id') &&
            !cObj._properties.container.id.startsWith(parPrefix))
    {
        // Use the parent prefix so that if this is a top-level Repeater,
        // the realContainer id is unchanged
        cObj._properties.container.id = (cObj._properties.parentPrefix || '') +
            cObj._properties.container.id;
    }
};

})(jQuery);
