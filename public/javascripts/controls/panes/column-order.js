(function($)
{
    var isLoading = false;

    $.Control.extend('pane_columnOrder', {
        _init: function()
        {
            var cpObj = this;
            cpObj._super.apply(cpObj, arguments);

            cpObj.settings.view.bind('columns_changed', function()
            {
                if (isLoading) { return; }
                cpObj.reset();
            });
        },

        getTitle: function()
        { return 'Column Order'; },

        getSubtitle: function()
        { return 'Change the order of your columns'; },

        isAvailable: function()
        {
            return this.settings.view.valid &&
                (!this.settings.view.temporary || this.settings.view.minorChange) &&
                !_.isEmpty(this.settings.view.visibleColumns);
        },

        getDisabledSubtitle: function()
        { return 'This view must be valid and must have visible columns.'; },

        _getSections: function()
        {
            return [{
                title: 'Columns',
                customContent: {
                    template: 'columnOrderBlock',
                    directive: {
                        'li.columnItem': {
                            'column<-': {
                                '.@data-columnId': 'column.id',
                                '.name': 'column.name!',
                                '.@class+': 'column.renderTypeName'
                            }
                        }
                    },
                    data: this.settings.view.visibleColumns
                }
            }];
        },

        shown: function()
        {
            this._super();
            this.$dom().find('ul.columnsList').awesomereorder();
        },

        _getFinishButtons: function()
        { return [$.controlPane.buttons.apply, $.controlPane.buttons.cancel]; },

        _finish: function(data, value)
        {
            var cpObj = this;
            if (!cpObj._super.apply(cpObj, arguments)) { return; }

            var $columnsList = cpObj.$dom().find('.columnsList');
            var columns = _.pluck(_.sortBy(cpObj.settings.view.visibleColumns, function(column)
            {
                return $columnsList.children('[data-columnId=' + column.id + ']').index();
            }), 'id');

            isLoading = true;
            cpObj.settings.view.setVisibleColumns(columns, function()
            {
                cpObj._finishProcessing();
                cpObj._hide();
                isLoading = false;
            });
        }
    }, {name: 'columnOrder'}, 'controlPane');

    if ($.isBlank(blist.sidebarHidden.manage) || !blist.sidebarHidden.manage.updateColumn)
    { $.gridSidebar.registerConfig('manage.columnOrder', 'pane_columnOrder', 3); }

})(jQuery);
