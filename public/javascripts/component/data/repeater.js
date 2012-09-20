(function($) {

$.component.Container.extend('Repeater', 'content', {
    position: 0,
    length: 100,

    _init: function(properties)
    {
        // Take my children and give them to a "clone" template that will repeat once for each object
        var children = properties.children || [];
        delete properties.children;

        this._delayUntilVisible = true;

        // Normal object setup
        this._super(properties);

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
        {
            this._realContainer = this.add(this._properties.container);
        }
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

    _clearDataContext: function()
    {
        var cObj = this;
        // Unbind anything old
        if ($.subKeyDefined(cObj, '_dataContext.dataset'))
        { _.each($.makeArray(cObj._dataContext), function(dc) { dc.dataset.unbind(null, null, cObj); }); }
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
                cObj._render();
            }, this);
        }
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

        var doneWithRows = function()
        {
            delete cObj._childrenDirty;
            _.defer(function()
            {
                if (!$.isBlank(cObj._realContainer)) { cObj._realContainer._render(); }
                $.component.sizeRenderRefresh();
            });
        };

        var view;
        if (cObj._designing)
        {
            // Render actual children as direct descendants
            cObj.add(cObj._cloneProperties.children);
            cObj.each(function(c) { c.design(true); });
        }
        else if ($.isBlank(cObj._dataContext))
        {
            return;
        }
        else if (_.isArray(cObj._dataContext.value))
        {
            var callback = _.after(cObj._dataContext.value.length, doneWithRows);
            _.each(cObj._dataContext.value, function(di, i) { cObj._setRow(di, i, di, callback); });
        }
        else if (view = (cObj._dataContext || {}).dataset)
        {
            if (cObj._properties.repeaterType == 'column')
            {
                var exF = cObj._stringSubstitute(cObj._properties.excludeFilter);
                var incF = cObj._stringSubstitute(cObj._properties.includeFilter);
                var callback = _.after(cObj._dataContext.dataset.visibleColumns.length, doneWithRows);
                _.each(cObj._dataContext.dataset.visibleColumns, function(c, i)
                {
                    if (_.all(exF, function(v, k)
                        { return !_.include($.makeArray(v), $.deepGetStringField(c, k)); }) &&
                        ($.isBlank(cObj._properties.includeFilter) ? true :
                                   _.any(incF, function(v, k)
                                       { return _.include($.makeArray(v), $.deepGetStringField(c, k)); })))
                    { cObj._setRow(cObj._dataContext, i, {column: c}, callback); }
                    else { callback(); }
                });
            }
            else
            {
                // Render records
                var columnMap = {};
                _.each(view.columns, function(c) { columnMap[c.id] = c.fieldName; });
                view.getRows(cObj.position, cObj.length, function(rows)
                {
                    // Create entity TODO - mapping will be unnecessary w/ SODA 2
                    rows = _.map(rows, function(row)
                    {
                        var r = {};
                        _.each(row, function(v, k)
                        {
                            if (!$.isBlank(columnMap[k]))
                            { r[columnMap[k]] = v; }
                            else if (k.match(/[a-z]+/))
                            { r[k] = v; }
                        });
                        return r;
                    });

                    if (!$.isBlank(cObj._properties.groupBy))
                    { renderGroupItems(cObj, rows, doneWithRows); }
                    else
                    {
                        var callback = _.after(rows.length, doneWithRows);
                        _.each(rows, function(r) { cObj._setRow(r, r.index, r, callback); });
                    }
                });
            }
        }
        else if ($.subKeyDefined(cObj, '_dataContext.datasetList'))
        {
            var callback = _.after(cObj._dataContext.datasetList.length, doneWithRows);
            _.each(this._dataContext.datasetList, function(ds, i)
                    { cObj._setRow(ds, i, $.extend({}, ds), callback); });
        }
        // Nothing to repeat on for row or column
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

    _setRow: function(row, index, entity, callback)
    {
        // Calculate the index in current set of rows and ignore if outside current window
        var adjIndex = index - this.position;
        if (adjIndex < 0 || adjIndex >= this.length)
            return;

        entity = entity || {};

        if ($.isBlank(entity._repeaterIndex)) { entity._repeaterIndex = index; }
        if ($.isBlank(entity._repeaterDisplayIndex)) { entity._repeaterDisplayIndex = index + 1; }
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
            if (children) {
                if (!$.isArray(children))
                    children = [ children ];
                children = properties.children = children.slice();
                for (var i = 0; i < children.length; i++)
                    children[i] = createTemplate(children[i]);
            }
            return properties;
        }
        var cloneProperties = createTemplate($.extend({},
                    this._stringSubstitute(this._properties.childProperties, entity),
                    this._cloneProperties));

        // Remove any existing row
        if (this._map[adjIndex])
        {
            if (!this._childrenDirty && this._map[adjIndex].id == cloneProperties.id)
            { return; }
            this._map[adjIndex].remove();
            this._map[adjIndex] = undefined;
        }

        cloneProperties.childContextId = row.id;

        // Create clone
        var clone = this._map[adjIndex] = new $.component.Repeater.Clone(cloneProperties);

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
                if (_.isFunction(callback)) { callback(); }
                return;
            }
        }

        // Find position for clone
        var position;
        for (var i = adjIndex + 1; !position && i < this._map.length; i++)
            position = this._map[i];

        // Insert the clone
        this._initializing = true;
        if ($.isBlank(this._realContainer))
        {
            this._realContainer = this.add(this._properties.container || {type: 'Container'});
            delete this._containerDirty;
        }
        this._realContainer.add(clone, position);
        if (_.isFunction(callback)) { callback(); }
        delete this._initializing;
    },

    _readChildren: function()
    { return this._designing ? this._super() : this._cloneProperties.children; },

    _propWrite: function(properties)
    {
        var cObj = this;
        var origCloneProps = cObj._cloneProperties;
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
    allocateIds(children);
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

    var aggCallback = _.after(groups.length, callback);
    if (groupConfig.sortAlpha)
    { groups = groups.sort(); }
    _.each(groups, function(g, i)
    { cObj._setRow({id: g}, i, {_groupValue: g, _groupItems: groupIndex[g]}, aggCallback); });
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
