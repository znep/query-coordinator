$(function()
{
    var $container = $('#aboutSection');

    // Before we fullscreen, move the footer inside the sizing container.
    $('#siteFooter')
        .addClass('clearfix')
        .appendTo('.siteInnerWrapper');

    $('.outerContainer').fullScreen();
    $container.blobDataset({view: blist.dataset, editEnabled: true});

    // Set up publishing
    blist.datasetControls.hookUpPublishing($('#infoBox'));
});
