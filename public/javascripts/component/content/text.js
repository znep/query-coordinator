$.component.Component.extend('Text', 'content', {
    _getAssets: function()
    {
        return {
            javascripts: [{ assets: 'content-editable' }]
        };
    },

    _render: function() {
        if (!this._super.apply(this, arguments)) { return false; }
        var html = this._properties.html;
        if (html)
            this.$contents.html(this._template(html));
        return true;
    },

    _propRead: function() {
        var result = this._super();
        result.html = this._properties.html;
        return result;
    },

    _propWrite: function(properties) {
        this._super(properties);
        var html = properties.html;
        if (html !== undefined) {
            this._properties.html = html;
            if ($(this.dom).attr('contentEditable') != 'true')
                html = this._template(html);
            this.$contents.html(html);
        }
    },

    design: function(editable) {
        var wasEditable = this.$contents.attr('contentEditable') == 'true';

        this.$contents.editable({ edit: editable });
        this.$contents.toggleClass('socrata-cf-mouse', editable);

        if (editable) {
            // Install raw template for editing
            if (!wasEditable)
                this.$contents.html(this._properties.html);
        } else if (wasEditable) {
            var newHtml = this.$contents[0].innerHTML;
            if (newHtml != this._properties.html)
                $.cf.edit.execute('properties', { componentID: this.id, properties: { html: newHtml }});
            else
                this.$contents.html(this._template(this._properties.html));
        }
    }
});
