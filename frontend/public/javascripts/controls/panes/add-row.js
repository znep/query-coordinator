(function($) {

  $.Control.extend(
    'pane_addRow',
    {
      isAvailable: function() {

        return this._view.valid &&
          (!this._view.temporary || this._view.minorChange) &&
          this._view.type == 'blist';
      },

      getTitle: function() {
        return $.t('screens.ds.grid_sidebar.add_row.title');
      },

      getSubtitle: function() {
        return $.t('screens.ds.grid_sidebar.add_row.subtitle');
      },

      getDisabledSubtitle: function() {
        return '';
      },

      _getSections: function() {
        return [];
      },

      _getFinishButtons: function() {
        return [];
      },

      // Arguments provided to this method: 'data', 'value', 'finalCallback'
      _finish: function() {}
    },
    { name: 'addRow' },
    'controlPane'
  );

  if (
    blist.feature_flags.enable_2017_grid_view_refresh &&
    ($.isBlank(blist.sidebarHidden.edit) || !blist.sidebarHidden.edit.addRow)
  ) {
    $.gridSidebar.registerConfig('edit.addRow', 'pane_addRow', 1);
  }

})(jQuery);
