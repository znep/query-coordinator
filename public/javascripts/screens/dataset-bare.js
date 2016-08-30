$(function() {
  $('.outerContainer').fullScreen();

  // Initialize all data rendering
  blist.$container.renderTypeManager({
    view: blist.dataset,
    editEnabled: false,
    table: {
      showRowHandle: false,
      manualResize: false
    }
  });
});
