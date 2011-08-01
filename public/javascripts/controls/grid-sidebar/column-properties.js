(function($)
{
    if (blist.sidebarHidden.columnProperties) { return; }

    var isDataset = blist.dataset.type == 'blist';
    var canChangeName = isDataset || blist.dataset.type == 'grouped';

    var canConvert = function(col)
    {
        if ($.isBlank(col) || !blist.dataset.hasRight('update_column'))
        { return false; }

        var convT = col.dataType.convertableTypes;
        var dataTypePass = col.isLinked() ? true : _.isArray(convT) && convT.length > 0;
        return isDataset && $.isBlank(col.format.grouping_aggregate) && dataTypePass;
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

    var showLinkSection = function(c)
    {
        return $.isBlank(c) ? false : c.origColumn.isLinked();
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
        // First the most import currencies that every will use...
        {value: 'USD', text: "US Dollar"},
        {value: 'EUR', text: "Euro"},
        {value: 'GBP', text: "British Pound"},
        {value: 'JPY', text: "Japanese Yen"},
        {value: "CHF", text: "Swiss Franc"},
        // Now all the currencies that no one ever uses... 
        {value: "AFN", text: "Afghanistan, Afghanis"},
        {value: "ALL", text: "Albania, Leke"},
        {value: "ARS", text: "Argentina, Pesos"},
        {value: "AUD", text: "Australia, Dollars"},
        {value: "AZN", text: "Azerbaijan, New Manats"},
        {value: "BAM", text: "Bosnia and Herzegovina, Convertible Marka"},
        {value: "BBD", text: "Barbados, Dollars"},
        {value: "BGN", text: "Bulgaria, Leva"},
        {value: "BMD", text: "Bermuda, Dollars"},
        {value: "BOB", text: "Bolivia, Bolivianos"},
        {value: "BRL", text: "Brazil, Real"},
        {value: "BSD", text: "Bahamas, Dollars"},
        {value: "BWP", text: "Botswana, Pulas"},
        {value: "BYR", text: "Belarus, Rubles"},
        {value: "BZD", text: "Belize, Dollars"},
        {value: "CAD", text: "Canada, Dollars"},
        {value: "CLP", text: "Chile, Pesos"},
        {value: "CNY", text: "China, Yuan Renminbi"},
        {value: "COP", text: "Colombia, Pesos"},
        {value: "CRC", text: "Costa Rica, Colones"},
        {value: "CZK", text: "Czech Republic, Koruny"},
        {value: "DKK", text: "Denmark, Kroner"},
        {value: "DOP", text: "Dominican Republic, Pesos"},
        {value: "EEK", text: "Estonia, Krooni"},
        {value: "EGP", text: "Egypt, Pounds"},
        {value: "FJD", text: "Fiji, Dollars"},
        {value: "GHC", text: "Ghana, Cedis"},
        {value: "GTQ", text: "Guatemala, Quetzales"},
        {value: "GYD", text: "Guyana, Dollars"},
        {value: "HKD", text: "Hong Kong, Dollars"},
        {value: "HNL", text: "Honduras, Lempiras"},
        {value: "HRK", text: "Croatia, Kuna"},
        {value: "HUF", text: "Hungary, Forint"},
        {value: "IDR", text: "Indonesia, Rupiahs"},
        {value: "ILS", text: "Israel, New Shekels"},
        {value: "INR", text: "India, Rupees"},
        {value: "IRR", text: "Iran, Rials"},
        {value: "ISK", text: "Iceland, Kronur"},
        {value: "JMD", text: "Jamaica, Dollars"},
        {value: "KGS", text: "Kyrgyzstan, Soms"},
        {value: "KHR", text: "Cambodia, Riels"},
        {value: "KRW", text: "Korea, Won"},
        {value: "KZT", text: "Kazakhstan, Tenge"},
        {value: "LAK", text: "Laos, Kips"},
        {value: "LBP", text: "Lebanon, Pounds"},
        {value: "LKR", text: "Sri Lanka, Rupees"},
        {value: "LRD", text: "Liberia, Dollars"},
        {value: "LTL", text: "Lithuania, Litai"},
        {value: "LVL", text: "Latvia, Lati"},
        {value: "MKD", text: "Macedonia, Denars"},
        {value: "MNT", text: "Mongolia, Tugriks"},
        {value: "MXN", text: "Mexico, Pesos"},
        {value: "MYR", text: "Malaysia, Ringgits"},
        {value: "MZN", text: "Mozambique, Meticais"},
        {value: "NAD", text: "Namibia, Dollars"},
        {value: "NGN", text: "Nigeria, Nairas"},
        {value: "NIO", text: "Nicaragua, Cordobas"},
        {value: "NOK", text: "Norway, Krone"},
        {value: "NPR", text: "Nepal, Nepal Rupees"},
        {value: "NZD", text: "New Zealand, Dollar"},
        {value: "OMR", text: "Oman, Rials"},
        {value: "PEN", text: "Peru, Nuevos Soles"},
        {value: "PHP", text: "Philippines, Pesos"},
        {value: "PKR", text: "Pakistan, Rupees"},
        {value: "PLN", text: "Poland, Klotych"},
        {value: "PYG", text: "Paraguay, Guarani"},
        {value: "QAR", text: "Qatar, Rials"},
        {value: "RON", text: "Romania, New Lei"},
        {value: "RSD", text: "Serbia, Dinars"},
        {value: "RUB", text: "Russia, Rubles"},
        {value: "SAR", text: "Saudi Arabia, Riyals"},
        {value: "SEK", text: "Sweden, Kronor"},
        {value: "SGD", text: "Singapore, Dollars"},
        {value: "SOS", text: "Somalia, Shillings"},
        {value: "SYP", text: "Syria, Pounds"},
        {value: "THB", text: "Thailand, Baht"},
        {value: "TRY", text: "Turkey, New Lira"},
        {value: "TWD", text: "Taiwan, New Dollars"},
        {value: "UAH", text: "Ukraine, Hryvnia"},
        {value: "UYU", text: "Uruguay, Pesos"},
        {value: "UZS", text: "Uzbekistan, Sums"},
        {value: "VEF", text: "Venezuela, Bolivares Fuertes"},
        {value: "VND", text: "Vietnam, Dong"},
        {value: "YER", text: "Yemen, Rials"},
        {value: "ZAR", text: "South Africa, Rand"}
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
            return !blist.dataset.temporary || blist.dataset.minorChange;
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
                onlyIf: { func: function(c) { return !showLinkSection(c); } },
                fields: [
                    {text: 'Data Type', type: 'select', required: true,
                    name: 'dataTypeName', prompt: null, options: convertTypes},
                    {text: 'Data Type', type: 'static', value: staticDataType}
                ]
            },

            // Link Column
            {
                title: 'Link',
                onlyIf: { func: showLinkSection },
                fields: [
                    {text: 'Key', type: 'columnSelect', name: 'format.linkedKey',
                        required: true,
                        columns: {type: 'dataset_link', hidden: false},
                        wizard: {prompt: 'Choose a local key column'}
                    },
                    {text: 'Source', type: 'select', name: 'format.linkedSource',
                        required: true,
                        linkedField: 'format.linkedKey',
                        options:
                            // wrap in function to set up the "this" var
                            // so that it points to blist.dataset when
                            // getLinkedColumnOptions is called.
                            function(keyCol, notUsed, $field, curVal)
                            {
                                return blist.dataset.getLinkedColumnOptions.call(
                                    blist.dataset, keyCol, notUsed, $field, curVal);
                            },
                        wizard: 'Select a remote source column'
                    }
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
                    options: precisionStyle},
                    {text: 'No Commas', type: 'checkbox', name: 'format.noCommas'}
                ]
            },

            {
                title: 'Advanced Formatting',
                onlyIf: {func: function(c)
                {
                    if ($.isBlank(c)) { return false; }
                    return c.origColumn.renderTypeName == 'number';
                }},
                fields: [{text: 'Format Mask', type: 'text', name: 'format.mask'},
                    {type: 'note', value: 'Use #s to indicate numeric digits, ' +
                    'and other characters where you want them to go; for example ' +
                    'a social security number would be ###-##-####'},
                    {type: 'note', value: 'This may override some of your '+
                    'settings above.'}
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

            // URL
            {
                title: 'URL Options',
                onlyIf: {func: function(c)
                {
                    if ($.isBlank(c)) { return false; }
                    return c.origColumn.renderTypeName == 'url';
                }},
                fields: [
                        {text: 'Base URL', type: 'text', name: 'format.baseUrl',
                        prompt: 'Enter the common URL prefix', extraClass: 'url'}
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
                    {type: 'repeater', addText: 'Add RDF Properties',
                    name: 'format.rdf',  minimum: 0,
                    field:
                        {type: 'radioGroup', text: 'Semantics', name: 'rdfGroup',
                        options: [
                            {type: 'select', name: 'stock',
                            options: rdfOptions},
                            {type: 'text', name: 'custom',
                            prompt: 'Enter custom URL', extraClass: 'url'}
                        ]}
                    }
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

        // allow rollup column to be re-named.
        var section = _.detect(this.sections, function(s) { return s.title == 'Basic Information'});
        _.each(
            section.fields,
            function(f)
            {
                if (f.name == 'name' || f.name == 'description')
                {
                    f.disabled = !canChangeName && $.isBlank(cleanCol.format.grouping_aggregate)
                        && $.isBlank(cleanCol.format.drill_down);
                }
            });

        if (!$.isBlank(cleanCol.dropDownList))
        {
            cleanCol.dropDownList =
                {values: _.reject(cleanCol.dropDownList.values || [],
                        function(dd) { return dd.deleted; })};
        }

        if (!$.isBlank(col.format) && !$.isBlank(col.format.rdf))
        {
            cleanCol.format.rdf = [];
            var rdfProps = col.format.rdf.split(',');
            _.forEach(
                rdfProps,
                function(r)
                {
                    if (_.any(
                        rdfOptions,
                        function(stockR) { return stockR.value == r; }))
                    {
                        cleanCol.format.rdf.push({ stock: r });
                    }
                    else
                    {
                        cleanCol.format.rdf.push({ custom: r });
                    }
                });
        }

        return cleanCol;
    };

    config.finishCallback = function(sidebarObj, data, $pane, value)
    {
        if (!sidebarObj.baseFormHandler($pane, value)) { return; }

        var column = sidebarObj.getFormValues($pane);
        var col = data.origColumn;

        // Need to maintain drill_down and grouping_aggregate if present
        if (!$.isBlank(col.format))
        {
            column.format = column.format || {};
            column.format.drill_down = col.format.drill_down;
            column.format.grouping_aggregate = col.format.grouping_aggregate;
        }

        if (!$.isBlank(column.format) && !$.isBlank(column.format.rdf))
        {
            var rdfProps = _.map(
                column.format.rdf,
                function(rdf)
                {
                    return $.isBlank(rdf.stock) ? rdf.custom : rdf.stock;
                });

            column.format.rdf = rdfProps.join(',');
        }

        if (col.isLinked())
        {
            var keyColId = column.format.linkedKey;
            var srcColId = column.format.linkedSource;
            column.dataTypeName = blist.dataset.getLinkSourceDataType(null,
                srcColId, keyColId).value;
        }

        var newType = column.dataTypeName;
        delete column.dataTypeName;
        var needsConvert = !$.isBlank(newType) && newType != data.dataTypeName;

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
