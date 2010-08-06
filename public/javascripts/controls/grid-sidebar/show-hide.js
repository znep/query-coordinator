(function($)
{
    if (blist.sidebarHidden.filter &&
        blist.sidebarHidden.filter.showHide) { return; }

    var configName = 'filter.showHide';
    var config =
    {
        name: configName,
        priority: 5,
        title: 'Show &amp; Hide Columns',
        subtitle: 'Adjust which columns are visible in this view',
        onlyIf: function(view)
        { return blist.dataset.valid; },
        disabledSubtitle: 'This view must be valid',
        sections: [{
            title: 'Columns',
            customContent: {
                template: 'showHideBlock',
                directive: {
                    'li.columnItem': {
                        'column<-': {
                            'input@checked': 'column.visible',
                            'input@data-columnId': 'column.id',
                            'input@id': 'showHide_#{column.id}',
                            'label .name': 'column.name!',
                            'label@for': 'showHide_#{column.id}',
                            'label@class+': 'column.renderTypeName'
                        }
                    }
                }
            }
        }],
        finishBlock: {
            buttons: [{text: 'Apply', isDefault: true, value: true},
                $.gridSidebar.buttons.cancel]
        }
    };

    var updateColumns = function()
    {
        var cols = _.sortBy(blist.dataset.realColumns,
            function(c)
            {
                // Sort all the visible columns first, so start the sort string
                // with 'a'; then sort by position.  For hidden columns, start
                // with 'z' to sort them at the end; then just sort
                // alphabetically
                if (!c.hidden)
                { return 'a' + ('000' + c.position).slice(-3); }
                return 'z' + c.name;
            });

        config.sections[0].customContent.data = cols;
    };
    updateColumns();

    $(document).bind(blist.events.COLUMNS_CHANGED, function()
    {
        updateColumns();
        $('#gridSidebar').gridSidebar().refresh(configName);
    });

    config.finishCallback = function(sidebarObj, data, $pane, value)
    {
        if (!value)
        {
            sidebarObj.finishProcessing();
            sidebarObj.hide();
            return false;
        }

        var cols = [];
        $pane.find('.columnItem :input:checked').each(function()
        { cols.push($(this).attr('data-columnId')); });

        sidebarObj.$grid().datasetGrid().updateVisibleColumns(cols, function()
        {
            sidebarObj.finishProcessing();
            sidebarObj.hide();
        });
    };

    $.gridSidebar.registerConfig(config);

})(jQuery);
