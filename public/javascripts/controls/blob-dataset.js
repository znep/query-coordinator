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
                var ds = blobObj.settings.view;
                var blobs = ds.blobs();
                var blob = _.isEmpty(blobs) ? null : _.first(blobs);

                if (!$.isBlank(blob) && _.include(GOOGLE_VIEWER_TYPES, blob.type))
                {
                    var embedHtml,
                        gviewer_url = '//docs.google.com/gview?url='
                            + ds._generateBaseUrl() + blob.href;
                    if (blob.type.indexOf('application/pdf') !== -1 && $.browser.msie)
                    {
                        embedHtml = '<div class="externalLink flash notice">Trouble viewing the document? Try using the <a href="' + gviewer_url + '" target="_blank">Google Document Viewer</a>.</div>';
                        embedHtml += '<embed src="' + blob.href +
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
                            'src="' + gviewer_url +
                            '&embedded=true" width="100%" height="99%" ' +
                            'frameborder="0" scrolling="no"></iframe>';
                    }
                    $domObj.find('.displayArea').html(embedHtml);
                }
                else if (!$.isBlank(blob) && _.include(IMAGE_VIEWER_TYPES, blob.type) &&
                        $domObj.find('.displayArea').length < 1)
                {
                    $domObj.append($.tag2({ _: 'div', className: ['displayArea', 'image', 'fullHeight'],
                        contents: { _: 'img', alt: $.htmlEscape(ds.name), src: blob.href } }));
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
                ds.bind('blob_change', handleChange);
            },

            reload: function()
            {
                var blobObj = this;

                $.ajax({ url: '/blob/' + blobObj.settings.view.id,
                    success: function(data, status)
                    {
                        blobObj.$dom().html(data);
                        blobObj.ready();
                    }
                });
            }
        }
    });

    var GOOGLE_VIEWER_TYPES = ["application/pdf", "application/vndms-powerpoint", "image/tiff",
        "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

    var IMAGE_VIEWER_TYPES = ["image/jpeg", "image/gif", "image/png"];
})(jQuery);
