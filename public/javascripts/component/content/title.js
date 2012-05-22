;(function($) {

$.component.Component.extend('Title', 'content', {
    _init: function()
    {
        this._needsOwnContext = true;
        this._super.apply(this, arguments);
    },

    _initTitle: function()
    {
        var cObj = this,
            tag = cObj._properties.tagName || 'h2';
        cObj.$title = cObj.$contents.find(tag);
        if (cObj.$title.length < 1)
        {
            cObj.$contents.empty().append($.tag({tagName: tag}));
            cObj.$title = cObj.$contents.find(tag);
        }
    },

    _initDom: function()
    {
        this._super.apply(this, arguments);
        if ($.isBlank(this.$title) && $.isBlank(this.$edit))
        { this._initTitle(); }
    },

    _render: function()
    {
        var cObj = this;
        if (!cObj._super.apply(cObj, arguments)) { return false; }

        var doRender = function()
        {
            if (!cObj._editing)
            {
                var t = $.isBlank(cObj._properties.text) ? '' : cObj._properties.text;
                cObj.$title.text(cObj._stringSubstitute(t));
                cObj.$title.css(blist.configs.styles.convertProperties(cObj._properties));
            }
            else
            { cObj.$edit.css(blist.configs.styles.convertProperties(cObj._properties)); }
        }
        if (!cObj._updateDataSource(cObj._properties, doRender))
        { doRender(); }
    },

    _propWrite: function(properties)
    {
        this._super(properties);
        if (!_.isEmpty(properties)) { this._render(); }
    },

    // Allow blist editors to be used
    _supportsCustomEditors: function()
    { return true; },

    _customEditFinished: function(editor)
    {
        this._initTitle();
        this._render();
    },

    design: function()
    {
        this._super.apply(this, arguments);
        this._render();
    },

    _valueKey: function()
    { return 'text'; },

    editFocus: function(focused) {
        if (!this._super.apply(this, arguments)) { return false; }

        // don't care about focusin
        if (focused) return;

        var newText = this.$edit.value();
        if (newText != this._properties.text)
            this._updatePrimaryValue(newText);
    },

    edit: function()
    {
        var wasEditable = this._editing;
        if (!this._super.apply(this, arguments)) { return false; }

        this.$contents.toggleClass('socrata-cf-mouse', this._editing);
        this.$contents.data('editing', this._editing);

        if (this._editing)
        {
            if (!wasEditable)
            {
                this.$edit = $.tag({
                    tagName: 'input', type: 'text',
                    'class': 'titleInput',
                    name: 'input_' + this.id,
                    value: this._properties.text
                });
                this.$contents.empty().append(this.$edit);
                delete this.$title;
            }
        }
        else if (wasEditable)
        {
            this.$contents.empty();
            delete this.$edit;
            this._customEditFinished();
        }
    },

    asString: function() {
        return this._stringSubstitute(this._properties.text);
    }
});

})(jQuery);
