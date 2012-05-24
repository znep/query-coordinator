;(function($) {

$.component.Component.extend('Title', 'content', {
    _init: function()
    {
        this._needsOwnContext = true;
        this._super.apply(this, arguments);
    },

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
            cObj.$title.css(blist.configs.styles.convertProperties(cObj._properties));
        }
        if (!cObj._updateDataSource(cObj._properties, doRender))
        { doRender(); }
    },

    _propWrite: function(properties)
    {
        this._super(properties);
        if (!_.isEmpty(properties)) { this._render(); }
    },

    design: function()
    {
        this._super.apply(this, arguments);
        this._render();
    },

    _valueKey: function()
    { return 'text'; },

    editFocus: function(focused)
    {
        if (!this._super.apply(this, arguments)) { return false; }
        if (focused) { return true; }

        $.cf.extractProperties(this.$title);
        this._updatePrimaryValue(this.$title.text());
    },

    edit: function()
    {
        var wasEditable = this._editing;
        if (!this._super.apply(this, arguments)) { return false; }

        this.$title.editable({ edit: this._editing });
        this.$title.toggleClass('socrata-cf-mouse', this._editing);

        if (this._editing)
        {
            // Install raw template for editing
            if (!wasEditable)
            {
                this.$title.text(this._properties.text);
                $.cf.enhanceProperties(this.$title);
            }
        }
        else if (wasEditable)
        { this._render(); }
    },

    asString: function() {
        return this._stringSubstitute(this._properties.text);
    }
});

})(jQuery);
