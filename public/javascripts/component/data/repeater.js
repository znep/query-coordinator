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

    _refresh: function() {
        this._map = [];
        while (this.first)
            this.first.destroy();
        var view;
        if ($.cf.designing)
            // Render actual children as direct descendants
            this.add(this._cloneProperties.children);
        else if (view = (this._dataContext || {}).view) {
            // Render records
            var me = this;
            var columnMap = this.columnMap = {};
            for (var i = 0; i < view.columns.length; i++)
                columnMap[view.columns[i].id] = view.columns[i].fieldName;
            this._dataContext.view.getRows(this.position, this.length, function(rows) {
                _.each(rows, me._setRow, me);
            });
        }
    },

    _dataReady: function() {
        this._refresh();
    },

    _setRow: function(row) {
        // Calculate the index in current set of rows and ignore if outside current window
        var index = row.index - this.position;
        if (index < 0 || index >= this.length)
            return;

        // Add ID prefix so repeated components will not clash
        var prefix = this._idPrefix + row.index + '-';
        function createTemplate(properties) {
            properties = _.clone(properties);
            properties.id = prefix + properties.id;
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
        if (map[index]) {
            map[index].remove();
            map[index] = undefined;
        }

        // Create entity TODO - mapping will be unnecessary w/ SODA 2
        var entity = {};
        _.each(this.columnMap, function(to, from) {
            entity[to] = row[from];
            if (entity[to] == undefined)
                entity[to] = null;
        });
        cloneProperties.entity = entity;

        // Create clone
        var clone = map[index] = new $.component.Repeater.Clone(cloneProperties);

        // Find position for clone
        var position;
        for (i = index + 1; !position && i < map.length; i++)
            position = map[i];

        // Insert the clone
        this._initializing = true;
        this.add(clone, position);
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
