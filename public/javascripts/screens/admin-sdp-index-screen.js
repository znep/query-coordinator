var sdpIndexNS = blist.namespace.fetch('admin.sdp.index');

sdpIndexNS.waitToShowPreview = function($context)
{
    clearTimeout(sdpIndexNS.loadFrameTimeout);
    if ((typeof $context.find('.widgetPreviewFrame').get()[0].contentWindow.blist === 'undefined') ||
        (typeof $context.find('.widgetPreviewFrame').get()[0].contentWindow.blist.widget === 'undefined') ||
        ($context.find('.widgetPreviewFrame').get()[0].contentWindow.blist.widget.ready !== true))
    {
          // iframe may not have loaded yet.
          sdpIndexNS.loadFrameTimeout = setTimeout(
              function() { sdpIndexNS.waitToShowPreview($context); }, 50);
    }
    else
    {
        $context.find('.widgetPreviewFrame').css('visibility', 'visible');
        $context.find('.loadingIndicator').hide();
    }
}

sdpIndexNS.getPreview = function($row)
{
    var $previewCell = $row.children('.previewCell');
    if($previewCell.children('.widgetPreviewFrame').size() == 0)
    {
        custId = $row.find('.customizationId').val();
        $previewCell.append('<iframe class="widgetPreviewFrame" width="' + 
                sdpIndexNS.previewWidth + '" height="' + sdpIndexNS.previewHeight + '" src="/widgets/' + 
                sdpIndexNS.viewId + '/' + custId + '" frameborder="0" scrolling="no"></iframe>');
    }
    
    sdpIndexNS.waitToShowPreview($row);
};

(function(){
    $('.widgetOpener').click(function(event){
       event.preventDefault();
       $row = $(this).closest('.widgetTable-row');

       if($row.hasClass('widgetTable-opened-row'))
       {
           clearTimeout(sdpIndexNS.loadFrameTimeout);
           $row.find('.loadingIndicator').hide();
           $row.find('.widgetPreviewFrame').css('visibility', 'hidden');
           $row.removeClass('widgetTable-opened-row');
       }
       else 
       {
           $row.addClass('widgetTable-opened-row');
           $row.find('.loadingIndicator').show();
           sdpIndexNS.getPreview($row);
       }
    });
    
    $('.deleteLink').click(function(event){
       if(!confirm('Are you sure you want to delete this template? Any data players currently using this theme will remain functional.'))
       {
           event.preventDefault();
       }
    });
})(jQuery);