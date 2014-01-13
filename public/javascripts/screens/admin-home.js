;(function($)
{

var homeNS = blist.namespace.fetch('blist.home');
var commonNS = blist.namespace.fetch('blist.common');
var t = function(str, props) { return $.t('screens.admin.home.' + str, props); };

$(function()
{
    $('.deleteStoryButton').adminButton({
        confirmationText: t('are_you_sure'),
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
        sortHeaders: {0: { sorter: false }, 1: {sorter: 'text'}, 2: {sorter: 'numeric'}, 3: { sorter: false }},
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

        var generateFileDataUrl = function(fileSha, viewId, timestamp)
        {
            url = null;
            if (fileSha && fileSha.startsWith('fileId:'))
            {
                url = '/api/views/'+viewId+'/files/'+(fileSha.split(':')[1])+'?s=featured';
            }
            else
            {
                url = '/api/assets/' + fileSha + '?s=featured';
            }
            return timeStampify(url, timestamp);
        };

        var pureFileDataUrl = function(context)
        {
            var imageSha = context.item.assetId;
            if (!$.isBlank(imageSha)) { return generateFileDataUrl(imageSha, context.item.viewId); }
            return '';
        };

        var getFeatureType = function(feature)
        {
            if (feature.item.display == 'thumbnail') { return 'thumbnail'; }
            if (feature.item.display == 'custom') { return 'custom'; }
            return 'text';
        };

        var customUploadCount = 0;

        var customUploadGen = function($features)
        {
            $features.find('.editCustomImageButton').imageUploader({
                buttonText: t('edit'),
                containerSelector: '.featureContentCustomSection',
                name: 'featuredDatasetUploader',
                errorSelector: '.customImageError',
                success: function($c, $i, r) {
                    $c.removeClass('working');
                    $c.find('.featureContentImageSha').val(r.id);
                },
                urlProcessor: function(response) {
                    return '/api/assets/' + response.id + '?s=featured';
                }
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

            var $wrap  = $(this).closest('.featureWrapper');
            var viewId = $wrap.find('.featureBox').data('viewid');
            homeNS.features = _.reject(homeNS.features, function(feat) { return feat.viewId == viewId; });

            $wrap.fadeOut(function()
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

            $modal.find('iframe').attr('src', $.path('/datasets/' + viewId + '/thumbnail?strip_chrome=true'));
            $modal.jqmShow();
        });

        commonNS.selectedDataset = function(ds)
        {
            $('#selectDataset').jqmHide();

            homeNS.features || (homeNS.features = []);
            if (_.detect(homeNS.features, function(feat) { return feat.viewId == ds.id; }))
            {
                $('.featuresWorkspace .featureWrapper .featureBox[data-viewid="' + ds.id + '"]')
                    .effect('highlight', 10000);
                return;
            }

            var newFeatureObj = { title: ds.name,
                    description: ds.description || '',
                    display: !$.isBlank(ds.iconUrl) ? 'custom' : 'thumbnail',
                    assetId: ds.iconUrl,
                    viewId: ds.id };

            homeNS.features.push(newFeatureObj);

            var newFeature = $.renderTemplate('feature',
                [ newFeatureObj ], featureDirective);

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

            $button.addClass('disabled').text(t('saving1'));

            $.ajax({
                type: 'put',
                url: '/admin/save_featured_views',
                contentType: 'application/json',
                dataType: 'json',
                data: JSON.stringify({ features: features || [] }),
                success: function()
                {
                    $button.text(t('saved1'));
                    setTimeout(function()
                    {
                        $button
                            .removeClass('disabled')
                            .empty()
                            .html($.tag([
                                t('save_now'),
                                { tagName: 'span', 'class': 'icon' }], true));
                    }, 2000);
                }
            })
        });

        updateFeatureState();
    }
});


})(jQuery);
