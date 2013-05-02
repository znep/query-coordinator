// A component that supports the display of sanitized HTML.
$.component.Component.extend('Safe Html', 'none', {
    _needsOwnContext: true,

    _getAssets: function()
    {
        return {
            javascripts: [{ assets: 'sanitize-html' }, { assets: 'autolink-html' }]
        };
    },

    //Sanitizes the given HTML using a moderate whitelist.
    // Keep this in sync with SafeHtml in misc.rb!
    _sanitizeDisplayHtml: function(unsafeHtml)
    {
        return blist.util.htmlSanitizer.sanitizeHtmlPermissive(unsafeHtml);
    },

    _render: function()
    {
        if (!this._super.apply(this, arguments))
        {
            return false;
        }

        var cObj = this;
        var doRender = function()
        {
            var substitutionTarget = cObj._properties.html;
            var unsafeHtmlResult;
            var safeHtmlResult;
            var finalHtmlResult = '';
            if (!$.isBlank(substitutionTarget))
            {
                unsafeHtmlResult = cObj._stringSubstitute(substitutionTarget);
                safeHtmlResult = cObj._sanitizeDisplayHtml(unsafeHtmlResult);
                if (cObj._properties.autoLink)
                {
                    finalHtmlResult = blist.util.autolinker.autoLinkHtml(safeHtmlResult);
                }
                else
                {
                    finalHtmlResult = safeHtmlResult;
                }
            }
            cObj.$contents.html(finalHtmlResult);
        }

        if (!cObj._updateDataSource(cObj._properties, doRender))
        {
            doRender();
        }

        return true;
    },

    _propWrite: function(properties)
    {
        var cObj = this;
        cObj._super(properties);
        if (!_.isEmpty(properties))
        {
            if (!cObj._editing)
            {
                cObj._render();
            }
            else
            {
                var doEdit = function()
                {
                    cObj.edit(true);
                    cObj.editFocus(true);
                };
                if (!cObj._updateDataSource(cObj._properties, doEdit))
                {
                    doEdit();
                }
            }
        }
    },

    _valueKey: function()
    { return 'html'; },

    configurationSchema: function()
    { return {}; },

    editFocus: function(focused)
    {
        return false;
    },

    edit: function()
    {
        return false;
    }
});
