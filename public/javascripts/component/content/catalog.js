;(function($) {

$.component.Component.extend('Catalog', 'data', {
    _needsOwnContext: true,

    _initDom: function()
    {
        var cObj = this;
        cObj._super.apply(cObj, arguments);
        if (!cObj._$iframe)
        {
            cObj._$iframe = cObj.$contents.children('iframe');
            if (cObj._$iframe.length < 1)
            {
                cObj._$iframe = $.tag({ tagName: 'iframe', frameborder: 0, title: 'Catalog' });
                cObj.$contents.append(cObj._$iframe);
            }
            cObj._$iframe.attr('scrolling', 'no');
            cObj._$iframe.removeAttr('width');
            cObj._$iframe.removeAttr('height');
            cObj._$iframe.width(cObj.$contents.width());
            cObj._$iframe.bind('load', function()
            {
                var h;
                if (this.contentDocument)
                { h = this.contentDocument.body.offsetHeight; }
                else
                { h = this.contentWindow.document.body.scrollHeight; }
                cObj._$iframe.height(h);
            });
        }
    },

    _render: function()
    {
        if (!this._super.apply(this, arguments)) { return false; }

        var props = this._stringSubstitute(this._properties);
        var params = {};
        if (!_.isEmpty(props.defaults)) { params.defaults = props.defaults; }
        if (!_.isEmpty(props.disabledItems))
        { params.disable = $.arrayToObjKeys(props.disabledItems, true); }
        if (!_.isEmpty(props.disabledSections))
        { params.suppressed_facets = $.arrayToObjKeys(props.disabledSections, true); }
        this._$iframe.attr('src', '/browse/embed?' + $.param(params));
        return true;
    },

    _arrange: function()
    {
        this._super.apply(this, arguments);
        this._$iframe.width(this.$contents.width());
    }
});

})(jQuery);
