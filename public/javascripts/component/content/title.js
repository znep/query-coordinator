;(function($) {

$.component.Component.extend('Title', 'content', {
    _needsOwnContext: true,

    _initDom: function()
    {
        this._super.apply(this, arguments);
        if ($.isBlank(this.$title))
        {
            var tag = this._properties.tagName || 'h2';
            this.$title = this.$contents.children(tag);
            if (this.$title.length < 1)
            {
                this.$contents.empty().append($.tag({tagName: tag}));
                this.$title = this.$contents.children(tag);
            }
        }
    },

    _getEditAssets: function()
    {
        return {
            javascripts: [{ assets: 'content-editable' }]
        };
    },

    _render: function()
    {
        var cObj = this;
        if (!cObj._super.apply(cObj, arguments)) { return false; }

        var doRender = function()
        {
            var t = $.isBlank(cObj._properties.text) ? '' : cObj._properties.text;
            cObj.$title.text(cObj._stringSubstitute(t));
        }
        if (!cObj._updateDataSource(cObj._properties, doRender))
        { doRender(); }
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

    design: function()
    {
        this._super.apply(this, arguments);
        this._render();
    },

    _valueKey: function()
    { return 'text'; },

    configurationSchema: function()
    { return { schema: [{ fields: [$.extend($.cf.contextPicker(), {required: false})] }] }; },

    editFocus: function(focused)
    {
        if (!this._super.apply(this, arguments)) { return false; }
        if (focused) { return true; }

        $.cf.extractProperties(this.$title);
        this._updatePrimaryValue(this.$title.text());
        return true;
    },

    edit: function()
    {
        var cObj = this;
        var wasEditable = cObj._editing;
        if (!cObj._super.apply(cObj, arguments)) { return false; }

        cObj.$title.toggleClass('socrata-cf-mouse', cObj._editing);

        // Animate height
        var origHeight = cObj.$dom.height();

        if (cObj._editing)
        {
            // Install raw template for editing
            if (!wasEditable)
            {
                cObj.$title.text(cObj._properties.text);
                $.cf.enhanceProperties(cObj.$title);
            }
        }
        else if (wasEditable)
        { cObj._render(); }

        var newHeight = cObj._getNumericalPropertyWithFallback('height', cObj.$dom.height());
        cObj.$dom.height(origHeight);
        cObj.$dom.animate({height: newHeight}, 'slow', function() { cObj.$dom.height(cObj._getNumericalPropertyWithFallback('height', '')); });
    },

    asString: function() {
        return this._stringSubstitute(this._properties.text);
    }
});

})(jQuery);
