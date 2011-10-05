(function($)
{
    var isLoading = false;

    $.Control.extend('pane_columnOrder', {
        _init: function()
        {
            var cpObj = this;
            cpObj._super.apply(cpObj, arguments);

            cpObj._view.bind('columns_changed', function()
            {
                if (isLoading) { return; }
                cpObj.reset();
            }, cpObj);
        },

        getTitle: function()
        { return 'Column Order'; },

        getSubtitle: function()
        { return 'Change the order of your columns'; },

        isAvailable: function()
        {
            return this._view.valid &&
                (!this._view.temporary || this._view.minorChange) &&
                !_.isEmpty(this._view.visibleColumns);
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
                    data: this._view.visibleColumns
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

        _finish: function(data, value, finalCallback)
        {
            var cpObj = this;
            if (!cpObj._super.apply(cpObj, arguments)) { return; }

            var $columnsList = cpObj.$dom().find('.columnsList');
            var columns = _.pluck(_.sortBy(cpObj._view.visibleColumns, function(column)
            {
                return $columnsList.children('[data-columnId=' + column.id + ']').index();
            }), 'id');

            isLoading = true;
            cpObj._view.setVisibleColumns(columns, function()
            {
                cpObj._finishProcessing();
                cpObj._hide();
                isLoading = false;
                if (_.isFunction(finalCallback)) { finalCallback(); }
            });
        }
    }, {name: 'columnOrder'}, 'controlPane');

    if ($.isBlank(blist.sidebarHidden.manage) || !blist.sidebarHidden.manage.updateColumn)
    { $.gridSidebar.registerConfig('manage.columnOrder', 'pane_columnOrder', 3); }

})(jQuery);
