(function($)
{
    $.fn.loadingSpinner = function(options)
    {
        // Check if object was already created
        var loadingSpinner = $(this[0]).data("loadingSpinner");
        if (!loadingSpinner)
        { loadingSpinner = new loadingSpinnerObj(options, this[0]); }
        return loadingSpinner;
    };

    var loadingSpinnerObj = function(options, dom)
    {
        this.settings = $.extend({}, loadingSpinnerObj.defaults, options);
        this.currentDom = dom;
        this.init();
    };

    $.extend(loadingSpinnerObj,
    {
        defaults:
        {
            overlay: false,
            showInitially: false
        },

        prototype:
        {
            init: function ()
            {
                var spObj = this;
                spObj.$dom().data("loadingSpinner", spObj);
                spObj.showHide(spObj.settings.showInitially);
            },

            $dom: function()
            {
                if (!this._$dom)
                { this._$dom = $(this.currentDom); }
                return this._$dom;
            },

            $content: function()
            {
                if ($.isBlank(this._$content))
                {
                    var $d = this.$dom();
                    var $spc = $d.children('.loadingSpinnerContainer');
                    if ($spc.length < 1)
                    { $spc = $.tag({tagName: 'div', 'class': 'loadingSpinnerContainer'}); }
                    $d.append($spc);

                    var $sp = $spc.children('.loadingSpinner');
                    if ($sp.length < 1)
                    { $sp = $d.children('.loadingSpinner'); }
                    if ($sp.length < 1)
                    { $sp = $.tag({tagName: 'div', 'class': 'loadingSpinner'}); }
                    $spc.append($sp);
                    this._$content = $spc;

                    if (this.settings.overlay)
                    {
                        var $o = $d.children('.loadingOverlay');
                        if ($o.length < 1)
                        { $o = $.tag({tagName: 'div', 'class': 'loadingOverlay'}); }
                        $d.append($o);
                        this._$content = this._$content.add($o);
                    }
                }
                return this._$content;
            },

            showHide: function(doShow)
            {
                this.$content().toggleClass('hide', !doShow);
            }
        }
    });

})(jQuery);
