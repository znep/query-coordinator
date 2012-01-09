;(function($) {

$.component.Component.extend('Title', 'content', {
    configurationSchema: function()
    {
        return [this._cachedTextStyle, this._cachedPaddingStyle];
    },

    _initTitle: function()
    {
        var cObj = this;
        cObj.$contents.empty().append($.tag({tagName: 'h2'}));
        cObj.$title = cObj.$contents.find('h2');
    },

    _initDom: function()
    {
        this._super.apply(this, arguments);
        if ($.isBlank(this.$title) && $.isBlank(this.$edit))
        {
            this._initTitle();
        }
    },

    _render: function()
    {
        var cObj = this;
        if (!cObj._super.apply(cObj, arguments)) { return false; }
        if ($.isBlank(cObj._cachedTextStyle) && !$.isBlank(cObj.$title))
        {
            cObj._cachedTextStyle = blist.configs.styles.getStyles('text', cObj.$title),
            cObj._cachedPaddingStyle = blist.configs.styles.getStyles('padding', cObj.$title)
        }

        var doRender = function()
        {
            if (cObj.$title)
            {
                var t = $.isBlank(cObj._properties.text) ? '' : cObj._properties.text;
                cObj.$title.text(cObj._designing ? t : cObj._stringSubstitute(t));
                cObj.$title.css(blist.configs.styles.convertProperties(cObj._properties));
            }
            else if (cObj.$edit)
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

    edit: function(editable) {
        if (!this._super.apply(this, arguments)) { return false; }
        var wasEditable = this.$contents.data('editing');

        this.$contents.toggleClass('socrata-cf-mouse', editable);
        this.$contents.data('editing', editable);

        if (editable) {
            if (!wasEditable) {
                this.$edit = $.tag({
                    tagName: 'input', type: 'text',
                    'class': 'titleInput',
                    value: this._properties.text
                });
                this.$contents.empty().append(this.$edit);
                delete this.$title;
            }
        }
        else if (wasEditable) {
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
