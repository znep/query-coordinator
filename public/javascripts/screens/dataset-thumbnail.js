;$(function()
{
    var $fullContainer    = $('#fullThumbnail'),
        $imgContainer     = $('#fullThumbnail .fullThumbContainer'),
        $previewWrapper   = $('#previewThumbnailWrapper'),
        $previewContainer = $('#previewThumbnail'),
        $invalidMessage   = $('.invalidMessage'),
        imgSelectObj      = null,
        snapshotName      = 'page',
        snapshotImg       = blist.dataset.getFullSnapshotUrl(),
        previewWidth      = $previewContainer.width(),
        previewHeight     = $previewContainer.height(),
        $refreshContainer = $('.refreshThumbnail'),
        $saveButton       = $('.actionsForm .savePreviewButton'),
        $saveMessage      = $('.actionsForm .saveMessage'),
        $saveThrobber     = $('.actionsForm .saving');

    if (!blist.dataset.isPublic())
    {
        $invalidMessage
            .addClass('error')
            .text('For your privacy, only public datasets may be thumbnailed.' +
                  'If you wish to have a preview image, please make this dataset ' +
                  'public from the Sharing pane of the edit menu');
        return;
    }
    else if (blist.dataset.type == 'blob')
    {
        $invalidMessage
            .addClass('warning')
            .text('This embedded file cannot be thumbnailed as it cannot be displayed in the browser');
        return;
    }
    else if (!blist.dataset.valid)
    {
        $invalidMessage
            .addClass('warning')
            .text('This view is invalid and cannot be thumbnailed in its current state');
        return;
    }
    else
    {
        $fullContainer.fadeIn();
    }

    // Make sure there are js objects to modify later
    blist.dataset.metadata = blist.dataset.metadata || {};
    blist.dataset.metadata.thumbnail = blist.dataset.metadata.thumbnail || {};
    blist.dataset.metadata.thumbnail[snapshotName] =
      blist.dataset.metadata.thumbnail[snapshotName] || {};

    var tn = blist.dataset.metadata.thumbnail[snapshotName];

    var imgSelectUpdated = function(selection, initialLoad)
    {
        // math is fun
        var scaleX   = previewWidth  / (selection.width || 1),
            scaleY   = previewHeight / (selection.height || 1),
            $realImg = $imgContainer.find('.realPreview');

        if (!initialLoad)
        {
            $fullContainer.addClass('unsaved');
            $saveButton.removeClass('disabled');
        }

        $previewContainer.find('> img').css({
            height: Math.round(scaleY * $realImg.height()) + 'px',
            width: Math.round(scaleX * $realImg.width()) + 'px',
            marginLeft: '-' + Math.round(scaleX * selection.x1) + 'px',
            marginTop: '-' + Math.round(scaleY * selection.y1) + 'px'
        });
    };

    // Call this the first time the page is rendered
    // and any time a new snapshot is available
    var fullThumbnailChanged = function(url)
    {
        var $img = $('<img/>')
            .attr('src', url)
            .load(function(response, status, xhr){
                if ("error" == status)
                {
                    $fullContainer.addClass('noThumbnail');
                    return;
                }
                $fullContainer.removeClass('noThumbnail');

                var ruler  = $img.hide().appendTo('body'),
                    realWidth  = ruler.width(),
                    realHeight = ruler.height();

                $fullContainer
                    .find('.loading').hide();

                $previewContainer
                    .empty()
                    .append($img.clone().addClass('preview').fadeIn());

                $imgContainer.find('.image').empty()
                    .append($img.fadeIn(300, function(){
                        $img
                            .addClass('realPreview');

                        var selectOptions = {
                            aspectRatio: '15:8',
                            handles: true,
                            imageHeight: realHeight,
                            imageWidth:  realWidth,
                            instance: true,
                            onSelectEnd: function() {
                                // Call with the scaled pixel parameters
                                imgSelectUpdated(imgSelectObj.getSelection(true), false);
                            },
                            parent: $imgContainer,
                            show: false
                        },
                            isFirst = $.isBlank(imgSelectObj);

                        if (isFirst)
                        {
                            imgSelectObj = $img.imgAreaSelect(selectOptions);
                        }
                        else
                        {
                            imgSelectObj.update();
                        }

                        // Re-populate from saved value
                        if (!$.isBlank(tn.selection))
                        {
                            imgSelectObj.setSelection(tn.selection.x1, tn.selection.y1,
                                tn.selection.x2, tn.selection.y2);
                            imgSelectObj.update();
                            // And update the preview
                            imgSelectUpdated(imgSelectObj.getSelection(true), isFirst);

                        }
                        imgSelectObj.setOptions({show: true});
                    }));
            });

    };

    var requestNewSnapshot = function()
    {
        $refreshContainer.addClass('working')
            .find('.refresh').addClass('disabled');

        $fullContainer
            .find('.loading').show().end()
            .find('.image').hide();

        var selection = tn.selection;
        blist.dataset.requestSnapshot(snapshotName, function(response)
        {
            $fullContainer.removeClass('loading')
                .find('.loading').hide().end()
                .find('.image').show();

            if ($.isBlank(response) || response.error)
            {
                $refreshContainer.removeClass('working');
                $fullContainer.addClass('snapError refreshError');
                return;
            }

            $refreshContainer.removeClass('working')
                .find('.refresh').removeClass('disabled');

            tn = blist.dataset.metadata.thumbnail[snapshotName];
            tn.selection = selection;
            fullThumbnailChanged(blist.dataset.getFullSnapshotUrl() +
                '?noop=' + (new Date().getTime()));
        });
    };

    if ($.isBlank(snapshotImg))
    {
        $fullContainer
            .find('.loading').fadeOut().end()
            .addClass('noThumbnail');

        requestNewSnapshot();
    }
    else
    {
        $fullContainer.removeClass('loading');
        fullThumbnailChanged(snapshotImg);
    }

    $saveButton.click(function(event)
    {
        event.preventDefault();

        if ($(this).hasClass('disabled'))
        { return; }

        // Get the non-scaled rect
        tn.selection = imgSelectObj.getSelection(false);
        delete tn.filename;

        $saveThrobber.fadeIn();

        blist.dataset.save(function()
        {
            blist.dataset.cropSnapshot(snapshotName, function()
            {
                $saveThrobber.hide();
                $fullContainer.removeClass('unsaved');
                $saveMessage
                    .removeClass('error')
                    .addClass('notice')
                    .text('Thumbnail saved')
                    .fadeIn(300, function()
                       { setTimeout(function() {$saveMessage.fadeOut(1000);}, 5000); });

                $saveButton.addClass('disabled');

                // in case we're in a container that's expecting it, notify the parent
                // that we've done something useful
                if (!_.isUndefined(window.parent))
                {
                    var commonNS = window.parent.blist.namespace.fetch('blist.common');
                    if (_.isFunction(commonNS.setThumbnail))
                    { commonNS.setThumbnail(); }
                }
            });
        },
        function()
        {
            $saveThrobber.fadeOut();
            $saveMessage
              .removeClass('notice')
              .addClass('error')
              .text('There was a problem saving your thumbnail. Please try again later')
              .fadeIn();
        });
    });

    // TODO: named snapshots?
    $refreshContainer.find('a').click(function(event)
    {
        event.preventDefault();
        requestNewSnapshot();
    });

});
