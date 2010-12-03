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
        var generateThumbnailUrl = function(viewId, timestamp)
        {
            var result = '/api/views/' + viewId + '/snapshots?method=get&name=page&size=thumb';
            if (timestamp === true)
            {
                result += '&time=' + new Date().getTime();
            }
            return result;
        };

        var updateFeatureState = function()
        {
            var $features = $('.featuresWorkspace .featureWrapper');
            $features.each(function()
            {
                var $this = $(this);

                // update radio buttons; use array to check items
                $this.find('.featureContentRadio').val([
                    $this.find('.featureBox').hasClass('thumbnail') ? 'thumbnail' : 'text']);
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
                    '.featureHeadline@value': 'feature.title',
                    '.featureDescription': 'feature.description',
                    '.featureContentThumbnailSection img@src': generateThumbnailUrl('#{feature.viewId}'),
                    '.featureContentThumbnailSection img@alt': function() { return ''; }, // remove alt in case there is no image (so just an edit button)
                    '.featureBox@class+': function(a) { return (a.item.display == 'thumbnail') ? 'thumbnail' : 'text'; },
                    '.featureContentTextHeadline@value': 'feature.display.title',
                    '.featureContentTextSubtitle@value': 'feature.display.description',
                    '.featureContentRadio@name': 'featureContent_#{feature.viewId}'
        } } };

        $('.featuresWorkspace').append($.renderTemplate('feature', homeNS.features, featureDirective));

        $.live('.featureContentRadio', 'click', function(event)
        {
            // use click rather than change for IE's sake
            var $this = $(this);
            $this.closest('.featureBox').removeClass('thumbnail text').addClass($this.attr('value'));
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

            $('.featuresWorkspace').append($.renderTemplate('feature', [
                {   title: ds.name,
                    description: ds.description || '',
                    display: 'thumbnail',
                    viewId: ds.id } ], featureDirective));

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

                feature.viewId = $this.attr('data-viewid');
                feature.title = $this.find('.featureHeadline').val();
                feature.description = $this.find('.featureDescription').val();
                if ($this.hasClass('thumbnail'))
                {
                    feature.display = 'thumbnail';
                }
                else
                {
                    feature.display = {
                        title: $this.find('.featureContentTextHeadline').val(),
                        description: $this.find('.featureContentTextSubtitle').val()
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