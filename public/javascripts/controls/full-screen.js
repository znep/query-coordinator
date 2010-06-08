(function($)
{
    /* This plugin is designed to take a container with children that should
     * expand to fill the page, minus all of its siblings.  The container may
     * have mulitple switchable panes, each of which fills the height.  So all
     * children will actually be set to fill the height, not the container iteself.
     * Additionally, each of these children may have a component (selectable
     * via a parameter) that should fill it when visible. */
    $.fn.fullScreen = function(options)
    {
        // Check if object was already created
        var fullScreen = $(this[0]).data("fullScreen");
        if (!fullScreen)
        {
            fullScreen = new fullScreenObj(options, this[0]);
        }
        return fullScreen;
    };

    var fullScreenObj = function(options, dom)
    {
        this.settings = $.extend({}, fullScreenObj.defaults, options);
        this.currentDom = dom;
        this.init();
    };

    $.extend(fullScreenObj,
    {
        defaults:
        {
            fullHeightSelector: '.fullHeight'
        },

        prototype:
        {
            init: function ()
            {
                var currentObj = this;
                var $domObj = currentObj.$dom();
                $domObj.data("fullScreen", currentObj);

                currentObj.adjustSize();
                $(window).resize(function() { currentObj.adjustSize(); });
            },

            $dom: function()
            {
                if (!this._$dom)
                { this._$dom = $(this.currentDom); }
                return this._$dom;
            },

            adjustSize: function()
            {
                var fsObj = this;

                var targetHeight = $(window).height();

                fsObj.$dom().parents().andSelf().each(function()
                {
                    var $t = $(this);
                    targetHeight -= $t.outerHeight() - $t.height();
                });

                fsObj.$dom().siblings(':visible').each(function()
                {
                    var $t = $(this);
                    if ($t.css('position') != 'fixed' &&
                        $t.css('position') != 'absolute')
                    { targetHeight -= $t.outerHeight(true); }
                });

                fsObj.$dom().children().height(targetHeight).each(function()
                {
                    var $t = $(this);
                    if (!$t.is(':visible')) { return; }

                    $t.find(fsObj.settings.fullHeightSelector + ':visible')
                        .height($t.innerHeight())
                        .resize();
                    $t.resize();
                });
            }
        }
    });

})(jQuery);
