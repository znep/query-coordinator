(function($) {

$.component.Component.extend('Print', 'actions', {
    _initDom: function()
    {
        var cObj = this;
        cObj._super.apply(cObj, arguments);
        if ($.isBlank(cObj.$link))
        {
            cObj.$link = cObj.$contents.children('a');
            if (cObj.$link.length < 1)
            {
                cObj.$link = $.tag({tagName: 'a', href: '#print'});
                cObj.$contents.append(cObj.$link);
            }

            cObj.$link.off('.printButton');
            cObj.$link.on('click.printButton', function(e)
            {
                e.preventDefault();
                // Trigger all existing waypoints to make sure the whole page is visible.
                $.waypoints('trigger');
                var checkPrint = function()
                {
                    if ($.component.isLoading())
                    { setTimeout(checkPrint, 3000); }
                    else
                    {
                        var $wrapper = $('.siteOuterWrapper');
                        var doPrint = function()
                        {
                            if ($.component.isLoading())
                            { setTimeout(doPrint, 1000); }
                            else
                            {
                                window.print();
                                $wrapper.width('');
                                $(window).resize();
                            }
                        };
                        if ($.browser.webkit || $.browser.mozilla)
                        {
                            // This gets to a reasonable default that fits the page
                            // (at least in Chrome & Safari on OS X)
                            $wrapper.width('24cm');
                            $(window).resize();
                            setTimeout(doPrint, 500);
                        }
                        else
                        { doPrint(); }
                    }
                };
                setTimeout(checkPrint, 500);
            });
        }
    },

    _getAssets: function()
    {
        return { translations: [ 'dataslate.component.print' ] };
    },

    _render: function()
    {
        if (!this._super.apply(this, arguments)) { return false; }
        doRender(this);
    }
});

var doRender = function(cObj)
{
    cObj.$link.text(cObj._stringSubstitute(cObj._properties.text || $.t('dataslate.component.print.print')));
    cObj.$link.attr('title', cObj._stringSubstitute(cObj._properties.title || $.t('dataslate.component.print.print_this_page')));
    cObj.$link.toggleClass('button', !cObj._properties.notButton);
};

})(jQuery);
