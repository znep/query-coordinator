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
        onlyIf: function()
        { return blist.dataset.valid; },
        disabledSubtitle: 'This view must be valid',
        sections: [{
            title: 'Columns',
            customContent: {
                template: 'showHideBlock',
                directive: {
                    'li.columnItem': {
                        'column<-': {
                            'input@checked': function(a)
                            { return a.item.hidden ? '' : 'checked'; },
                            'input@data-columnId': 'column.id',
                            'input@id': 'showHide_#{column.id}',
                            'label .name': 'column.name!',
                            'label@for': 'showHide_#{column.id}',
                            'label@class+': 'column.renderTypeName',
                            '@data-parentId': function(a)
                            { return (a.item.parentColumn || {}).id || ''; },
                            '@class+': function(a)
                            { return !$.isBlank(a.item.parentColumn) ?
                                'childCol' : ''; }
                        }
                    }
                },
                callback: function($sect)
                {
                    $sect.find('li.columnItem[data-parentId]').each(function()
                    {
                        var $t = $(this);
                        var $i = $sect.find('input[data-columnId=' +
                            $t.attr('data-parentId') + ']');
                        var updateViz = function()
                        { _.defer(function() { $t.toggle($i.is(':checked')); }); };
                        $i.change(updateViz).click(updateViz);
                        updateViz();
                    });
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
        var sortFunc = function(c)
        {
            // Sort all the visible columns first, so start the sort string
            // with 'a'; then sort by position.  For hidden columns, start
            // with 'z' to sort them at the end; then just sort
            // alphabetically
            if (!c.hidden)
            { return 'a' + ('000' + c.position).slice(-3); }
            return 'z' + c.name;
        };

        var cols = _(blist.dataset.realColumns).chain()
            .sortBy(sortFunc)
            .map(function(c)
            {
                if (!$.isBlank(c.realChildColumns))
                { return [c].concat(_.sortBy(c.realChildColumns, sortFunc)); }
                else { return c; }
            })
            .flatten()
            .value();

        config.sections[0].customContent.data = cols;
    };
    updateColumns();

    var registeredChange = false;
    var isLoading = false;
    config.showCallback = function(sidebarObj, $pane)
    {
        if (!registeredChange)
        {
            blist.dataset.bind('columns_changed', function()
            {
                if (isLoading) { return; }
                updateColumns();
                sidebarObj.refresh(configName);
            });

            registeredChange = true;
        }
    };

    config.finishCallback = function(sidebarObj, data, $pane, value)
    {
        if (!value)
        {
            sidebarObj.finishProcessing();
            sidebarObj.hide();
            return false;
        }

        var cols = [];
        var children = {};
        $pane.find('.columnItem :input:checked:visible').each(function()
        {
            var $t = $(this);
            var $colItem = $t.closest('li.columnItem');
            var colId = $t.attr('data-columnId');
            if ($colItem.is('.childCol'))
            {
                children[$colItem.attr('data-parentId')].push(colId);
            }
            else
            {
                cols.push(colId);
                if ($colItem.find('label').is('.nested_table'))
                { children[colId] = []; }
            }
        });

        cols = _.sortBy(cols, function(cId)
            { return blist.dataset.columnForID(cId).position; });

        _.each(children, function(cols, id)
        {
            var parCol = blist.dataset.columnForID(id);
            cols = _.sortBy(cols, function(cId)
                { return parCol.childColumnForID(cId).position; });
            parCol.setVisibleChildColumns(cols, null, true);
        });

        isLoading = true;
        blist.dataset.setVisibleColumns(cols, function()
        {
            sidebarObj.finishProcessing();
            sidebarObj.hide();
            isLoading = false;
        });
    };

    $.gridSidebar.registerConfig(config);

})(jQuery);
