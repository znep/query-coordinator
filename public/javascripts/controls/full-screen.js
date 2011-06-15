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

                targetHeight -= siblingsHeight(fsObj.$dom());

                fsObj.$dom().children().height(targetHeight).each(function()
                {
                    var $t = $(this);
                    if (!$t.is(':visible')) { return; }

                    // IE7 would hang/take a long time switching render types
                    // if the selector + :visible was run in one shot
                    $t.find(fsObj.settings.fullHeightSelector).filter(':visible')
                        .each(function()
                        {
                            var $f = $(this);
                            // If we have multiple fullHeight siblings, give the first one
                            // a bit more than an even share; then fit the rest in evenly
                            var $fh = $f.siblings(fsObj.settings.fullHeightSelector)
                                .filter(':visible').add($f);
                            var multiplier = 1;
                            if ($fh.length > 1)
                            {
                                var adjFactor = 1.3333;
                                multiplier = $fh.index($f) == 0 ? adjFactor :
                                    ($fh.length - adjFactor) / ($fh.length - 1);
                            }
                            $f.height(Math.floor(($f.parent().innerHeight() - siblingsHeight($f)) *
                                multiplier / $fh.length));
                        });
                });
            }
        }
    });

    var siblingsHeight = function($item)
    {
        var h = 0;
        $item.siblings(':visible').each(function()
        {
            var $t = $(this);
            if ($t.hasClass('fullHeight')) { return; }
            if ($t.css('position') != 'fixed' &&
                $t.css('position') != 'absolute')
            { h += $t.outerHeight(true); }
        });
        return h;
    };

})(jQuery);
