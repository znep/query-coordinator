(function($)
{
    var filterableTypes = _.compact(_.map(blist.datatypes, function(t, n)
    {
        return !$.isBlank(t.filterConditions) || _.any(t.subColumns, function(st)
            { return !$.isBlank(st.filterConditions); }) ? n : null;
    }));

    var subColumnShown = function(tcId)
    {
        if ($.isBlank(tcId)) { return false; }
        return !_.isEmpty(this._view.columnForTCID(tcId).renderType.subColumns);
    };

    var subColumns = function(tcId)
    {
        if ($.isBlank(tcId)) { return null; }
        var c = this._view.columnForTCID(tcId);
        var r = _.map(c.renderType.subColumns || {}, function(sc)
            { return {value: sc.name, text: sc.title}; });
        return _.isEmpty(r) ? null : r;
    };

    var filterOperators = function(vals)
    {
        if ($.isBlank(vals.tableColumnId)) { return null; }
        var type = this._view.columnForTCID(vals.tableColumnId).renderType;
        if ($.subKeyDefined(type, 'subColumns.' + vals.subColumn))
        { type = type.subColumns[vals.subColumn]; }
        if ($.isBlank(type.filterConditions)) { return null; }
        return _.map(type.filterConditions.orderedList,
            function(op) { return {value: op, text: type.filterConditions.details[op].text}; });
    };

    var filterEditor = function($field, vals, curValue)
    {
        if ($.isBlank(vals.tableColumnId) || $.isBlank(vals.operator)) { return false; }

        var col = this._view.columnForTCID(vals.tableColumnId);
        var type = col.renderType;
        if ($.subKeyDefined(type, 'subColumns.' + vals.subColumn))
        { type = type.subColumns[vals.subColumn]; }

        if (!$.subKeyDefined(type, 'filterConditions.details.' + vals.operator) ||
            type.filterConditions.details[vals.operator].editorCount < 1)
        { return false; }

        var fc = type.filterConditions.details[vals.operator];
        var cp = {dropDownList: col.dropDownList, baseUrl: col.baseUrl()};
        var editorInt = type.filterConditions.details[vals.operator].interfaceType;

        _.times(fc.editorCount, function(i)
        {
            if (i > 0)
            { $field.append($.tag({tagName: 'span', 'class': ['joiner', type.name], contents: '&amp;'})); }
            var $editor = $.tag({tagName: 'div', 'class': ['editorWrapper', type.name]});
            $editor.blistEditor({type: type, editorInterface: editorInt,
                row: null, value: _.isArray(curValue) ? curValue[i] : curValue,
                format: col.format, customProperties: cp});
            $field.append($editor);
        });

        $field.toggleClass('twoEditors', fc.editorCount == 2);

        if (!$.isBlank($.uniform))
        { $field.find('select, :checkbox, :radio, :file').uniform(); }

        return true;
    };

    var filterEditorRequired = function(vals)
    {
        if ($.isBlank(vals.tableColumnId) || $.isBlank(vals.operator)) { return false; }

        var col = this._view.columnForTCID(vals.tableColumnId);
        var type = col.renderType;
        if ($.subKeyDefined(type, 'subColumns.' + vals.subColumn))
        { type = type.subColumns[vals.subColumn]; }

        if (!$.subKeyDefined(type, 'filterConditions.details.' + vals.operator) ||
            type.filterConditions.details[vals.operator].editorCount < 1)
        { return false; }

        return true;
    };

    var filterEditorValue = function($field)
    {
        var $editor = $field.find('.editorWrapper');
        if ($editor.length < 1) { return null; }

        var vals = [];
        $editor.each(function()
        {
            var $t = $(this);
            var v = $t.blistEditor().currentValue();
            if (_.isNull(v) && $t.blistEditor().type.name == 'checkbox')
            { v = '0'; }

            if (!$.isBlank(v)) { vals.push(v); }
        });

        if (vals.length < $editor.length) { return null; }
        if (vals.length == 1) { vals = vals[0]; }

        return vals;
    };

    var filterEditorCleanup = function($field)
    {
        var $editor = $field.find('.editorWrapper');
        $editor.each(function()
        {
            var $t = $(this);
            if ($t.isControlClass('blistEditor')) { $t.blistEditor().finishEdit(); }
        });
    };

    var conditionIndicator = {
        text: 'Use<br />this color<br />or this icon',
        type: 'radioGroup', name: 'conditionIndicator', defaultValue: 'color',
        options: [
            {type: 'color', required: true, name: 'color', defaultValue: '#bbffbb'},
            {type: 'custom', required: true, disabled: function()
                { return !_.include(this._view.metadata.availableDisplayTypes, 'map'); },
                editorCallbacks: {
                create: function($field, vals, curValue)
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
                        $field.attr('name') + '" value="' + curValue + '" />');
                    $field.find('a').data('ajaxupload', new AjaxUpload($field, {
                        action: '/api/assets', autoSubmit: true, responseType: 'json',
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
                },
                value: function($field) { return $field.find('img').attr('src'); }},
                name: 'icon'}
           ]
       };

    $.Control.extend('pane_conditionalFormatting', {
        setView: function(newView)
        {
            var cpObj = this;
            var _super = cpObj._super;
            var handler = function(ds)
            {
                _super.call(cpObj, ds);
                cpObj._view.bind('clear_temporary', function() { cpObj.reset(); }, cpObj);

                if ($.subKeyDefined(cpObj._parentView,
                    'metadata.conditionalFormatting.' + cpObj._view.id))
                {
                    var md = $.extend(true, {}, cpObj._view.metadata);
                    md.conditionalFormatting = $.union(
                        cpObj._parentView.metadata.conditionalFormatting[cpObj._view.id],
                        (md.conditionalFormatting || []));
                    cpObj._view.update({ metadata: md });
                }
            };

            if ($.subKeyDefined(newView, 'displayFormat.viewDefinitions'))
            {
                cpObj._parentView = newView;
                Dataset.lookupFromViewId(newView.displayFormat.viewDefinitions[0].uid, handler);
            }
            else
            { handler(newView); }
        },

        getTitle: function()
        { return 'Conditional Formatting'; },

        getSubtitle: function()
        {
            return 'Conditional Formatting allows you to change the background ' +
                'color of rows based on custom criteria. Each row will be assigned ' +
                'the color of the first matching condition.';
        },

        isAvailable: function()
        { return this._view.visibleColumns.length > 0 && this._view.valid; },

        getDisabledSubtitle: function()
        {
            return !this._view.valid ? 'This view must be valid' :
                'This view has no columns to filter';
        },

        _getCurrentData: function()
        { return this._super() || this._view; },

        _dataPreProcess: function(data)
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
        },

        _getSections: function()
        {
            return [{
                title: 'Conditions',
                fields: [
                    {type: 'repeater', minimum: 0, addText: 'Add New Rule',
                    name: 'metadata.conditionalFormatting',
                    field: {type: 'group', extraClass: 'conditionGroup', options: [
                        {type: 'text', text: 'Description', name: 'description',
                         prompt: 'Describe this match'},
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
                            {type: 'select', name: 'subColumn',
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
            }];
        },

        _getFinishButtons: function()
        { return [ {text: 'Apply', isDefault: true, value: true}, $.controlPane.buttons.cancel ]; },

        _finish: function(data, value, finalCallback)
        {
            var cpObj = this;
            if (!cpObj._super.apply(cpObj, arguments)) { return; }

            var resultObj = cpObj._getFormValues();
            var newMd = $.extend(true, {}, cpObj._view.metadata);
            newMd.conditionalFormatting = (resultObj.metadata || {}).conditionalFormatting;

            // Clean up any conditionalFormatting items that only have one child
            _.each(newMd.conditionalFormatting || [], function(cf)
            {
                if (cf.condition.operator == 'always')
                { cf.condition = true; }
                else if (cf.condition.children.length < 2)
                { cf.condition = cf.condition.children[0]; }
            });

            cpObj._view.update({metadata: newMd});

            if (cpObj._parentView)
            {
                var parentMD = $.extend(true, {}, cpObj._parentView.metadata);
                parentMD.conditionalFormatting = parentMD.conditionalFormatting || {};
                parentMD.conditionalFormatting[cpObj._view.id]
                    = (cpObj._view.metadata || {}).conditionalFormatting;
                cpObj._parentView.update({ metadata: parentMD });
            }

            cpObj._finishProcessing();
            if (_.isFunction(finalCallback)) { finalCallback(); }
        }

    }, {name: 'conditionalFormatting'}, 'controlPane');

    if ($.isBlank(blist.sidebarHidden.visualize) ||
        !blist.sidebarHidden.visualize.conditionalFormatting)
    { $.gridSidebar.registerConfig('visualize.conditionalFormatting', 'pane_conditionalFormatting', 10); }

})(jQuery);
