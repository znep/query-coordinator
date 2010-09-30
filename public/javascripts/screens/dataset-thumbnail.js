;$(function()
{
    var $fullContainer    = $('#fullThumbnail'),
        $imgContainer     = $('#fullThumbnail .fullThumbContainer'),
        $previewWrapper   = $('#previewThumbnailWrapper'),
        $previewContainer = $('#previewThumbnail'),
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
        return;
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

        var selection = tn.selection;
        blist.dataset.requestSnapshot(snapshotName, function(response)
        {
            $fullContainer.removeClass('loading');
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
            fullThumbnailChanged(blist.dataset.getFullSnapshotUrl());
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
