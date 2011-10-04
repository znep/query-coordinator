$.component.Container.extend('Repeater', 'content', {
    position: 0,
    length: 100,

    _init: function(properties) {
        this._super(properties);

        this._updateTemplate();
        this._clones = new $.comp.Container({ id: this.id + '-clones' });
        this._map = [];
    },

    _render: function() {
        // Bypass container's DOM management
        $.component.Component.prototype._render.call(this);

        var cloneDom = document.createElement('div');
        cloneDom.id = this._clones.id;
        this.dom.appendChild(cloneDom);

        this._clones.dom = cloneDom;
        this._clones._render();
    },

    startLoading: function() {
    },

    finishLoading: function() {
    },

    _dataReady: function() {
        var me = this;
        this._view.getRows(this.position, this.length, function(rows) {
            _.each(rows, me._setRow, me);
        });
    },

    _setRow: function(row) {
        // Calculate the index in current set of rows and ignore if outside current window
        var index = row.index - this.position;
        if (index < 0 || index >= this.length)
            return;

        // Add ID prefix so repeated components will not clash
        var prefix = this.id + '-' + row.index + '-';
        function createTemplate(properties) {
            properties = _.clone(properties);
            properties.id = prefix + properties.id;
            var children = properties.children;
            if (children) {
                children = properties.children = properties.children.slice();
                for (var i = 0; i < children.length; i++)
                    children[i] = createTemplate(children[i]);
            }
            return properties;
        }
        var template = createTemplate(this._template);

        // Remove any existing row
        var map = this._map;
        if (map[index]) {
            map[index].remove();
            map[index] = undefined;
        }

        // Create clone
        template.entity = row;
        var clone = map[index] = $.component.create(template);

        // Find position for clone
        var position;
        for (var i = index + 1; !position && i < map.length; i++)
            position = map[i];

        // Insert the clone
        this._clones.add(clone, position);
    },

    _moveChildDom: function(child) {
        this._updateTemplate();
        // TODO -- update repeated -- do not call super
    },

    _removeChildDom: function(child) {
        this._updateTemplate();
        // TODO -- update repeated -- do not call super
    },

    // Update object template used to create repeated children
    _updateTemplate: function() {
        var template = $.component.Container.prototype._propRead.call(this);
        template.type = 'container';
        template.id = 'clone';
        this._template = template;
    }
});
