(function($)
{
    $.fn.hrefDataset = function(options)
    {
        // Check if object was already created
        var hrefDataset = $(this[0]).data("hrefDataset");
        if (!hrefDataset)
        {
            hrefDataset = new hrefDatasetObj(options, this[0]);
        }
        return hrefDataset;
    };

    var hrefDatasetObj = function(options, dom)
    {
        this.settings = $.extend({}, hrefDatasetObj.defaults, options);
        this.currentDom = dom;
        this.init();
    };

    $.extend(hrefDatasetObj,
    {
        defaults:
        {
            editEnabled: false
        },

        prototype:
        {
            init: function ()
            {
                var hrefObj = this;
                var $domObj = hrefObj.$dom();
                $domObj.data("hrefDataset", hrefObj);

                $domObj.find('a.expander').click(function(e)
                { e.preventDefault(); });

                $domObj.find('.datasetAverageRating').each(function()
                {
                    blist.datasetControls.datasetRating($(this), $domObj,
                        hrefObj.settings.editEnabled);
                });

                blist.datasetControls.datasetContact($domObj);
            },

            $dom: function()
            {
                if (!this._$dom)
                { this._$dom = $(this.currentDom); }
                return this._$dom;
            }
        }
    });

})(jQuery);
