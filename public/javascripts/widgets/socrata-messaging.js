(function($)
{
    $.fn.isSocrataTip = function()
    {
        return !_.isUndefined($(this[0]).data("socrataTip"));
    };

    $.fn.socrataTip = function(options)
    {
        // Check if object was already created
        var sTip = $(this[0]).data("socrataTip");
        if (!sTip)
        {
            sTip = new sTipObj(options, this[0]);
        }
        return sTip;
    };

    var sTipObj = function(options, dom)
    {
        if (typeof options == 'string')
        { options = {message: options}; }
        this.settings = $.extend({}, sTipObj.defaults, options);
        this.currentDom = dom;
        this.init();
    };

    $.extend(sTipObj,
    {
        defaults:
        {
            closeOnClick: true,
            isSolo: false,
            message: null,
            parent: 'body',
            positions: null,
            shrinkToFit: true,
            trigger: 'now'
        },

        prototype:
        {
            init: function ()
            {
                var sTipObj = this;
                var $domObj = sTipObj.$dom();
                $domObj.data("socrataTip", sTipObj);

                if (_.isNull(sTipObj.settings.message)) { return; }

                var pos = sTipObj.settings.positions;
                if (_.isNull(pos)) { pos = ['bottom', 'top']; }
                else if (pos == 'auto') { pos = ['most']; }

                $domObj.bt({
                        content: sTipObj.settings.message,

                        fill: '#fefbef',
                        strokeStyle: '#999999',
                        cornerRadius: 3,
                        spikeGirth: 15,
                        spikeLength: 12,
                        shadow: true,
                        shadowOffsetX: 0,
                        shadowOffsetY: 0,
                        shadowBlur: 3,
                        shadowColor: 'rgba(0, 0, 0, 0.3)',
                        noShadowOpts: {strokeWidth: 2},

                        clickAnywhereToClose: sTipObj.settings.closeOnClick,
                        closeWhenOthersOpen: sTipObj.settings.isSolo,
                        shrinkToFit: sTipObj.settings.shrinkToFit,
                        trigger: sTipObj.settings.trigger,
                        positions: pos,
                        offsetParent: sTipObj.settings.parent,

                        showTip: function(box)
                            {
                                if (!sTipObj._disabled)
                                {
                                    sTipObj._visible = true;
                                    $(box).fadeIn(300);
                                }
                            },
                        hideTip: function(box, callback)
                            {
                                sTipObj._visible = false;
                                $(box).fadeOut(300, callback);
                            }
                });
            },

            $dom: function()
            {
                if (!this._$dom)
                { this._$dom = $(this.currentDom); }
                return this._$dom;
            },

            show: function()
            {
                if (!this._visible)
                { this.$dom().btOn(); }
            },

            hide: function()
            {
                if (this._visible)
                { this.$dom().btOff(); }
            },

            /* These are used to temporarily hide/show the tooltip without fully
             * destroying it.  Visibility is used so we can continue tracking
             * the position */
            quickHide: function()
            {
                $getTipBox(this).css('visibility', 'hidden');
            },

            quickShow: function()
            {
                $getTipBox(this).css('visibility', 'visible');
            },

            disable: function()
            {
                this._disabled = true;
            },

            enable: function()
            {
                this._disabled = false;
            },

            destroy: function()
            {
                this.hide();
                this.disable();
                this.$dom().removeData('socrataTip');
            },

            /* This is used to manually move a tooltip (for example, when
             * attached to something that scrolls) */
            adjustPosition: function(adjAmt)
            {
                var sTipObj = this;
                if (sTipObj._disabled || !sTipObj._visible) { return; }

                var $tip = $getTipBox(sTipObj);

                if (!$.isBlank(adjAmt.top))
                { $tip.css('top', $tip.offset().top + adjAmt.top); }
                if (!$.isBlank(adjAmt.left))
                { $tip.css('left', $tip.offset().left + adjAmt.left); }
            },

            /* This is used to figure out which side of the item the tip is
             * attached to */
            getTipPosition: function()
            {
                var sTipObj = this;
                if (!$.isBlank(sTipObj._tipPosition))
                { return sTipObj._tipPosition; }

                if (!sTipObj._visible) { return null; }

                var $tip = $getTipBox(sTipObj).find('.bt-content');

                // HACK: This is a terrible hack; but the direction of the tip
                // isn't really stored anywhere...
                var pos = null;
                if (parseInt($tip.css('margin-bottom')) > 0) { pos = 'top'; }
                else if (parseInt($tip.css('margin-top')) > 0) { pos = 'bottom'; }
                else if (parseInt($tip.css('margin-right')) > 0) { pos = 'left'; }
                else if (parseInt($tip.css('margin-left')) > 0) { pos = 'right'; }

                if (!$.isBlank(pos))
                { sTipObj._tipPosition = pos; }
                return pos;
            }
        }
    });

    var $getTipBox = function(sTipObj)
    {
        // This is kind of a hack, since it relies on the internals
        //  of BT.  However, this is the most robust way to get the
        //  tip associated with this item
        return $(sTipObj.$dom().data('bt-box'));
    };

    $.fn.socrataAlert = function(options)
    {
        if (typeof options == 'string')
        { options = {message: options}; }
        // build main options before element iteration
        var opts = $.extend({}, $.fn.socrataAlert.defaults, options);

        // iterate and do stuff to each matched element
        return this.each(function()
        {
            var $socrataAlert = $(this);
            // build element specific options
            var config = $.meta ? $.extend({}, opts, $socrataAlert.data()) : opts;

            if (_.isNull(config.message)) { return; }

            $socrataAlert.socrataTip(config);
            setTimeout(function() { $socrataAlert.socrataTip().hide(); }, 5000);
        });
    };

    //
    // plugin defaults
    //
    $.fn.socrataAlert.defaults = {
        message: null
    };

})(jQuery);
