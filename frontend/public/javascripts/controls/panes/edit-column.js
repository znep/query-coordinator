(function($) {

  $.Control.extend(
    'pane_editColumn',
    {
      isAvailable: function() {

        return this._view.valid &&
          (!this._view.temporary || this._view.minorChange) &&
          this._view.type == 'blist';
      },

      getTitle: function() {
        return $.t('screens.ds.grid_sidebar.edit_column.title');
      },

      getSubtitle: function() {
        return $.t('screens.ds.grid_sidebar.edit_column.subtitle');
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
    { name: 'editColumn' },
    'controlPane'
  );

  if ($.isBlank(blist.sidebarHidden.edit) || !blist.sidebarHidden.edit.editColumn) {
    $.gridSidebar.registerConfig('edit.editColumn', 'pane_editColumn', 3);
  }

})(jQuery);
