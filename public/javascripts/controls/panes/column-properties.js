(function($)
{
    var isDataset = function(cpObj) { return cpObj._view.type == 'blist'; };

    var nameDisabled = function(col)
    {
        // allow rollup column to be re-named.
        return !(isDataset(this) || this._view.type == 'grouped') &&
            $.isBlank(col.format.grouping_aggregate) && $.isBlank(col.format.drill_down);
    };

    var canConvert = function(cpObj, col)
    {
        if ($.isBlank(col) || !cpObj._view.hasRight('update_column'))
        { return false; }

        var convT = col.dataType.convertableTypes;
        var dataTypePass = col.isLinked() ? true : _.isArray(convT) && convT.length > 0;
        return isDataset(cpObj) && $.isBlank(col.format.grouping_aggregate) && dataTypePass;
    };

    var convertTypes = function(c)
    {
        if ($.isBlank(c) || !canConvert(this, c.origColumn)) { return 'hidden'; }
        var col = c.origColumn;

        var t = col.dataType;
        var types = [{text: $.t('core.data_types.' + col.renderTypeName), value: col.renderTypeName}];
        return types.concat(_(t.convertableTypes || []).chain()
            .sortBy(function(ct) { return blist.datatypes[ct].priority; })
            .map(function(ct) { return {value: ct, text: $.t('core.data_types.' + ct)}; }).value());
    };

    var showLinkSection = function(c)
    {
        return $.isBlank(c) ? false : c.origColumn.isLinked();
    };

    var staticDataType = function(c)
    {
        if ($.isBlank(c) || canConvert(this, c.origColumn)) { return ''; }
        var col = c.origColumn;

        var text = $.t('core.data_types.' + col.renderTypeName);
        if (!$.isBlank(col.format.grouping_aggregate))
        { text += ' (' + $.capitalize(col.format.grouping_aggregate) + ' on ' + col.dataType.title + ')'; }
        return text;
    };

    var alignmentOptions = function(c)
    {
        if ($.isBlank(c)) { return 'hidden'; }
        return c.origColumn.renderType.alignment || 'hidden';
    };

    var aggregateOptions = function(c)
    {
        if ($.isBlank(c) || _.isEmpty(c.origColumn.renderType.aggregates)) { return 'hidden'; }
        return _.map(c.origColumn.renderType.aggregates, function(a)
            { return $.extend({}, a, { value: blist.datatypes.aggregateFromSoda2(a.value) }); });
    };

    var viewOptions = function(c)
    {
        if ($.isBlank(c)) { return 'hidden'; }
        var col = c.origColumn;

        var type = col.renderType;
        var vt = type.viewTypes;
        if (_.isFunction(vt))
        { vt = vt(col); }

        if (_.include(['date', 'calendar_date'], col.renderTypeName))
        {
            var today = new Date();
            vt = _.map(vt, function(t)
            { return {text: today.format(type.formats[t.value]), value: t.value}; });
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
        blist.datatypes.money.currencies[c.value] + ')'}; });

    var rdfOptions = [];

    $.Control.extend('pane_columnProperties', {
        _init: function()
        {
            var cpObj = this;
            cpObj._super.apply(cpObj, arguments);

            cpObj._isReady = false;
            $.Tache.Get({url: '/api/rdfTerms.json', data: {type: 'property',
                'class': (cpObj._view.metadata || {}).rdfClass},
                success: function(rdfs)
                {
                    _.each(rdfs, function(r)
                    {
                        rdfOptions.push({value: r.CName, text: r.namespace + ': ' +
                            (r.displayName || r.name)});
                    });
                    cpObj._markReady();
                }});
        },

        getTitle: function()
        { return $.t('screens.ds.grid_sidebar.column_properties.title'); },

        getSubtitle: function()
        { return $.t('screens.ds.grid_sidebar.column_properties.subtitle'); },

        isAvailable: function()
        { return !this._view.temporary || this._view.minorChange; },

        getDisabledSubtitle: function()
        { return $.t('screens.ds.grid_sidebar.column_properties.validation.unsaved'); },

        render: function()
        {
            this._super.apply(this, arguments);
            if ($.subKeyDefined(this, '_curData.origColumn'))
            { this.$dom().loadingSpinner().setModel(this._curData.origColumn); }
        },

        _dataPreProcess: function(col)
        {
            var cleanCol = col.cleanCopy();
            cleanCol.origColumn = col;

            if (!$.isBlank(cleanCol.dropDownList))
            {
                cleanCol.dropDownList = {values: _.reject(cleanCol.dropDownList.values || [],
                        function(dd) { return dd.deleted; })};
            }

            if (!$.isBlank(col.format) && !$.isBlank(col.format.rdf))
            {
                cleanCol.format.rdf = [];
                var rdfProps = col.format.rdf.split(',');
                _.forEach(rdfProps, function(r)
                {
                    if (_.any(rdfOptions, function(stockR) { return stockR.value == r; }))
                    { cleanCol.format.rdf.push({ stock: r }); }
                    else
                    { cleanCol.format.rdf.push({ custom: r }); }
                });
            }

            return cleanCol;
        },

        _isReadOnly: function()
        {
            return this._view.isSnapshot() || this._view.isPublished() && this._view.isDefault();
        },

        _getReadOnlyMessage: function()
        {
            return $.t('screens.ds.grid_sidebar.column_properties.validation.published');
        },

        _getSections: function()
        {
            var cpObj = this;
            return [
                {
                    title: $.t('screens.ds.grid_sidebar.column_common.basic.title'),
                    fields: [
                        {text: $.t('screens.ds.grid_sidebar.column_common.basic.name'), type: 'text', required: true,
                        disabled: nameDisabled, name: 'name', prompt: $.t('screens.ds.grid_sidebar.column_common.basic.name_prompt')},
                        {text: $.t('screens.ds.grid_sidebar.column_common.basic.description'), type: 'textarea', disabled: nameDisabled,
                        name: 'description', prompt: $.t('screens.ds.grid_sidebar.column_common.basic.description_prompt')}
                    ]
                },

                {
                    title: $.t('screens.ds.grid_sidebar.column_common.type.title'),
                    onlyIf: { func: function(c) { return !showLinkSection(c); } },
                    fields: [
                        {text: $.t('screens.ds.grid_sidebar.column_common.type.type'), type: 'select', required: true,
                        name: 'dataTypeName', prompt: null, options: convertTypes},
                        {text: $.t('screens.ds.grid_sidebar.column_common.type.type'), type: 'static', value: staticDataType}
                    ]
                },

                // Link Column
                {
                    title: $.t('screens.ds.grid_sidebar.column_properties.link.title'),
                    onlyIf: { func: showLinkSection },
                    fields: [
                        {text: $.t('screens.ds.grid_sidebar.column_properties.link.key'), type: 'columnSelect', name: 'format.linkedKey', required: true,
                            columns: {type: 'dataset_link', hidden: false}},
                        {text: $.t('screens.ds.grid_sidebar.column_properties.link.source'), type: 'select', name: 'format.linkedSource', required: true,
                            linkedField: 'format.linkedKey',
                            options:
                                // wrap in function to set up the "this" var
                                // so that it points to blist.dataset when
                                // getLinkedColumnOptions is called.
                                function(keyCol, notUsed, $field, curVal)
                                {
                                    return cpObj._view.getLinkedColumnOptions.call(
                                        cpObj._view, keyCol, notUsed, $field, curVal);
                                }
                        }
                    ]
                },

                {
                    title: $.t('screens.ds.grid_sidebar.column_properties.formatting.title'),
                    onlyIf: {func: function(c)
                    {
                        if ($.isBlank(c)) { return false; }
                        var t = c.origColumn.renderType;
                        return !$.isBlank(t.alignment) || !$.isBlank(t.viewTypes);
                    }},
                    fields: [
                        {text: $.t('screens.ds.grid_sidebar.column_properties.formatting.alignment'), type: 'select', name: 'format.align',
                        prompt: null, options: alignmentOptions},
                        {text: $.t('screens.ds.grid_sidebar.column_properties.formatting.view_style'), type: 'select', name: 'format.view',
                        prompt: null, options: viewOptions}
                    ]
                },

                // Number-specific info
                {
                    title: $.t('screens.ds.grid_sidebar.column_properties.number.title'),
                    onlyIf: {func: function(c)
                    {
                        if ($.isBlank(c)) { return false; }
                        return _.include(['number', 'percent'], c.origColumn.renderTypeName);
                    }},
                    fields: [
                        {text: $.t('screens.ds.grid_sidebar.column_properties.number.precision'), type: 'radioGroup', name: 'precisionGroup',
                        defaultValue: 'format.precisionNone', options: [
                            {type: 'static', value: $.t('screens.ds.grid_sidebar.column_properties.number.no_precision'), name: 'format.precisionNone'},
                            {type: 'slider', minimum: 0, maximum: 10, defaultValue: 0,
                            name: 'format.precision'}]},
                        {text: $.t('screens.ds.grid_sidebar.column_properties.number.display'), type: 'select',
                        name: 'format.precisionStyle', prompt: null, options: precisionStyle},
                        {text: $.t('screens.ds.grid_sidebar.column_properties.number.no_commas'), type: 'checkbox', name: 'format.noCommas'}
                    ]
                },

                {
                    title: $.t('screens.ds.grid_sidebar.column_properties.number_advanced.title'),
                    onlyIf: {func: function(c)
                    {
                        if ($.isBlank(c)) { return false; }
                        return c.origColumn.renderTypeName == 'number';
                    }},
                    fields: [{text: $.t('screens.ds.grid_sidebar.column_properties.number_advanced.format_mask'), type: 'text', name: 'format.mask'},
                        {type: 'note', value: $.t('screens.ds.grid_sidebar.column_properties.number_advanced.format_mask_prompt')},
                        {type: 'note', value: $.t('screens.ds.grid_sidebar.column_properties.number_advanced.format_mask_warning')}
                    ]
                },

                // Money-specific styles
                {
                    title: $.t('screens.ds.grid_sidebar.column_properties.money.title'),
                    onlyIf: {func: function(c)
                    {
                        if ($.isBlank(c)) { return false; }
                        return c.origColumn.renderTypeName == 'money';
                    }},
                    fields: [
                        {text: $.t('screens.ds.grid_sidebar.column_properties.money.precision'), type: 'radioGroup',
                        name: 'moneyPrecisionGroup',
                        defaultValue: 'format.precisionNone', options: [
                            {type: 'static', value: $.t('screens.ds.grid_sidebar.column_properties.money.no_precision'), name: 'format.precisionNone'},
                            {type: 'slider', minimum: 0, maximum: 2, defaultValue: 2,
                            name: 'format.precision'}]},
                        {text: $.t('screens.ds.grid_sidebar.column_properties.money.currency'), type: 'select', name: 'format.currency', prompt: null,
                        defaultValue: 'dollar', options: currencyOptions},
                        {text: $.t('screens.ds.grid_sidebar.column_properties.money.abbreviated'), type: 'checkbox', name: 'format.humane'}
                    ]
                },

                // Number localization
                {
                    title: $.t('screens.ds.grid_sidebar.column_properties.localization.title'), type: 'selectable', showIfData: true,
                    onlyIf: { func: function(c)
                    {
                        if ($.isBlank(c)) { return false; }
                        return _.include(['number', 'percent', 'money'], c.origColumn.renderTypeName);
                    }},
                    fields: [
                        { text: $.t('screens.ds.grid_sidebar.column_properties.localization.decimal'), type: 'text', name: 'format.decimalSeparator',
                            defaultValue: '.' },
                        { text: $.t('screens.ds.grid_sidebar.column_properties.localization.thousands'), type: 'text', name: 'format.groupSeparator',
                            defaultValue: ',' }
                    ]
                },

                // Photo
                {
                    title: $.t('screens.ds.grid_sidebar.column_properties.photo.title'),
                    onlyIf: {func: function(c)
                    {
                        if ($.isBlank(c)) { return false; }
                        return c.origColumn.renderTypeName == 'photo';
                    }},
                    fields: [
                            {text: $.t('screens.ds.grid_sidebar.column_properties.photo.size'), type: 'select', name: 'format.size',
                            prompt: $.t('screens.ds.grid_sidebar.column_properties.photo.size_prompt'), options: [
                                { value: 'tiny', text: $.t('screens.ds.grid_sidebar.column_properties.photo.sizes.tiny') },
                                { value: 'thumb', text: $.t('screens.ds.grid_sidebar.column_properties.photo.sizes.thumb') },
                                { value: 'medium', text: $.t('screens.ds.grid_sidebar.column_properties.photo.sizes.medium') },
                                { value: 'featured', text: $.t('screens.ds.grid_sidebar.column_properties.photo.sizes.featured') },
                                { value: 'large', text: $.t('screens.ds.grid_sidebar.column_properties.photo.sizes.large') },
                                { value: '', text: $.t('screens.ds.grid_sidebar.column_properties.photo.sizes.original') }
                            ], defaultValue: ''}
                    ]
                },

                // URL
                {
                    title: $.t('screens.ds.grid_sidebar.column_properties.url.title'),
                    onlyIf: {func: function(c)
                    {
                        if ($.isBlank(c)) { return false; }
                        return c.origColumn.renderTypeName == 'url';
                    }},
                    fields: [
                            {text: $.t('screens.ds.grid_sidebar.column_properties.url.base_url'), type: 'text', name: 'format.baseUrl',
                            prompt: $.t('screens.ds.grid_sidebar.column_properties.url.base_url_prompt'), extraClass: 'url'}
                    ]
                },

                // Display order
                {
                    title: $.t('screens.ds.grid_sidebar.column_properties.display_order.title'), type: 'selectable',
                    name: 'displayOrder', showIfData: true,
                    onlyIf: {func: function(c)
                    {
                        if ($.isBlank(c)) { return false; }
                        return c.origColumn.renderTypeName == 'text';
                    }},
                    fields: [
                        {type: 'repeater', addText: $.t('screens.ds.grid_sidebar.column_properties.display_order.new_item_button'),
                            defaultValue: $.subKeyDefined(cpObj, '_curData.origColumn.cachedContents.top') ?
                                _.pluck(cpObj._curData.origColumn.cachedContents.top, 'item') : null,
                        name: 'metadata.displayOrder',  minimum: 0,
                        field: {type: 'text', text: $.t('screens.ds.grid_sidebar.column_properties.display_order.option'), name: 'orderItem'}}
                    ]
                },

                // Multiple choice value chooser
                {
                    title: $.t('screens.ds.grid_sidebar.column_properties.multiple_choice.title'),
                    onlyIf: {func: function(c)
                    {
                        if ($.isBlank(c)) { return false; }
                        return c.origColumn.renderTypeName == 'drop_down_list';
                    }},
                    fields: [
                        {type: 'repeater', addText: $.t('screens.ds.grid_sidebar.column_properties.multiple_choice.new_option_button'),
                        name: 'dropDownList.values',  minimum: 1, savedField: 'id',
                        field: {type: 'text', text: $.t('screens.ds.grid_sidebar.column_properties.multiple_choice.option'), name: 'description'}}
                    ]
                },

                // Dataset Link
                {
                    title: $.t('screens.ds.grid_sidebar.column_common.linked_dataset.title'),
                    onlyIf: {func: function(c)
                    {
                        if ($.isBlank(c)) { return false; }
                        return c.origColumn.renderTypeName == 'dataset_link';
                    }},
                    fields: [
                        {text: $.t('screens.ds.grid_sidebar.column_common.linked_dataset.dataset'), type: 'text', name: 'format.linkedDataset',
                            data: { '4x4uid': 'unverified'}, prompt: $.t('screens.ds.grid_sidebar.column_common.linked_dataset.dataset_prompt')},
                        {text: $.t('screens.ds.grid_sidebar.column_common.linked_dataset.key'), type: 'select', name: 'format.keyColumn',
                            // add column has default - rdf key.
                            // edit column has no default.  ui cannot tell the diff
                            // between default (unsaved) or saved value.
                            linkedField: 'format.linkedDataset',
                            options: Dataset.getLinkedDatasetOptionsNoDefault},
                        {text: $.t('screens.ds.grid_sidebar.column_common.linked_dataset.label'), type: 'select', name: 'format.labelColumn',
                            linkedField: 'format.linkedDataset',
                            options: Dataset.getLinkedDatasetOptionsDefault}
                    ]
                },

                {
                    title: $.t('screens.ds.grid_sidebar.column_properties.column_totals.title'),
                    onlyIf: {func: function(c)
                    {
                        if ($.isBlank(c)) { return false; }
                        return !$.isBlank(c.origColumn.renderType.aggregates);
                    }},
                    fields: [
                        {text: $.t('screens.ds.grid_sidebar.column_properties.column_totals.total'), type: 'select', name: 'format.aggregate',
                        prompt: $.t('screens.ds.grid_sidebar.column_properties.column_totals.total_prompt'), options: aggregateOptions}
                    ]
                },

                {
                    title: $.t('screens.ds.grid_sidebar.column_properties.advanced.title'), type: 'selectable', name: 'advanced',
                    fields: [
                        {text: $.t('screens.ds.grid_sidebar.column_properties.advanced.api_identifier'), type: 'text',
                         data: { 'fieldName': 'unverified' }, name: 'fieldName'},
                        {type: 'repeater', addText: $.t('screens.ds.grid_sidebar.column_properties.advanced.new_rdf_button'), name: 'format.rdf',  minimum: 0,
                        field:
                            {type: 'radioGroup', text: $.t('screens.ds.grid_sidebar.column_properties.advanced.semantics'), name: 'rdfGroup',
                            options: [
                                {type: 'select', name: 'stock', options: rdfOptions},
                                {type: 'text', name: 'custom', prompt: $.t('screens.ds.grid_sidebar.column_properties.advanced.url'), extraClass: 'url'}
                            ]}
                        }
                    ]
                }
            ];
        },

        _getFinishButtons: function()
        {
            return [$.extend({}, $.controlPane.buttons.update,
                    {requiresLogin: false}), $.controlPane.buttons.cancel];
        },

        _finish: function(data, value, finalCallback)
        {
            var cpObj = this;
            if (!cpObj._super.apply(cpObj, arguments)) { return; }

            var column = cpObj._getFormValues();
            var col = data.origColumn;

            if (!$.isBlank(col.format))
            {
                // Need to maintain grouping stuff if present
                column.format = column.format || {};
                _.each(['drill_down', 'grouping_aggregate', 'group_function'], function(k)
                        { column.format[k] = col.format[k]; });

                // Make sure default values for separators are not saved
                if (column.format.decimalSeparator == '.')
                { delete column.format.decimalSeparator; }
                if (column.format.groupSeparator == ',')
                { delete column.format.groupSeparator; }
            }

            if (!$.isBlank(column.format) && !$.isBlank(column.format.rdf))
            {
                var rdfProps = _.map(column.format.rdf, function(rdf)
                        { return $.isBlank(rdf.stock) ? rdf.custom : rdf.stock; });

                column.format.rdf = rdfProps.join(',');
            }

            if (col.isLinked())
            {
                var keyColId = column.format.linkedKey;
                if (_.isNumber(keyColId))
                {
                    var keyCol = this._view.columnForID(keyColId);
                    if (keyCol != null)
                    {
                        column.format.linkedKey = keyCol.fieldName;
                    }
                }
                var srcColId = column.format.linkedSource;
                column.dataTypeName = cpObj._view.
                    getLinkSourceDataType(null, srcColId, keyColId).value;
            }

            var newType = column.dataTypeName;
            delete column.dataTypeName;
            var needsConvert = !$.isBlank(newType) && newType != data.dataTypeName;

            var columnUpdated = function()
            {
                cpObj._finishProcessing();

                cpObj._showMessage($.t('screens.ds.grid_sidebar.column_properties.success'));
                _.defer(function() { cpObj._hide(); });
                if (_.isFunction(finalCallback)) { finalCallback(); }
            };

            col.update(column);
            col.view.trigger('columns_changed');
            col.view.invalidateMeta();
            if (!col.save(function(c)
                {
                    if (needsConvert)
                    {
                        var oldId = c.id;
                        var oldLookup = c.lookup;
                        c.convert(newType, function(convertedCol) {
                            columnUpdated();
                            var lookupMap = {};
                            lookupMap[oldLookup] = convertedCol.lookup;
                            c.view.trigger('columns_changed', ['lookupChange', lookupMap]);
                            },
                            function(xhr)
                            {
                                // Really shouldn't happen; but just in case...
                                cpObj._genericErrorHandler(xhr);
                            }
                        );
                    }
                    else
                    { columnUpdated(); }
                },
                function(xhr) { cpObj._genericErrorHandler(xhr); }
            ))
            { columnUpdated(); }
        }
    }, {name: 'columnProperties'}, 'controlPane');


    if (!blist.sidebarHidden.columnProperties)
    { $.gridSidebar.registerConfig('columnProperties', 'pane_columnProperties'); }

})(jQuery);
