$.component.Component.extend('Text', 'content', {
    _needsOwnContext: true,

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
            if (!$.isBlank(html))
            { html = cObj._stringSubstitute(html); }
            if (cObj._properties.isPlainText)
            { html = html.plainTextToHtml(); }
            cObj.$contents.html(html);
        }
        if (!cObj._updateDataSource(cObj._properties, doRender))
        { doRender(); }

        return true;
    },

    _propWrite: function(properties)
    {
        var cObj = this;
        cObj._super(properties);
        if (!_.isEmpty(properties))
        {
            if (!cObj._editing)
            { cObj._render(); }
            else
            {
                var doEdit = function()
                {
                    cObj.edit(true);
                    cObj.editFocus(true);
                };
                if (!cObj._updateDataSource(cObj._properties, doEdit))
                { doEdit(); }
            }
        }
    },

    _valueKey: function()
    { return 'html'; },

    configurationSchema: function()
    { return { schema: [{ fields: [$.extend($.cf.contextPicker(), {required: false})] }] }; },

    editFocus: function(focused)
    {
        if (!this._super.apply(this, arguments)) { return false; }
        if (focused) { return true; }

        $.cf.extractProperties(this.$contents);
        var contHtml = $.htmlStrip(this.$contents.html());
        // Strip out straight &nbsp;, since the browser inserted that
        // (a manually entered nbsp will return as &amp;nbsp;)
        contHtml = contHtml.replace(/&nbsp;/g, ' ');
        this._updatePrimaryValue($.htmlUnescape(contHtml));
        return true;
    },

    edit: function()
    {
        var cObj = this;
        var wasEditable = cObj._editing;
        if (!cObj._super.apply(cObj, arguments)) { return false; }

        cObj.$contents.toggleClass('socrata-cf-mouse', cObj._editing);

        // Animate height
        var origHeight = cObj.$dom.height();

        if (cObj._editing)
        {
            // Install raw template for editing
            if (!wasEditable)
            {
                cObj.$contents.html($.htmlEscape(cObj._properties.html));
                $.cf.enhanceProperties(cObj.$contents);
            }
        }
        else if (wasEditable)
        { cObj._render(); }

        var newHeight = cObj._properties.height || cObj.$dom.height();
        cObj.$dom.height(origHeight);
        cObj.$dom.animate({height: newHeight}, 'slow', function() { cObj.$dom.height(cObj._properties.height || ''); });
    }
});
