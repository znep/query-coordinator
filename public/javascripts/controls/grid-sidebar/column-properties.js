(function($)
{
    if (blist.sidebarHidden.columnProperties) { return; }

    var isDataset = blist.dataset.getDisplayType(blist.display.view) == 'Blist';

    var canConvert = function(col)
    {
        if ($.isBlank(col)) { return false; }
        var convT = blist.data.types[col.dataTypeName].convertableTypes;
        return isDataset && $.isBlank((col.format || {}).grouping_aggregate) &&
            _.isArray(convT) && convT.length > 0;
    };

    var convertTypes = function(col)
    {
        if ($.isBlank(col) || !canConvert(col)) { return 'hidden'; }

        var t = blist.data.types[col.dataTypeName];
        var types = [{text: blist.data.types[col.renderTypeName].title,
            value: col.renderTypeName}];
        return types.concat(_(t.convertableTypes || []).chain()
            .sortBy(function(ct) { return blist.data.types[ct].priority; })
            .map(function(ct)
            { return {value: ct, text: blist.data.types[ct].title}; }).value());
    };

    var staticDataType = function(col)
    {
        if ($.isBlank(col) || canConvert(col)) { return ''; }

        var text = blist.data.types[col.renderTypeName].title;
        if (!$.isBlank((col.format || {}).grouping_aggregate))
        {
            text += ' (' + $.capitalize(col.format.grouping_aggregate) + ' on ' +
                blist.data.types[col.dataTypeName].title + ')';
        }
        return text;
    };

    var alignmentOptions = function(col)
    {
        if ($.isBlank(col)) { return 'hidden'; }
        return blist.data.types[col.renderTypeName].alignment || 'hidden';
    };

    var aggregateOptions = function(col)
    {
        if ($.isBlank(col)) { return 'hidden'; }
        return blist.data.types[col.renderTypeName].aggregates || 'hidden';
    };

    var viewOptions = function(col)
    {
        if ($.isBlank(col)) { return 'hidden'; }

        var type = blist.data.types[col.renderTypeName];
        var vt = type.viewTypes;
        if (_.include(['date', 'calendar_date'], col.renderTypeName))
        {
            var today = new Date();
            vt = _.map(vt, function(t)
            {
                return {text: today.format(type.formats[t.value]),
                    value: t.value};
            });
        }

        return vt || 'hidden';
    };

    var precisionStyle = function(col)
    {
        if ($.isBlank(col)) { return 'hidden'; }
        return blist.data.types[col.renderTypeName].precisionStyle || 'hidden';
    };

    var currencyOptions = _.map([
        {value: 'dollar', text: "US Dollar"},
        {value: 'pound', text: "Pound"},
        {value: 'euro', text: "Euro"},
        {value: 'yen', text: "Yen/Yuan"},
        {value: 'forint', text: "Forint"},
        {value: 'hk_dollar', text: "Hong Kong Dollar"},
        {value: 'kuna', text: "Kuna"},
        {value: 'koruna', text: "Koruna"},
        {value: 'lats', text: "Lats"},
        {value: 'litas', text: "Litas"},
        {value: 'nt_dollar', text: "New Taiwan Dollar"},
        {value: 'peso', text: "Peso"},
        {value: 'real', text: "Real"},
        {value: 'rupiah', text: "Rupiah"},
        {value: 'rupee', text: "Rupee"},
        {value: 'koruna', text: "Koruna"},
        {value: 'lira', text: "Lira"},
        {value: 'new_lira', text: "New Lira"},
        {value: 'krone', text: "Krone"},
        {value: 'lei_noi', text: "Lei Noi"},
        {value: 'zloty', text: "Zloty"},
        {value: 'baht', text: "Baht"},
        {value: 'dong', text: "Dong"},
        {value: 'won', text: "Won"},
        {value: 'ruble', text: "Ruble"},
        {value: 'lev', text: "Lev"},
        {value: 'dinar', text: "Dinar"},
        {value: 'hryvnia', text: "Hryvnia"}
    ], function(c) { return {value: c.value, text: c.text + ' (' +
        blist.data.types.money.currencies[c.value] + ')'}; });

    var rdfOptions = [];

    var configName = 'columnProperties';
    var config =
    {
        name: configName,
        title: 'Column Properties',
        subtitle: 'Update various properites on this column',
        sections: [
            {
                title: 'Basic Information',
                fields: [
                    {text: 'Name', type: 'text', required: true,
                    disabled: !isDataset, name: 'name', prompt: 'Enter a name'},
                    {text: 'Description', type: 'textarea', disabled: !isDataset,
                    name: 'description', prompt: 'Enter a description'}
                ]
            },
            {
                title: 'Data Type',
                fields: [
                    {text: 'Data Type', type: 'select', required: true,
                    name: 'dataTypeName', prompt: null, options: convertTypes},
                    {text: 'Data Type', type: 'static', value: staticDataType}
                ]
            },
            {
                title: 'Formatting',
                onlyIf: {func: function(view, col)
                {
                    if ($.isBlank(col)) { return false; }
                    var t = blist.data.types[col.renderTypeName];
                    return !$.isBlank(t.alignment) || !$.isBlank(t.viewTypes);
                }},
                fields: [
                    {text: 'Alignment', type: 'select', name: 'format.align',
                    prompt: null, options: alignmentOptions},
                    {text: 'View Style', type: 'select', name: 'format.view',
                    prompt: null, options: viewOptions}
                ]
            },

            // Number-specific info
            {
                title: 'Number Formatting',
                onlyIf: {func: function(view, col)
                { return _.include(['number', 'percent'],
                    (col || {}).renderTypeName); }},
                fields: [
                    {text: 'Precision', type: 'slider',
                    minimum: 0, maximum: 10, defaultValue: 0,
                    name: 'format.precision'},
                    {text: 'Display', type: 'select',
                    name: 'format.precisionStyle', prompt: null,
                    options: precisionStyle}
                ]
            },

            // Money-specific styles
            {
                title: 'Money Formatting',
                onlyIf: {func: function(view, col)
                { return (col || {}).renderTypeName == 'money'; }},
                fields: [
                    {text: 'Precision', type: 'slider',
                    minimum: 0, maximum: 2, defaultValue: 2,
                    name: 'format.precision'},
                    {text: 'Currency', type: 'select',
                    name: 'format.currency', prompt: null,
                    defaultValue: 'dollar', options: currencyOptions},
                    {text: 'Abbreviated', type: 'checkbox',
                    name: 'format.humane'}
                ]
            },

            // Multiple choice value chooser
            {
                title: 'Multiple Choice Options',
                onlyIf: {func: function(view, col)
                { return (col || {}).renderTypeName == 'drop_down_list'; }},
                fields: [
                    {type: 'repeater', addText: 'Add Option',
                    name: 'dropDownList.values',  minimum: 1, savedField: 'id',
                    field: {type: 'text', text: 'Option', name: 'description'}}
                ]
            },

            {
                title: 'Column Totals',
                onlyIf: {func: function(view, col)
                {
                    if ($.isBlank(col)) { return false; }
                    return !$.isBlank(blist.data.types[
                        col.renderTypeName].aggregates);
                }},
                fields: [
                    {text: 'Total', type: 'select', name: 'format.aggregate',
                    prompt: 'Select a column total', options: aggregateOptions}
                ]
            },

            {
                title: 'Advanced', type: 'selectable', name: 'advanced',
                fields: [
                    {type: 'radioGroup', text: 'Semantics',
                    options: [
                        {type: 'select', name: 'format.rdf',
                        options: rdfOptions},
                        {type: 'text', name: 'format.customRdf',
                        prompt: 'Enter custom URL', extraClass: 'url'}
                    ]}
                ]
            }
        ],
        finishBlock: {
            buttons: [$.gridSidebar.buttons.update, $.gridSidebar.buttons.cancel]
        }
    };


    var columnUpdated = function(sidebarObj, column)
    {
        sidebarObj.finishProcessing();

        sidebarObj.$grid().blistModel().updateColumn(column);

        sidebarObj.$dom().socrataAlert(
            {message: 'Your column has been updated', overlay: true});
        _.defer(function() { sidebarObj.hide(); });
    };

    var columnConverted = function(sidebarObj, oldId, column)
    {
        sidebarObj.finishProcessing();

        sidebarObj.$grid().blistModel().convertColumn(oldId, column);

        sidebarObj.$dom().socrataAlert(
            {message: 'Your column has been updated', overlay: true});
        _.defer(function() { sidebarObj.hide(); });
    };

    config.dataPreProcess = function(col)
    {
        if (!$.isBlank(col.dropDown))
        {
            col.dropDownList = {values: _.reject(col.dropDown.values, function(dd)
                { return dd.deleted; })};
        }

        if (!$.isBlank((col.format || {}).rdf) && !_.any(rdfOptions, function(r)
                { return r.value == col.format.rdf; }))
        {
            col.format.customRdf = col.format.rdf;
            delete col.format.rdf;
        }

        return col;
    };

    config.finishCallback = function(sidebarObj, data, $pane, value)
    {
        if (!sidebarObj.baseFormHandler($pane, value)) { return; }

        var column = sidebarObj.getFormValues($pane);

        if (!$.isBlank(column.format))
        {
            column.format.rdf = column.format.rdf || column.format.customRdf;
            delete column.format.customRdf;
        }

        var newType = column.dataTypeName;
        delete column.dataTypeName;
        var needsConvert = !$.isBlank(newType) && newType != data.dataTypeName;

        var url = '/views/' + blist.display.view.id + '/columns/' +
            data.id + '.json';
        $.ajax({url: url, type: 'PUT', dataType: 'json',
            contentType: 'application/json', data: JSON.stringify(column),
            error: function(xhr) { sidebarObj.genericErrorHandler($pane, xhr); },
            success: function(c)
            {
                if (needsConvert)
                {
                    $.ajax({url: '/views/' + blist.display.view.id + '/columns/' +
                        c.id + '.json', data: {method: 'convert', type: newType},
                        type: 'POST', dataType: 'json',
                        error: function(xhr)
                        {
                            // Really shouldn't happen; but just in case...
                            sidebarObj.$grid().blistModel().updateColumn(c);
                            sidebarObj.genericErrorHandler($pane, xhr);
                        },
                        success: function(convertedCol)
                        { columnConverted(sidebarObj, c.id, convertedCol); }
                    });
                }
                else
                { columnUpdated(sidebarObj, c); }
            }
        });
    };

    $.gridSidebar.registerConfig(config);

    // Document ready; load data
    $(function()
    {
        _.defer(function()
        {
            $.Tache.Get({url: '/api/rdfTerms.json', data: {type: 'property',
                'class': (blist.display.view.metadata || {}).rdfClass},
                success: function(rdfs)
                {
                    _.each(rdfs, function(r)
                    {
                        rdfOptions.push({value: r.CName, text: r.namespace + ': ' +
                            (r.displayName || r.name)});
                    });
                }});
        });
    });

})(jQuery);
