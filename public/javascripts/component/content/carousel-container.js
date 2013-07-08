;(function($) {

$.component.PagedContainer.extend('Carousel', 'none', {//'content', {
    pause: function()
    {
        this._paused = true;
        this._cancelSwitch();
    },

    resume: function()
    {
        delete this._paused;
        this._startSwitch();
    },

    _initDom: function()
    {
        var cObj = this;
        cObj._super.apply(cObj, arguments);
        cObj.$dom.hover(function() { if (!cObj._properties.forceSwitch) { cObj.pause(); } },
            function() { if (!cObj._properties.forceSwitch) { cObj.resume(); } });
    },

    _cancelSwitch: function()
    {
        if (!$.isBlank(this._switchTimeout))
        {
            clearTimeout(this._switchTimeout);
            delete this._switchTimeout;
        }
    },

    _startSwitch: function()
    {
        var cObj = this;
        if (!cObj._paused && _.isNumber(cObj._properties.switchInterval) && $.isBlank(cObj._switchTimeout))
        {
            cObj._switchTimeout =
                setTimeout(function() { cObj.viewNext(); }, cObj._properties.switchInterval);
        }
    },

    _getContainer: function()
    {
        var ct = $.tag({tagName: 'div', 'class': 'component-Carousel-container'});
        this.$contents.append(ct);
        return ct;
    },

    _hidePage: function(page)
    {
        var cObj = this;
        if (page.$dom.is(':visible') && $.support.svg)
        {
            var savedSuper = cObj._super;
            return function(doAnimate)
            {
                if (doAnimate)
                {
                    page.$dom.css({width: cObj.$ct.width(), position: 'absolute', left: 0});
                    page.$dom.animate({left: -cObj.$ct.width()}, 1000, function()
                        {
                            page.$dom.css({position: '', width: ''});
                            savedSuper(page);
                            cObj._startSwitch();
                        });
                }
                else
                {
                    savedSuper(page);
                    cObj._startSwitch();
                }
            }
        }
        else
        { this._super(page); }
    },

    _showPage: function(page, finalCallback)
    {
        var cObj = this;
        var firstLoad = !page._rendered;

        if (!$.isBlank(page.$dom)) { page.$dom.stop(); }
        cObj._super(page);

        var isAnimate = false;
        if (!firstLoad && cObj._properties.animate !== false && $.support.svg)
        {
            cObj.$ct.height(cObj.$ct.height());
            page.$dom.css({width: cObj.$ct.width(), position: 'absolute', left: cObj.$ct.width()});
            page.$dom.animate({left: 0}, 1000, function()
                {
                    page.$dom.css({position: '', width: ''});
                    cObj.$ct.css('height', '');
                });
            isAnimate = true;
        }
        cObj._startSwitch();
        if (_.isFunction(finalCallback)) { finalCallback(isAnimate); }
    },

    _arrange: function()
    {
        this._cancelSwitch();
        this._super();
        this.$ct.removeClass('hide');
        this._startSwitch();
    }
});

})(jQuery);
