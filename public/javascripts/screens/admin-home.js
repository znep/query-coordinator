;(function($)
{

var homeNS = blist.namespace.fetch('blist.home');
var commonNS = blist.namespace.fetch('blist.common');

$(function()
{
    $('.deleteStoryButton').adminButton({
        confirmationText: 'Are you sure? This action cannot be undone.',
        callback: function(response, $row)
        {
            $row.slideUp().remove();
        }
    });

    $('.storiesList.gridList').combinationList({
        headerContainerSelector: '.gridListWrapper',
        initialSort: [[2, 1]],
        scrollableBody: false,
        selectable: false,
        sortGrouping: false,
        sortHeaders: {1: {sorter: 'text'}, 2: {sorter: 'numeric'}},
        sortTextExtraction: function(node) {
            return $(node).find('.cellInner').text();
        }
    });

    if (!_.isUndefined(homeNS.features))
    {
        var timeStampify = function(url, timestamp)
        {
            if (timestamp === true)
            {
                url += '&time=' + new Date().getTime();
            }
            return url;
        };

        var generateThumbnailUrl = function(viewId, timestamp)
        {
            return timeStampify('/api/views/' + viewId + '/snapshots/page?size=thumb', timestamp);
        };

        var generateFileDataUrl = function(fileSha, timestamp)
        {
            return timeStampify('/api/assets/' + fileSha + '?s=featured', timestamp);
        };

        var pureFileDataUrl = function(context)
        {
            var imageSha = context.item.assetId;
            if (!$.isBlank(imageSha)) { return generateFileDataUrl(imageSha); }
            return '';
        };

        var getFeatureType = function(feature)
        {
            if (feature.item.display == 'thumbnail') { return 'thumbnail'; }
            if (feature.item.display == 'custom') { return 'custom'; }
            return 'text';
        };

        var customUploadCount = 0;

        var customUploadGen = function(features)
        {
            _.each(features, function(feature)
            {
                var $this     = $(feature),
                    $section  = $this.find('.featureContentCustomSection'),
                    $link     = $section.find('.editCustomImageButton'),
                    $errorDiv = $section.find('.customImageError'),
                    $hiddenId = $section.find('.featureContentImageSha'),
                    $imageDiv = $section.find('.customImageContainer');

                new AjaxUpload($link, {
                    action: '/api/assets',
                    autoSubmit: true,
                    name: 'customUpload' + (customUploadCount++),
                    responseType: 'json',
                    onSubmit: function (file, ext)
                    {
                        if (!(ext && /^(jpg|png|jpeg|gif|tif|tiff)$/.test(ext)))
                        {
                            $errorDiv.show();
                            return false;
                        }
                        $errorDiv
                            .hide();
                        $section.addClass('loading');
                    },
                    onComplete: function (file, response)
                    {
                        $section.removeClass('loading');
                        $hiddenId.val(response.id);
                        $imageDiv.animate({opacity: 0}, {complete: function()
                            {
                                $('<img/>')
                                    .attr('src', generateFileDataUrl(response.id, true))
                                    .load(function() {
                                        $imageDiv
                                            .find('img').remove().end()
                                            .prepend($(this))
                                            .animate({opacity: 1});
                                    });
                            }
                        });
                    }
                });
            });
        };

        var updateFeatureState = function()
        {
            var $features = $('.featuresWorkspace .featureWrapper');
            $features.each(function()
            {
                var $this = $(this);

                // update radio buttons; use array to check items
                $this.find('.featureContentRadio').val([
                    $this.find('.featureBox').attr('data-displayType')]);
            });
            $('.newFeatureButton').toggleClass('disabled', ($features.length == 4));
            $('.newFeatureMessage').toggle($features.length == 4);

            $('.featureSwapButton').show();
            $('.featureWrapper:first-child .featureSwapButton.leftArrow').hide();
            $('.featureWrapper:last-child .featureSwapButton.rightArrow').hide();
        };

        var featureDirective = {
            '.featureWrapper': {
                'feature<-': {
                    '.featureBox@data-viewid': 'feature.viewId',
                    '.featureBox@data-displayType': getFeatureType,
                    '.featureHeadline@value': 'feature.title',
                    '.featureDescription': 'feature.description',
                    '.featureContentImageSha@value': 'feature.assetId',
                    '.featureContentCustomSection img@src': pureFileDataUrl,
                    '.featureContentCustomSection img@alt': function() {return '';},
                    '.featureContentThumbnailSection img@src': generateThumbnailUrl('#{feature.viewId}'),
                    '.featureContentThumbnailSection img@alt': function() { return ''; }, // remove alt in case there is no image (so just an edit button)
                    '.featureBox@class+': getFeatureType,
                    '.featureContentTextHeadline@value': 'feature.display.title',
                    '.featureContentTextSubtitle@value': 'feature.display.description',
                    '.featureContentRadio@name': 'featureContent_#{feature.viewId}'
        } } };

        var features = $.renderTemplate('feature', homeNS.features, featureDirective);
        customUploadGen(features);
        $('.featuresWorkspace').append(features);

        $.live('.featureContentRadio', 'click', function(event)
        {
            // use click rather than change for IE's sake
            var $this = $(this);
            $this.closest('.featureBox').removeClass('thumbnail custom text').addClass($this.attr('value'));
        });

        $.live('.featureRemoveButton', 'click', function(event)
        {
            event.preventDefault();

            $(this).closest('.featureWrapper').fadeOut(function()
            {
                $(this).remove();
                updateFeatureState();
            });
        });

        $.live('.featureSwapButton', 'click', function(event)
        {
            event.preventDefault();

            var $link = $(this);
            var $box = $link.closest('.featureWrapper')

            var $left, $right;

            if ($link.hasClass('leftArrow'))
            {
                $left = $box.prev();
                $right = $box;
            }
            else
            {
                $left = $box;
                $right = $box.next();
            }

            if (($left.length === 0) || ($right.length === 0))
            { return; }

            var offset = $left.outerWidth(true);
            $right.after($left);
            $left.css('right', offset);
            $right.css('left', offset);

            $left.animate({ 'right': 0 });
            $right.animate({ 'left': 0 });

            updateFeatureState();
        });

        $.live('.editThumbnailButton', 'click', function(event)
        {
            event.preventDefault();
            var $featureBox = $(this).closest('.featureBox');
            var viewId = $featureBox.attr('data-viewid');
            var $modal = $('#setThumbnail');

            blist.common.setThumbnail = function()
            {
                $modal.jqmHide();
                $featureBox.find('.featureContentThumbnailSection img').attr('src', generateThumbnailUrl(viewId, true));

                $modal.find('iframe').attr('src', '');
            };

            $modal.find('iframe').attr('src', '/datasets/' + viewId + '/thumbnail?strip_chrome=true');
            $modal.jqmShow();
        });

        commonNS.selectedDataset = function(ds)
        {
            $('#selectDataset').jqmHide();

            var newFeature = $.renderTemplate('feature',
                [ { title: ds.name,
                    description: ds.description || '',
                    display: 'thumbnail',
                    viewId: ds.id } ], featureDirective);

            customUploadGen(newFeature);

            $('.featuresWorkspace').append(newFeature);

            $('.featuresWorkspace .featureWrapper:last-child .featureBox').effect('highlight', 10000);

            updateFeatureState();
        };

        $('.newFeatureButton').click(function(event)
        {
            event.preventDefault();

            if ($(this).hasClass('disabled'))
            { return; }

            $('#selectDataset').jqmShow();
        });

        $('.saveFeaturesButton').click(function(event)
        {
            event.preventDefault();
            var $button = $(this);

            var features = [];
            $('.featuresWorkspace .featureBox').each(function()
            {
                var $this = $(this);
                var feature = {};

                feature.viewId      = $this.attr('data-viewid');
                feature.title       = $this.find('.featureHeadline').val().clean();
                feature.description = $this.find('.featureDescription')
                                          .val().clean();
                if ($this.hasClass('thumbnail'))
                {
                    feature.display = 'thumbnail';
                }
                else if ($this.hasClass('custom'))
                {
                    feature.display = 'custom';
                    feature.assetId = $this.find('.featureContentImageSha').val();
                }
                else
                {
                    feature.display = {
                        title: $this.find('.featureContentTextHeadline')
                            .val().clean(),
                        description: $this.find('.featureContentTextSubtitle')
                            .val().clean()
                    }
                }
                features.push(feature);
            });

            $button.addClass('disabled').text('Saving...');

            $.ajax({
                type: 'put',
                url: '/admin/save_featured_views',
                contentType: 'application/json',
                dataType: 'json',
                data: JSON.stringify({ features: features || [] }),
                success: function()
                {
                    $button.text('Saved.');
                    setTimeout(function()
                    {
                        $button
                            .removeClass('disabled')
                            .empty()
                            .html($.tag([
                                'Save Now',
                                { tagName: 'span', 'class': 'icon' }], true));
                    }, 2000);
                }
            })
        });

        updateFeatureState();
    }
});


})(jQuery);
