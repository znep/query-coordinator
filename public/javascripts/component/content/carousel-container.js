;(function($) {

$.component.PagedContainer.extend('Carousel', 'content', {
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

    _hideChild: function(child)
    {
        var cObj = this;
        if (child.$dom.is(':visible') && cObj._properties.animate !== false && $.support.svg)
        {
            var savedSuper = cObj._super;
            return function(doAnimate)
            {
                if (doAnimate)
                {
                    child.$dom.css({width: cObj.$ct.width(), position: 'absolute', left: 0});
                    child.$dom.animate({left: -cObj.$ct.width()}, 1000, function()
                        {
                            child.$dom.css({position: '', width: ''});
                            savedSuper(child);
                            cObj._startSwitch();
                        });
                }
                else
                {
                    savedSuper(child);
                    cObj._startSwitch();
                }
            }
        }
        else
        { this._super(child); }
    },

    _showChild: function(child, finalCallback)
    {
        var cObj = this;
        var firstLoad = !child._rendered;

        child.$dom.stop();
        cObj._super(child);

        var isAnimate = false;
        if (!firstLoad && cObj._properties.animate !== false && $.support.svg)
        {
            cObj.$ct.height(cObj.$ct.height());
            child.$dom.css({width: cObj.$ct.width(), position: 'absolute', left: cObj.$ct.width()});
            child.$dom.animate({left: 0}, 1000, function()
                {
                    child.$dom.css({position: '', width: ''});
                    cObj.$ct.css('height', '');
                });
            isAnimate = true;
        }
        if (_.isFunction(finalCallback)) { finalCallback(isAnimate); }
    },

    _arrange: function()
    {
        this._cancelSwitch();
        this._super();
    }
});

})(jQuery);
