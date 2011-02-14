(function($)
{
    $.fn.blobDataset = function(options)
    {
        // Check if object was already created
        var blobDataset = $(this[0]).data("blobDataset");
        if (!blobDataset)
        {
            blobDataset = new blobDatasetObj(options, this[0]);
        }
        return blobDataset;
    };

    var blobDatasetObj = function(options, dom)
    {
        this.settings = $.extend({}, blobDatasetObj.defaults, options);
        this.currentDom = dom;
        this.init();
    };

    $.extend(blobDatasetObj,
    {
        defaults:
        {
            editEnabled: false
        },

        prototype:
        {
            init: function ()
            {
                var blobObj = this;
                var $domObj = blobObj.$dom();
                $domObj.data("blobDataset", blobObj);

                $domObj.find('a.expander').click(function(e)
                { e.preventDefault(); });

                $domObj.find('.datasetAverageRating').each(function()
                {
                    blist.datasetControls.datasetRating($(this), $domObj,
                        blobObj.settings.editEnabled);
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
