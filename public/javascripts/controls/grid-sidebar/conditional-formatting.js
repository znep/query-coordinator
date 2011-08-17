(function($)
{
    if (blist.sidebarHidden.visualize &&
        blist.sidebarHidden.visualize.conditionalFormatting) { return; }

    var filterableTypes = _.compact(_.map(blist.datatypes, function(t, n)
    {
        return !$.isBlank(t.filterConditions) || _.any(t.subColumns, function(st)
            { return !$.isBlank(st.filterConditions); }) ? n : null;
    }));

    var subColumnShown = function(tcId)
    {
        if ($.isBlank(tcId)) { return false; }
        return !_.isEmpty(blist.dataset.columnForTCID(tcId).renderType.subColumns);
    };

    var subColumns = function(tcId)
    {
        if ($.isBlank(tcId)) { return null; }
        var c = blist.dataset.columnForTCID(tcId);
        var r = _.map(c.renderType.subColumns || {}, function(sc)
            { return {value: sc.name, text: sc.title}; });
        return _.isEmpty(r) ? null : r;
    };

    var filterOperators = function(vals)
    {
        if ($.isBlank(vals.tableColumnId)) { return null; }
        var type = blist.dataset.columnForTCID(vals.tableColumnId).renderType;
        if ($.subKeyDefined(type, 'subColumns.' + vals.subColumn))
        { type = type.subColumns[vals.subColumn]; }
        if ($.isBlank(type.filterConditions)) { return null; }
        return _.map(type.filterConditions.orderedList,
            function(op) { return {value: op, text: type.filterConditions.details[op].text}; });
    };

    var filterEditor = function(sidebarObj, $field, vals, curValue)
    {
        if ($.isBlank(vals.tableColumnId) || $.isBlank(vals.operator)) { return false; }

        var col = blist.dataset.columnForTCID(vals.tableColumnId);
        var type = col.renderType;
        if ($.subKeyDefined(type, 'subColumns.' + vals.subColumn))
        { type = type.subColumns[vals.subColumn]; }

        if (!$.subKeyDefined(type, 'filterConditions.details.' + vals.operator) ||
            type.filterConditions.details[vals.operator].editorCount < 1)
        { return false; }

        var fc = type.filterConditions.details[vals.operator];
        var cp = {dropDownList: col.dropDownList, baseUrl: col.baseUrl()};
        var editorFn = type.getFilterEditor(vals.operator);

        _.times(fc.editorCount, function(i)
        {
            if (i > 0)
            {
                $field.append($.tag({tagName: 'span',
                    'class': ['joiner', type.name], contents: '&amp;'}));
            }
            var $editor = $.tag({tagName: 'div', 'class': ['editorWrapper', type.name]});
            new editorFn({type: type, row: null, value: _.isArray(curValue) ? curValue[i] : curValue,
                    format: col.format, customProperties: cp}, $editor[0]);
            $field.append($editor);
        });

        $field.toggleClass('twoEditors', fc.editorCount == 2);

        if (!$.isBlank($.uniform))
        { $field.find('select, :checkbox, :radio, :file').uniform(); }

        return true;
    };

    var filterEditorRequired = function(sidebarObj, vals)
    {
        if ($.isBlank(vals.tableColumnId) || $.isBlank(vals.operator)) { return false; }

        if (!$.subKeyDefined(type, 'filterConditions.details.' + vals.operator) ||
            type.filterConditions.details[vals.operator].editorCount < 1)
        { return false; }

        return true;
    };

    var filterEditorValue = function(sidebarObj, $field)
    {
        var $editor = $field.find('.editorWrapper');
        if ($editor.length < 1) { return null; }

        var vals = [];
        $editor.each(function()
        {
            var $t = $(this);
            var v = $t.blistEditor().currentValue();
            if (_.isNull(v) &&
                $t.blistEditor().type.name == 'checkbox')
            { v = '0'; }

            if (!$.isBlank(v)) { vals.push(v); }
        });

        if (vals.length < $editor.length) { return null; }
        if (vals.length == 1) { vals = vals[0]; }

        return vals;
    };

    var filterEditorCleanup = function(sidebarObj, $field)
    {
        var $editor = $field.find('.editorWrapper');
        $editor.each(function()
        {
            var $t = $(this);
            if ($t.isBlistEditor()) { $t.blistEditor().finishEdit(); }
        });
    };

    var conditionIndicator = {
        text: 'Use<br />this color<br />or this icon',
        type: 'radioGroup', name: 'conditionIndicator', defaultValue: 'color',
        options: [
            {type: 'color', required: true,
                name: 'color', defaultValue: '#bbffbb'},
            {type: 'custom', required: true,
                disabled: function()
                { return !_.include(blist.dataset.metadata.availableDisplayTypes, 'map'); },
                editorCallbacks: {create: function(sidebarObj, $field, vals, curValue)
                {
                    if (curValue)
                    { $field.append('<img src="' + curValue + '" /> '); }
                    var disabled = $field.parents(".radioLine").children(':disabled').length > 0;
                    if (disabled)
                    {
                        $field.append('Icons are only relevant for map view');
                        return;
                    }
                    $field.append('(<a>change</a>)<input type="hidden" name="' +
                        $field.attr('name') + '" />');
                    $field.find('a').data('ajaxupload', new AjaxUpload($field, {
                        action: '/api/assets',
                        autoSubmit: true,
                        responseType: 'json',
                        onComplete: function(file, response)
                        {
                            var imgUrl = '/api/assets/' + response.id;
                            var $preview = $field.find('img');
                            if ($preview.length == 0)
                            { $field.prepend('<img src="' + imgUrl + '" /> '); }
                            else
                            { $preview.attr('src', imgUrl); }
                            $field.find('input').attr('value', imgUrl);
                            $field.parents('.radioLine').find('input:radio')
                                .prop('checked', true).click();
                        }
                    }))
                }, value: function(sidebarObj, $field)
                { return $field.find('img').attr('src'); }},
                name: 'icon'}
           ]
       };

    var sidebar;
    var configName = 'visualize.conditionalFormatting';
    var config = {
        name: configName,
        priority: 10,
        title: 'Conditional Formatting',
        subtitle: 'Conditional Formatting allows you to change the background ' +
            'color of rows based on custom criteria. Each row will be assigned ' +
            'the color of the first matching condition.',
        showCallback: function(sidebarObj) { sidebar = sidebarObj; },
        onlyIf: function()
        {
            return blist.dataset.visibleColumns.length > 0 && blist.dataset.valid;
        },
        disabledSubtitle: function()
        {
            return !blist.dataset.valid ? 'This view must be valid' :
                'This view has no columns to filter';
        },
        dataSource: blist.dataset,
        sections: [{
            title: 'Conditions',
            fields: [
                {type: 'repeater', minimum: 0, addText: 'Add New Rule',
                name: 'metadata.conditionalFormatting',
                field: {type: 'group', extraClass: 'conditionGroup', options: [
                    conditionIndicator,
                    {type: 'select', text: 'When', prompt: null,
                        options: [{text: 'All Conditions', value: 'and'},
                            {text: 'Any Condition', value: 'or'},
                            {text: 'Always', value: 'always'}],
                        name: 'condition.operator'},
                    {type: 'repeater', minimum: 0, addText: 'Add Condition',
                        name: 'condition.children',
                        onlyIf: {field: 'condition.operator', value: 'always', negate: true},
                        field: {type: 'group', options: [
                        {type: 'columnSelect', text: 'Condition:', required: true,
                            name: 'tableColumnId', isTableColumn: true,
                            columns: {type: filterableTypes, hidden: false}},
                        {type: 'select', required: true, name: 'subColumn',
                            linkedField: 'tableColumnId', prompt: 'Select a sub-column',
                            onlyIf: {field: 'tableColumnId', func: subColumnShown},
                            options: subColumns},
                        {type: 'select', name: 'operator', required: true,
                            linkedField: ['tableColumnId', 'subColumn'],
                            prompt: 'Select a comparison', options: filterOperators},
                        {type: 'custom', required: true, name: 'value',
                            linkedField: ['tableColumnId', 'subColumn', 'operator'],
                            editorCallbacks: {create: filterEditor,
                                required: filterEditorRequired,
                                value: filterEditorValue,
                                cleanup: filterEditorCleanup}}
                    ]}}
                ] } }
            ]
        }],
        finishBlock: {
            buttons: [
                {text: 'Apply', isDefault: true, value: true},
                $.gridSidebar.buttons.cancel
            ]
        }
    };

    config.dataPreProcess = function(data)
    {
        var md = $.extend(true, {}, data.metadata);
        // Make them all consistent so they fit into the children pattern
        _.each(md.conditionalFormatting || [], function(cf)
        {
            if (cf.condition === true)
            { cf.condition = {operator: 'always'}; }
            else if (!_.isArray(cf.condition.children))
            {
                var newC = {children: [cf.condition], operator: 'and'};
                cf.condition = newC;
            }
        });
        return {metadata: md};
    };

    config.finishCallback = function(sidebarObj, data, $pane, value)
    {
        if (!sidebarObj.baseFormHandler($pane, value)) { return; }

        var resultObj = sidebarObj.getFormValues($pane);
        var newMd = $.extend(true, {}, blist.dataset.metadata);
        newMd.conditionalFormatting =
            (resultObj.metadata || {}).conditionalFormatting;

        // Clean up any conditionalFormatting items that only have one child
        _.each(newMd.conditionalFormatting || [], function(cf)
        {
            if (cf.condition.operator == 'always')
            { cf.condition = true; }
            else if (cf.condition.children.length < 2)
            { cf.condition = cf.condition.children[0]; }
        });

        blist.dataset.update({metadata: newMd});

        sidebarObj.finishProcessing();
    };

    blist.dataset.bind('clear_temporary', function()
        { if (!$.isBlank(sidebar)) { sidebar.refresh(configName); } });

    $.gridSidebar.registerConfig(config);

})(jQuery);
