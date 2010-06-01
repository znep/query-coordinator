(function($)
{
    $.fn.isSocrataTip = function()
    {
        return !_.isUndefined($(this[0]).data("socrataTip"));
    };

    $.fn.socrataTip = function(options)
    {
        var $elems = $(this);
        // If only one item, use object-return version
        if ($elems.length < 2)
        {
            // Check if object was already created
            var sTip = $elems.data("socrataTip");
            if (!sTip)
            {
                sTip = new sTipObj(options, $elems[0]);
            }
            return sTip;
        }
        // Else create it on every item that is not initialized,
        // and return the elems
        else
        {
            $elems.each(function()
            {
                var $t = $(this);
                var curItem = $t.data("socrataTip");
                if (!curItem)
                { new sTipObj(options, $t[0]); }
            });
            return $elems;
        }
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
            content: null,
            killTitle: false,
            isSolo: false,
            message: null,
            parent: 'body',
            positions: null,
            shrinkToFit: true,
            trigger: 'hover'
        },

        prototype:
        {
            init: function ()
            {
                var sTipObj = this;
                var $domObj = sTipObj.$dom();
                $domObj.data("socrataTip", sTipObj);

                if ($.isBlank(sTipObj.settings.message) &&
                    $.isBlank(sTipObj.settings.content)) { return; }

                var pos = sTipObj.settings.positions;
                if (_.isNull(pos)) { pos = ['bottom', 'top']; }
                else if (pos == 'auto') { pos = ['most']; }

                var content = sTipObj.settings.content;
                if ($.isBlank(content))
                {
                    content = $.tag({tagName: 'p',
                        contents: sTipObj.settings.message}, true);
                }

                $domObj.bt({
                        content: content,

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
                        killTitle: sTipObj.settings.killTitle,

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
                                if (sTipObj._isDestroy)
                                {
                                    $(box).hide();
                                    _.defer(callback);
                                }
                                else
                                { $(box).fadeOut(300, callback); }
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
                this._isDestroy = true;
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
                { $tip.css('top', $tip.position().top + adjAmt.top); }
                if (!$.isBlank(adjAmt.left))
                { $tip.css('left', $tip.position().left + adjAmt.left); }
            },

            /* This is used to figure out which side of the item the tip is
             * attached to */
            getTipPosition: function()
            {
                var sTipObj = this;
                if (!sTipObj._visible) { return null; }

                var $tip = $getTipBox(sTipObj).find('.bt-content');

                // HACK: This is a terrible hack; but the direction of the tip
                // isn't really stored anywhere...
                var pos = null;
                if (parseInt($tip.css('margin-bottom')) > 0) { pos = 'top'; }
                else if (parseInt($tip.css('margin-top')) > 0) { pos = 'bottom'; }
                else if (parseInt($tip.css('margin-right')) > 0) { pos = 'left'; }
                else if (parseInt($tip.css('margin-left')) > 0) { pos = 'right'; }

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
        message: null,
        trigger: 'now'
    };

})(jQuery);
