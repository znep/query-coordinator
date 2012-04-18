(function($) {

$.component.Container.extend('Repeater', 'content', {
    position: 0,
    length: 100,

    _init: function(properties) {
        this._delayUntilVisible = true;

        // Take my children and give them to a "clone" template that will repeat once for each object
        var children = properties.children || [];
        delete properties.children;

        // Normal object setup
        this._super(properties);

        this._cloneProperties = {
            id: 'clone',
            children: children,
            // TODO: Get rid of these out of templates so we can remove them
            htmlClass: properties.childHtmlClass,
            styles: properties.childStyles
        };

        // Ensure that all descendants have an ID.  This ID is prefixed during object rendering.
        function allocateIds(children) {
            for (var i = 0; i < children.length; i++) {
                var child = children[i];
                if (child.id == undefined)
                    child.id = $.component.allocateId();
                if (child.children)
                    allocateIds(child.children);
            }
        }
        allocateIds(children);

        // Record keeping preparation
        this._map = [];

        this._idPrefix = this.id + '-';
        if ($.subKeyDefined(this, '_properties.container.id'))
        {
            this._properties.container.id = (this._properties.parentPrefix || '') +
                this._properties.container.id;
        }
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
        if ($.isBlank(this._realContainer) && this._properties.container)
        {
            this._realContainer = this.add(this._properties.container);
        }
    },

    design: function() {
        var cObj = this;
        // If we were designing, update from the edited config
        if (this._designing)
        {
            this._cloneProperties.children = this._readChildren();
        }

        this._super.apply(this, arguments);
        this._delayUntilVisible = !this._designing;
        if (this._designing)
        {
            // If we're designing, make sure we're fully rendered
            this._render();
        }

        // If we're entering design mode for the first time, make sure
        // our data context is properly configured
        var finished = function()
        {
            cObj._refresh();
        };

        if (!$.isBlank(cObj._properties.contextId) && $.isBlank(cObj._dataContext))
        {
            cObj._updateDataSource(cObj._properties, finished);
        }
        else
        {
            finished();
        }
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
        { dc.dataset.bind('query_change', function() { cObj._refresh(); }, this); }
    },

    _refresh: function()
    {
        var cObj = this;
        cObj._map = [];
        if (!$.isBlank(this._realContainer))
        {
            cObj._realContainer.destroy();
            delete cObj._realContainer;
        }
        while (cObj.first)
        { cObj.first.destroy(); }

        var doneWithRows = function()
        {
            _.defer(function()
            {
                var newViewPercent = getViewPercent(cObj);
                if (cObj._viewPercent && newViewPercent != cObj._viewPercent)
                { $(window).scrollTop(cObj._viewPercent * cObj.$dom.height() + cObj.$dom.offset().top); }
                $.component.sizeRenderRefresh();
            });
        };

        var view;
        if (cObj._designing)
        {
            // Render actual children as direct descendants
            cObj.add(cObj._cloneProperties.children);
        }
        else if (_.isArray(cObj._dataContext))
        {
            var callback = _.after(cObj._dataContext.length, doneWithRows);
            _.each(cObj._dataContext, function(di, i) { cObj._setRow(di, i, di, callback); });
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
            _.each(this._dataContext.datasetList, function(ds, i) { cObj._setRow(ds, i, ds, callback); });
        }
    },

    _render: function()
    {
        if (!this._super.apply(this, arguments)) { return false; }
        var cObj = this;

        // Only do this on first load
        if ($.isBlank(cObj._viewPercent))
        { cObj._viewPercent = getViewPercent(cObj); }

        var doRender = function()
        {
            if (!$.isBlank(cObj._tempHeight))
            {
                cObj.$dom.css('min-height', '');
                // Hack: This triggers a re-show of items
                $(window).scroll();
            }
            if (!$.isBlank(cObj._realContainer)) { cObj._realContainer._render(); }
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
        // Add ID prefix so repeated components will not clash
        var prefix = this._idPrefix + index + '-';
        function createTemplate(properties) {
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
        var map = this._map;
        if (map[adjIndex]) {
            map[adjIndex].remove();
            map[adjIndex] = undefined;
        }

        cloneProperties.entity = entity;
        cloneProperties.childContextId = row.id;

        // Create clone
        var clone = map[adjIndex] = new $.component.Repeater.Clone(cloneProperties);

        // Terrible hack; but core server doesn't support regexes in queries,
        // so this is the easiest way to skip some rows. This also doesn't
        // handle the fact that the number of rendered rows doesn't match up
        // directly with the position & length anymore; so it will probably not
        // behave properly if more than a page of data is present
        if (!$.isBlank(this._properties.valueRegex))
        {
            var r = new RegExp(this._properties.valueRegex.regex);
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
        for (var i = adjIndex + 1; !position && i < map.length; i++)
            position = map[i];

        // Insert the clone
        this._initializing = true;
        if ($.isBlank(this._realContainer))
        { this._realContainer = this.add(this._properties.container || {type: 'Container'}); }
        this._realContainer.add(clone, position);
        if (_.isFunction(callback)) { callback(); }
        delete this._initializing;
    },

    _readChildren: function() {
        if (this._designing)
            return this._super();
        return this._cloneProperties.children;
    }
});

$.component.Repeater.Clone = $.component.Container.extend({
    // No special behavior for clones at the moment
    _persist: false
});

var getViewPercent = function(cObj)
{
    return Math.max(0, $(window).scrollTop() - cObj.$dom.offset().top) / cObj.$dom.height();
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
        if ($.isBlank(groupIndex[group]))
        {
            groups.push(group);
            groupIndex[group] = [item];
        }
        else
        { groupIndex[group].push(item); }
    });

    var aggCallback = _.after(groups.length, callback);
    _.each(groups, function(g, i)
    { cObj._setRow({id: g}, i, {_groupValue: g, _groupItems: groupIndex[g]}, aggCallback); });
};

})(jQuery);
