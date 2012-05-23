$.component.Component.extend('Text', 'content', {
    _init: function()
    {
        this._needsOwnContext = true;
        this._super.apply(this, arguments);
    },

    _getEditAssets: function()
    {
        return {
            javascripts: [{ assets: 'content-editable' }]
        };
    },

    _render: function()
    {
        if (!this._super.apply(this, arguments)) { return false; }

        var cObj = this;
        var doRender = function()
        {
            var html = cObj._properties.html;
            if (!$.isBlank(html) && !cObj._editing)
            { html = cObj._stringSubstitute(html); }
            if (cObj._properties.isPlainText)
            { html = html.plainTextToHtml(); }
            cObj.$contents.html(html);

            cObj.$contents.css(blist.configs.styles.convertProperties(cObj._properties));
        }
        if (!cObj._updateDataSource(cObj._properties, doRender))
        { doRender(); }

        return true;
    },

    _propWrite: function(properties)
    {
        this._super(properties);
        if (!_.isEmpty(properties)) { this._render(); }
    },

    _valueKey: function()
    { return 'html'; },

    editFocus: function(focused)
    {
        if (!this._super.apply(this, arguments)) { return false; }
        if (focused) return;

        var newHtml = this.$contents.text();
        if (newHtml != this._properties.html)
        { this._updatePrimaryValue(newHtml); }
    },

    edit: function()
    {
        var wasEditable = this._editing;
        if (!this._super.apply(this, arguments)) { return false; }

        this.$contents.editable({ edit: this._editing });
        this.$contents.toggleClass('socrata-cf-mouse', this._editing);

        if (this._editing)
        {
            // Install raw template for editing
            if (!wasEditable)
                this.$contents.text(this._properties.html);
        }
        else if (wasEditable)
        { this._render(); }
    }
});
