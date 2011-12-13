$.component.Component.extend('Text', 'content', {
    _getAssets: function()
    {
        return {
            javascripts: [{ assets: 'content-editable' }]
        };
    },

    _render: function() {
        if (!this._super.apply(this, arguments)) { return false; }

        var cObj = this;
        var doRender = function()
        {
            var html = cObj._properties.html;
            if (!$.isBlank(html) && cObj.$dom.attr('contentEditable') != 'true')
            { html = cObj._template(html); }
            if (cObj._properties.isPlainText)
            { html = html.plainTextToHtml(); }
            cObj.$contents.html(html);
            cObj.$contents.css(blist.configs.styles.convertProperties(cObj._properties));
        }
        if (!$.isBlank(cObj._properties.contextId))
        { cObj._updateDataSource(cObj._properties, doRender); }
        else { doRender(); }

        return true;
    },

    _propWrite: function(properties) {
        this._super(properties);
        if (!_.isEmpty(properties)) { this._render(); }
    },

    edit: function(editable) {
        if (!this._super.apply(this, arguments)) { return false; }
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
