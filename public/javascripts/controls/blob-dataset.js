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

                blobObj.ready();
            },

            $dom: function()
            {
                if (!this._$dom)
                { this._$dom = $(this.currentDom); }
                return this._$dom;
            },

            ready: function()
            {
                var blobObj = this;
                var $domObj = blobObj.$dom();

                if (!$.isBlank(((blist.renderTypes || {}).blob || {}).href))
                {
                    var embedHtml;
                    if (blobObj.settings.view.blobMimeType.indexOf('application/pdf')
                        !== -1 && $.browser.msie)
                    {
                        embedHtml = '<embed src="' +
                            blist.renderTypes.blob.href +
                            '" type="application/pdf" ' +
                            'width="100%" height="99%"></embed>';
                        // Overlays & embeds don't mix
                        $(document).bind(blist.events.MODAL_SHOWN, function()
                                { $domObj.find('embed').hide(); })
                            .bind(blist.events.MODAL_HIDDEN, function()
                                { $domObj.find('embed').show(); });
                    }
                    else
                    {
                        embedHtml = '<iframe id="blobIFrame" ' +
                            'src="http://docs.google.com/gview?url=' +
                            blist.renderTypes.blob.href +
                            '&embedded=true" width="100%" height="99%" ' +
                            'frameborder="0" scrolling="no"></iframe>';
                    }
                    $domObj.find('.displayArea').html(embedHtml);
                }
                else
                {
                    $domObj.find('a.expander').click(function(e)
                    { e.preventDefault(); });

                    $domObj.find('.datasetAverageRating').each(function()
                    {
                        blist.datasetControls.datasetRating($(this), $domObj,
                            blobObj.settings.editEnabled);
                    });

                    $domObj.find('.routingApproval .reasonBox').each(function()
                    { blist.datasetControls.raReasonBox($(this)); });

                    blist.datasetControls.datasetContact($domObj);
                }

                var handleChange = function()
                {
                    _.defer(function() { blobObj.reload(); });
                };
                blobObj.settings.view.bind('blob_change', handleChange);
            },

            reload: function()
            {
                var blobObj = this;

                if ($.subKeyDefined(blist, 'renderTypes'))
                { delete blist.renderTypes.blob; }
                $.ajax({ url: '/blob/' + blobObj.settings.view.id,
                    success: function(data, status)
                    {
                        blobObj.$dom().html(data);
                        // Deferred so that blist.renderTypes has a chance to be set.
                        _.defer(function() { blobObj.ready(); });
                    }
                });
            }
        }
    });

})(jQuery);
