;(function($) {

$.component.Component.extend('Title', 'content', {
    configurationSchema: function()
    {
        if ($.isBlank(this._cachedTextStyle) && !$.isBlank(this.$title))
        {
            this._cachedTextStyle = blist.configs.styles.getStyles('text', this.$title),
            this._cachedPaddingStyle = blist.configs.styles.getStyles('padding', this.$title)
        }
        return [this._cachedTextStyle, this._cachedPaddingStyle];
    },

    _initTitle: function()
    {
        this.$contents.empty().append($.tag({tagName: 'h2'}));
        this.$title = this.$contents.find('h2');
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
        var doRender = function()
        {
            if (cObj.$title) {
              cObj.$title.text($.isBlank(cObj._properties.text) ? '' : cObj._template(cObj._properties.text));
              cObj.$title.css(blist.configs.styles.convertProperties(cObj._properties));
            } else if (cObj.$edit) {
              cObj.$edit.css(blist.configs.styles.convertProperties(cObj._properties));
            }
        }
        if (!cObj._updateDataSource(cObj._properties, doRender))
        { doRender(); }
    },

    _propWrite: function(properties)
    {
        this._super(properties);
        var text = properties.text;
        if (text !== undefined && this.$title) {
            this.$title.text(text);
        }
        if (!_.isEmpty(properties)) { this._render(); }
    },

    edit: function(editable) {
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
            var newText = this.$edit.value();
            if (newText != this._properties.text)
              $.cf.edit.execute('properties', { componentID: this.id, properties: { text: newText }});

            this.$contents.empty();
            delete this.$edit;
            this._initTitle();
            this._render();
        }
    }
});

})(jQuery);
