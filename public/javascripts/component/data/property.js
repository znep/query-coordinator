$.component.Component.extend('Property', {
    _render: function() {
        if (!this._super.apply(this, arguments)) { return false; }
        this._write();
        return true;
    },

    _write: function() {
        var name = this._properties.name;
        var html = name ? "{" + this._properties.name + "}" : "?";
        if (!$.cf.designing)
            html = this._stringSubstitute(html);
        this.$contents.html("<span class='dataset-property'>" + html + "</span>");
    },

    _propRead: function() {
        var result = this._super();
        result.dataset = this._properties.dataset;
        result.name = this._properties.name;
        return result;
    },

    _propWrite: function(properties) {
        this._super(properties);
        if (properties.dataset && properties.dataset != this._properties.dataset) {
            this._properties.dataset = properties.dataset;
            var changed = true;
        }
        if (properties.name && properties.name != this._properties.name) {
            this._properties.name = properties.name;
            changed = true;
        }
        if (changed)
            this._write();
    },

    edit: function() {
        this._write();
    }
});
