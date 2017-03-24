$(function() {
  var $container = $('#aboutSection');

  // Before we fullscreen, move the footer inside the sizing container.
  $('#siteFooter, #site-chrome-footer').
  addClass('clearfix').
  appendTo('.siteInnerWrapper');

  $('.outerContainer').fullScreen();
  $container.blobDataset({
    view: blist.dataset,
    editEnabled: true
  });

  // Set up publishing
  blist.datasetControls.hookUpPublishing($('#infoBox'));

  if (blist.dataset.isTabular()) {
    blist.dataset.getTotalRows(function() {
      $container.find('.row_count').text(blist.dataset.totalRows());
    });
  }

  if (!blist.feature_flags.enable_inline_login && !blist.currentUserId) {
    $container.find('.yourRating').socrataTip($.t('screens.about.tooltips.rating_disabled'));
  }
});