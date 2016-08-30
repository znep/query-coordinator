(function($)
{
    $.Control.extend('pane_printDataset', {
        getTitle: function()
        { return $.t('screens.ds.grid_sidebar.print.title'); },

        getSubtitle: function()
        { return $.t('screens.ds.grid_sidebar.print.subtitle'); },

        isAvailable: function()
        { return this._view.isGrid() && this._view.valid; },

        getDisabledSubtitle: function()
        {
            return !this._view.valid ? $.t('screens.ds.grid_sidebar.base.validation.invalid_view') :
                $.t('screens.ds.grid_sidebar.print.validation.non_tabular');
        },

        _getSections: function()
        {
            var cObj = this;
            return [
                {
                    customContent: {
                        template: 'printForm',
                        directive: {},
                        data: {},
                        callback: function($sect)
                        {
                            blist.namespace.fetch('blist.common');
                            $sect.closest('form').data('dataset', cObj._view)
                                .attr('target', '_blank')
                                .submit(blist.common.formInliner)
                                .attr('method', 'post')
                                .attr('action', '/views/INLINE/rows.pdf');
                        }
                    }
                }
            ];
        },

        _getFinishButtons: function()
        { return [{text: $.t('screens.ds.grid_sidebar.print.print_button'), value: 'print', isDefault: true}, $.controlPane.buttons.cancel]; },

        _finish: function(data, value, finalCallback)
        {
            if (value === 'print')
            { this.$dom().find('.printForm').closest('form').submit(); }

            this._finishProcessing();
            this._hide();
            if (_.isFunction(finalCallback)) { finalCallback(); }
        }
    }, {name: 'printDataset', noReset: true}, 'controlPane');

    if ($.isBlank(blist.sidebarHidden.exportSection) || !blist.sidebarHidden.exportSection.print)
    { $.gridSidebar.registerConfig('export.printDataset', 'pane_printDataset', 5); }

})(jQuery);
