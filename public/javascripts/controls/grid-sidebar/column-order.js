(function($)
{
    if (blist.sidebarHidden.edit &&
        blist.sidebarHidden.edit.updateColumn) { return; }

    var configName = 'edit.columnOrder';
    var config =
    {
        name: configName,
        priority: 3,
        title: 'Column Order',
        subtitle: 'Change the order of your columns',
        onlyIf: function()
        {
            return blist.dataset.valid &&
                (!blist.dataset.temporary || blist.dataset.minorChange) &&
                !_.isEmpty(blist.dataset.visibleColumns);
        },
        disabledSubtitle: 'This view must be valid and must have visible columns.',
        sections: [{
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
                }
            }
        }],
        showCallback: function(sidebarObj, $pane)
        {
            $pane.find('ul.columnsList').awesomereorder();
            sidebar = sidebarObj;
        },
        finishBlock: {
            buttons: [$.gridSidebar.buttons.done, $.gridSidebar.buttons.cancel]
        }
    };

    var isLoading = false,
        sidebar;
    blist.dataset.bind('columns_changed', function()
    {
        if (isLoading) { return; }
        updateColumns();
        if (!$.isBlank(sidebar)) { sidebar.refresh(configName); }
    });

    var updateColumns = function()
    {
        // need to update in case the reference changes.
        config.sections[0].customContent.data = blist.dataset.visibleColumns;
    };
    updateColumns();

    config.finishCallback = function(sidebarObj, data, $pane, value)
    {
        var $columnsList = $pane.find('.columnsList');
        var columns = _.pluck(_.sortBy(blist.dataset.visibleColumns, function(column)
        {
            return $columnsList.children('[data-columnId=' + column.id + ']').index();
        }), 'id');

        isLoading = true;
        blist.dataset.setVisibleColumns(columns, function()
        {
            sidebarObj.finishProcessing();
            sidebarObj.hide();
            isLoading = false;
        });
    };

    $.gridSidebar.registerConfig(config);

})(jQuery);
