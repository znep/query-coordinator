(function($)
{
    if (blist.sidebarHidden.columnProperties) { return; }

    var isDataset = blist.dataset.type == 'blist';

    var canConvert = function(col)
    {
        if ($.isBlank(col) || !blist.dataset.hasRight('update_view'))
        { return false; }

        var convT = col.dataType.convertableTypes;
        return isDataset && $.isBlank(col.format.grouping_aggregate) &&
            _.isArray(convT) && convT.length > 0;
    };

    var convertTypes = function(c)
    {
        if ($.isBlank(c) || !canConvert(c.origColumn)) { return 'hidden'; }
        var col = c.origColumn;

        var t = col.dataType;
        var types = [{text: col.renderType.title, value: col.renderTypeName}];
        return types.concat(_(t.convertableTypes || []).chain()
            .sortBy(function(ct) { return blist.data.types[ct].priority; })
            .map(function(ct)
            { return {value: ct, text: blist.data.types[ct].title}; }).value());
    };

    var staticDataType = function(c)
    {
        if ($.isBlank(c) || canConvert(c.origColumn)) { return ''; }
        var col = c.origColumn;

        var text = col.renderType.title;
        if (!$.isBlank(col.format.grouping_aggregate))
        {
            text += ' (' + $.capitalize(col.format.grouping_aggregate) + ' on ' +
                col.dataType.title + ')';
        }
        return text;
    };

    var alignmentOptions = function(c)
    {
        if ($.isBlank(c)) { return 'hidden'; }
        return c.origColumn.renderType.alignment || 'hidden';
    };

    var aggregateOptions = function(c)
    {
        if ($.isBlank(c)) { return 'hidden'; }
        return c.origColumn.renderType.aggregates || 'hidden';
    };

    var viewOptions = function(c)
    {
        if ($.isBlank(c)) { return 'hidden'; }
        var col = c.origColumn;

        var type = col.renderType;
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

    var precisionStyle = function(c)
    {
        if ($.isBlank(c)) { return 'hidden'; }
        return c.origColumn.renderType.precisionStyle || 'hidden';
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
        onlyIf: function()
        {
            return !blist.dataset.temporary;
        },
        disabledSubtitle: 'You cannot edit column properties for an unsaved view',
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
                onlyIf: {func: function(c)
                {
                    if ($.isBlank(c)) { return false; }
                    var t = c.origColumn.renderType;
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
                onlyIf: {func: function(c)
                {
                    if ($.isBlank(c)) { return false; }
                    return _.include(['number', 'percent'],
                            c.origColumn.renderTypeName);
                }},
                fields: [
                    {text: 'Precision', type: 'radioGroup', name: 'precisionGroup',
                    defaultValue: 'format.precisionNone', options: [
                        {type: 'static', value: 'None',
                        name: 'format.precisionNone'},
                        {type: 'slider', minimum: 0, maximum: 10, defaultValue: 0,
                        name: 'format.precision'}]},
                    {text: 'Display', type: 'select',
                    name: 'format.precisionStyle', prompt: null,
                    options: precisionStyle}
                ]
            },

            // Money-specific styles
            {
                title: 'Money Formatting',
                onlyIf: {func: function(c)
                {
                    if ($.isBlank(c)) { return false; }
                    return c.origColumn.renderTypeName == 'money';
                }},
                fields: [
                    {text: 'Precision', type: 'radioGroup',
                    name: 'moneyPrecisionGroup',
                    defaultValue: 'format.precisionNone', options: [
                        {type: 'static', value: 'None',
                        name: 'format.precisionNone'},
                        {type: 'slider', minimum: 0, maximum: 2, defaultValue: 2,
                        name: 'format.precision'}]},
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
                onlyIf: {func: function(c)
                {
                    if ($.isBlank(c)) { return false; }
                    return c.origColumn.renderTypeName == 'drop_down_list';
                }},
                fields: [
                    {type: 'repeater', addText: 'Add Option',
                    name: 'dropDownList.values',  minimum: 1, savedField: 'id',
                    field: {type: 'text', text: 'Option', name: 'description'}}
                ]
            },

            // Dataset Link
            {
                title: 'Linked Dataset',
                onlyIf: {func: function(c)
                {
                    if ($.isBlank(c)) { return false; }
                    return c.origColumn.renderTypeName == 'dataset_link';
                }},
                fields: [
                    {text: 'Dataset', type: 'text', name: 'format.linkedDataset',
                        data: { '4x4uid': 'unverified'},
                        prompt: 'Dataset URL or 4x4 UID',
                        wizard: 'Enter the URL or 4x4 UID of the linked dataset'},
                    {text: 'Key Column', type: 'select', name: 'format.keyColumn',
                        // add column has default - rdf key.
                        // edit column has no default.  ui cannot tell the diff
                        // between default (unsaved) or saved value.
                        linkedField: 'format.linkedDataset',
                        options: Dataset.getLinkedDatasetOptionsNoDefault,
                        wizard: 'Select the key column'},
                    {text: 'Label Column', type: 'select', name: 'format.labelColumn',
                        linkedField: 'format.linkedDataset',
                        options: Dataset.getLinkedDatasetOptionsDefault,
                        wizard: 'Select the label column'}
                ]
            },

            {
                title: 'Column Totals',
                onlyIf: {func: function(c)
                {
                    if ($.isBlank(c)) { return false; }
                    return !$.isBlank(c.origColumn.renderType.aggregates);
                }},
                fields: [
                    {text: 'Total', type: 'select', name: 'format.aggregate',
                    prompt: 'Select a column total', options: aggregateOptions}
                ]
            },

            {
                title: 'Advanced', type: 'selectable', name: 'advanced',
                fields: [
                    {type: 'radioGroup', text: 'Semantics', name: 'rdfGroup',
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
            buttons: [$.extend({}, $.gridSidebar.buttons.update,
                {requiresLogin: false}), $.gridSidebar.buttons.cancel]
        }
    };


    var columnUpdated = function(sidebarObj, column)
    {
        sidebarObj.finishProcessing();

        sidebarObj.$dom().socrataAlert(
            {message: 'Your column has been updated', overlay: true});
        _.defer(function() { sidebarObj.hide(); });
    };

    var columnConverted = function(sidebarObj, oldId, column)
    {
        sidebarObj.finishProcessing();

        sidebarObj.$dom().socrataAlert(
            {message: 'Your column has been updated', overlay: true});
        _.defer(function() { sidebarObj.hide(); });
    };

    config.dataPreProcess = function(col)
    {
        var cleanCol = col.cleanCopy();
        cleanCol.origColumn = col;
        if (!$.isBlank(cleanCol.dropDownList))
        {
            cleanCol.dropDownList =
                {values: _.reject(cleanCol.dropDownList.values || [],
                        function(dd) { return dd.deleted; })};
        }

        if (!$.isBlank(cleanCol.format.rdf) && !_.any(rdfOptions, function(r)
                { return r.value == cleanCol.format.rdf; }))
        {
            cleanCol.format.customRdf = cleanCol.format.rdf;
            delete cleanCol.format.rdf;
        }

        return cleanCol;
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

        var col = data.origColumn;
        col.update(column);
        if (!col.save(function(c)
                {
                    if (needsConvert)
                    {
                        var oldId = c.id;
                        c.convert(newType,
                            function(convertedCol)
                            { columnConverted(sidebarObj, oldId, convertedCol); },
                            function(xhr)
                            {
                                // Really shouldn't happen; but just in case...
                                sidebarObj.genericErrorHandler($pane, xhr);
                            }
                        );
                    }
                    else
                    { columnUpdated(sidebarObj, c); }
                },
                function(xhr) { sidebarObj.genericErrorHandler($pane, xhr); }
            ))
        { columnUpdated(sidebarObj, col); }
    };

    $.gridSidebar.registerConfig(config);

    // Document ready; load data
    $(function()
    {
        _.defer(function()
        {
            $.Tache.Get({url: '/api/rdfTerms.json', data: {type: 'property',
                'class': (blist.dataset.metadata || {}).rdfClass},
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
