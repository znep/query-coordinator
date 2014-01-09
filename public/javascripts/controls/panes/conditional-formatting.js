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
        text: $.t('screens.ds.grid_sidebar.conditional_formatting.format_html'),
        type: 'radioGroup', name: 'conditionIndicator', defaultValue: 'color',
        options: [
            {type: 'color', required: true, name: 'color', defaultValue: '#bbffbb'},
            {type: 'custom', required: true, disabled: function()
                { return !this._parentView // if there is a parentView, we know it's a map mashup
                    && !_.include(this._view.metadata.availableDisplayTypes, 'map'); },
                editorCallbacks: {
                create: function($field, vals, curValue)
                {
                    if (curValue)
                    { $field.append('<img src="' + curValue + '" /> '); }
                    var disabled = $field.parents(".radioLine").children(':disabled').length > 0;
                    if (disabled)
                    {
                        $field.append($.t('screens.ds.grid_sidebar.conditional_formatting.validation.no_icons'));
                        return true;
                    }
                    $field.append('(<a>' + $.t('screens.ds.grid_sidebar.conditional_formatting.change_icon') + '</a>)<input type="hidden" name="' +
                        $field.attr('name') + '" value="' + curValue + '" />');
                    var viewId = this._view.id;
                    $field.find('a').data('ajaxupload', new AjaxUpload($field, {
                        action: '/api/views/' + viewId + '/files.txt',
                        autoSubmit: true, responseType: 'json',
                        onComplete: function(file, response)
                        {
                            var imgUrl = '/api/views/' + viewId + '/files/' + response.file;
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
                    return true;
                },
                value: function($field) { return $field.find('img').attr('src'); }},
                name: 'icon'}
           ]
       };

    var meldWithParentCondFmt = function(cpObj)
    {
        var id = cpObj._parentView && cpObj._view.id == cpObj._parentView.id ? 'self' : cpObj._view.id;
        if ($.subKeyDefined(cpObj._parentView, 'metadata.conditionalFormatting.' + id))
        {
            var md = $.extend(true, {}, cpObj._view.metadata);
            md.conditionalFormatting = _.union(
                cpObj._parentView.metadata.conditionalFormatting[id],
                id == 'self' ? [] : (md.conditionalFormatting || []));
            cpObj._view.update({ metadata: md });
        }
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
                cpObj._view.bind('conditionalformatting_change', function() { cpObj.reset(); }, cpObj);

                meldWithParentCondFmt(cpObj);
            };

            if ($.subKeyDefined(newView, 'displayFormat.viewDefinitions'))
            {
                if (!$.isBlank(cpObj._parentView))
                { cpObj._parentView.unbind(null, null, cpObj); }
                cpObj._parentView = newView;
                cpObj._parentView.bind('clear_temporary', function() { cpObj.reset(); }, cpObj);
                cpObj._parentView.bind('displayformat_change', function()
                {
                    cpObj.setView(cpObj._parentView);
                    cpObj.reset();
                }, cpObj);
                cpObj._parentView.bind('conditionalformatting_change', function() { cpObj.reset(); }, cpObj);
                if (newView.displayFormat.viewDefinitions[0].uid == 'self')
                { handler(newView); }
                else
                { Dataset.lookupFromViewId(newView.displayFormat.viewDefinitions[0].uid, handler); }
            }
            else
            { handler(newView); }
        },

        getTitle: function()
        { return $.t('screens.ds.grid_sidebar.conditional_formatting.title'); },

        getSubtitle: function()
        {
            return $.t('screens.ds.grid_sidebar.conditional_formatting.subtitle');
        },

        isAvailable: function()
        { return this._view.visibleColumns.length > 0 && this._view.valid; },

        getDisabledSubtitle: function()
        {
            return !this._view.valid ? $.t('screens.ds.grid_sidebar.base.validation.invalid_view') :
                $.t('screens.ds.grid_sidebar.conditional_formatting.validation.no_columns');
        },

        _getCurrentData: function()
        { return this._super() || this._view; },

        _dataPreProcess: function(data)
        {
            var md = $.extend(true, {}, data.metadata);
            // Just in case this wasn't converted properly earlier...
            if ($.isPlainObject(md.conditionalFormatting))
            { md.conditionalFormatting = _.union.apply(this, _.values(md.conditionalFormatting)); }

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

        render: function()
        {
            meldWithParentCondFmt(this);
            this._super.apply(this, arguments);
        },

        _getSections: function()
        {
            return [{
                title: $.t('screens.ds.grid_sidebar.conditional_formatting.conditions.title'),
                fields: [
                    {type: 'repeater', minimum: 0, addText: $.t('screens.ds.grid_sidebar.conditional_formatting.conditions.new_rule_button'),
                    name: 'metadata.conditionalFormatting',
                    field: {type: 'group', extraClass: 'conditionGroup', options: [
                        {type: 'text', text: $.t('screens.ds.grid_sidebar.conditional_formatting.conditions.description'), name: 'description',
                         prompt: $.t('screens.ds.grid_sidebar.conditional_formatting.conditions.description_prompt')},
                        conditionIndicator,
                        {type: 'select', text: $.t('screens.ds.grid_sidebar.conditional_formatting.conditions.when_title'), prompt: null,
                            options: [{text: $.t('screens.ds.grid_sidebar.conditional_formatting.conditions.when.all'), value: 'and'},
                                {text: $.t('screens.ds.grid_sidebar.conditional_formatting.conditions.when.any'), value: 'or'},
                                {text: $.t('screens.ds.grid_sidebar.conditional_formatting.conditions.when.always'), value: 'always'}],
                            name: 'condition.operator'},
                        {type: 'repeater', minimum: 0, addText: $.t('screens.ds.grid_sidebar.conditional_formatting.conditions.new_condition_button'),
                            name: 'condition.children',
                            onlyIf: {field: 'condition.operator', value: 'always', negate: true},
                            field: {type: 'group', options: [
                            {type: 'columnSelect', text: $.t('screens.ds.grid_sidebar.conditional_formatting.conditions.item.title'), required: true,
                                name: 'tableColumnId', isTableColumn: true,
                                columns: {type: filterableTypes, hidden: false}},
                            {type: 'select', name: 'subColumn',
                                linkedField: 'tableColumnId', prompt: $.t('screens.ds.grid_sidebar.conditional_formatting.conditions.item.subcolumn'),
                                onlyIf: {field: 'tableColumnId', func: subColumnShown},
                                options: subColumns},
                            {type: 'select', name: 'operator', required: true,
                                linkedField: ['tableColumnId', 'subColumn'],
                                prompt: $.t('screens.ds.grid_sidebar.conditional_formatting.conditions.item.operator'), options: filterOperators},
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
        { return [ {text: $.t('core.dialogs.apply'), isDefault: true, value: true}, $.controlPane.buttons.cancel ]; },

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
                parentMD.conditionalFormatting[cpObj._view.id == cpObj._parentView.id ?
                    'self' : cpObj._view.id]
                    = (cpObj._view.metadata || {}).conditionalFormatting;
                cpObj._parentView.update({ metadata: parentMD });
            }

            cpObj._finishProcessing();
            if (_.isFunction(finalCallback)) { finalCallback(); }
        }

    }, {name: 'conditionalFormatting'}, 'controlPane');


    var forceOldVisualize = $.urlParam(window.location.href, 'visualize') == 'old' || blist.configuration.oldChartConfigForced;
    var isNewVisualize = $.urlParam(window.location.href, 'visualize') == 'nextgen' || (blist.configuration.newChartConfig && !forceOldVisualize);
    if (!isNewVisualize)
    { 
        if ($.isBlank(blist.sidebarHidden.visualize) ||
            !blist.sidebarHidden.visualize.conditionalFormatting)
        { $.gridSidebar.registerConfig('visualize.conditionalFormatting', 'pane_conditionalFormatting', 10); }
    } 
    else 
    {
        if (($.isBlank(blist.sidebarHidden.new_visualize) || !blist.sidebarHidden.filter.conditionalFormatting) && isNewVisualize)
        { $.gridSidebar.registerConfig('filter.conditionalFormatting', 'pane_conditionalFormatting', 10); }
    }

})(jQuery);
