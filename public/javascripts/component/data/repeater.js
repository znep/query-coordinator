$.component.Container.extend('Repeater', 'content', {
    position: 0,
    length: 100,

    _init: function(properties) {
        // Take my children and give them to a "clone" template that will repeat once for each object
        var children = properties.children || [];
        this._cloneProperties = {
            id: 'clone',
            children: children
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
        delete properties.children;

        // Normal object setup
        this._super(properties);

        // Record keeping preparation
        this._map = [];

        this._idPrefix = this.id + '-';
    },

    design: function(design) {
        this._super();
        if (this._designing)
            this._cloneProperties.children = this._readChildren();
        this._designing = design;
        this._refresh();
    },

    _refresh: function()
    {
        var cObj = this;
        this._map = [];
        while (this.first)
            this.first.destroy();
        delete this._realContainer;

        var view;
        if ($.cf.designing)
            // Render actual children as direct descendants
            this.add(this._cloneProperties.children);
        else if (view = (this._dataContext || {}).dataset)
        {
            if (this._properties.repeaterType == 'column')
            {
                _.each(cObj._dataContext.dataset.visibleColumns, function(c, i)
                {
                    var success = _.all(cObj._template(cObj._properties.excludeFilter,
                            cObj._dataContext.dataset), function(v, k)
                        { return !_.include($.makeArray(v), $.deepGetStringField(c, k)); }) &&
                        ($.isBlank(cObj._properties.includeFilter) ? true :
                                   _.any(cObj._template(cObj._properties.includeFilter,
                                           cObj._dataContext.dataset), function(v, k)
                                       { return _.include($.makeArray(v), $.deepGetStringField(c, k)); }));
                    if (success) { cObj._setRow(cObj._dataContext, i, {column: c}); }
                });
            }
            else
            {
                // Render records
                var columnMap = this.columnMap = {};
                for (var i = 0; i < view.columns.length; i++)
                    columnMap[view.columns[i].id] = view.columns[i].fieldName;
                this._dataContext.dataset.getRows(this.position, this.length, function(rows) {
                    _.each(rows, function(r) { cObj._setRow(r, r.index); });
                });
            }
        }
        else if ($.subKeyDefined(this, '_dataContext.datasetList'))
        {
            _.each(this._dataContext.datasetList, function(ds, i) { cObj._setRow(ds, i); });
        }
    },

    _dataReady: function() {
        this._refresh();
    },

    _setRow: function(row, index, entity)
    {
        // Calculate the index in current set of rows and ignore if outside current window
        var adjIndex = index - this.position;
        if (adjIndex < 0 || adjIndex >= this.length)
            return;

        // Add ID prefix so repeated components will not clash
        var prefix = this._idPrefix + index + '-';
        function createTemplate(properties) {
            properties = _.clone(properties);
            properties.id = prefix + (properties.id || (properties.id = $.component.allocateId()));
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
        var cloneProperties = createTemplate(this._cloneProperties);

        // Remove any existing row
        var map = this._map;
        if (map[adjIndex]) {
            map[adjIndex].remove();
            map[adjIndex] = undefined;
        }

        // Create entity TODO - mapping will be unnecessary w/ SODA 2
        entity = entity || {};
        _.each(this.columnMap, function(to, from) {
            entity[to] = row[from];
            if (entity[to] == undefined)
                entity[to] = null;
        });
        cloneProperties.entity = entity;
        cloneProperties.childContextId = row.id;

        // Create clone
        var clone = map[adjIndex] = new $.component.Repeater.Clone(cloneProperties);

        // Find position for clone
        var position;
        for (var i = adjIndex + 1; !position && i < map.length; i++)
            position = map[i];

        // Insert the clone
        this._initializing = true;
        if ($.isBlank(this._realContainer))
        { this._realContainer = this.add(this._properties.container || {type: 'Container'}); }
        this._realContainer.add(clone, position);
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
});
