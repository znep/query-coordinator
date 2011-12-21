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
        var cObj = this;
        if (!cObj._super.apply(cObj, arguments)) { return false; }
        var doRender = function()
        {
            cObj.$title.text($.isBlank(cObj._properties.text) ? '' : cObj._template(cObj._properties.text));
            cObj.$title.css(blist.configs.styles.convertProperties(cObj._properties));
        }
        if (!cObj._updateDataSource(cObj._properties, doRender))
        { doRender(); }
    },

    _propWrite: function(properties)
    {
        this._super.apply(this, arguments);
        if (!_.isEmpty(properties)) { this._render(); }
    }
});

})(jQuery);
