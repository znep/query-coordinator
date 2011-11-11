;(function($) {

$.component.Component.extend('Title', 'content', {
    configurationSchema: function()
    {
        return [
            {fields: [ {type: 'text', name: 'text', text: 'Title', required: true} ]},
            blist.configs.styles.getStyles('text', this.$title),
            blist.configs.styles.getStyles('padding', this.$title)
        ];
    },

    _initDom: function()
    {
        this._super.apply(this, arguments);
        if ($.isBlank(this.$title))
        {
            this.$contents.append($.tag({tagName: 'h2'}));
            this.$title = this.$contents.find('h2');
        }
    },

    _render: function()
    {
        if (!this._super.apply(this, arguments)) { return false; }
        this.$title.text($.isBlank(this._properties.text) ? '' : this._properties.text);
        this.$title.css(blist.configs.styles.convertProperties(this._properties));
    },

    _propWrite: function(properties)
    {
        this._super.apply(this, arguments);
        if (!_.isEmpty(properties)) { this._render(); }
    }
});

})(jQuery);
