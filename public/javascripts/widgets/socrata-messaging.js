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
            isSolo: false,
            message: null,
            parent: null,
            positions: null,
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

                $domObj.bt(sTipObj.settings.message,
                    {
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

                        closeWhenOthersOpen: sTipObj.settings.isSolo,
                        shrinkToFit: true,
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

            disable: function()
            {
                this._disabled = true;
            },

            enable: function()
            {
                this._disabled = false;
            }
        }
    });


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
