(function($) {
  $.Control.extend('pane_appendReplace', {
    getTitle: function() {
      return (blist.dataset.isImmutable() ?
        $.t('screens.ds.grid_sidebar.append_replace.title.immutable') :
        $.t('screens.ds.grid_sidebar.append_replace.title.mutable'));
    },


    getSubtitle: function() {
      return (blist.dataset.isImmutable() ?
        $.t('screens.ds.grid_sidebar.append_replace.subtitle.immutable') :
        $.t('screens.ds.grid_sidebar.append_replace.subtitle.mutable'));
    },

    _getSections: function() {
      return [{
        customContent: {
          template: 'appendReplace',
          data: {},
          directive: {}
        }
      }];
    }
  }, {
    name: 'appendReplace',
    noReset: true
  }, 'controlPane');

  if ($.isBlank(blist.sidebarHidden.edit) || !blist.sidebarHidden.edit.appendReplace) {
    $.gridSidebar.registerConfig('edit.appendReplace', 'pane_appendReplace', 5);
  }

})(jQuery);
