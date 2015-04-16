(function($)
{
    var getTypes = function(data)
    {
        var cpObj = this;
        var types = _(blist.datatypes).chain()
            .map(function(t, k)
            {
                var createable = t.createable;
                if (cpObj._view.newBackend)
                { createable = createable && !t.deprecatedInNbe; }
                return createable && ($.isBlank((data || {}).parentId) ||
                    !t.excludeInNestedTable) ?
                    {text: $.t('core.data_types.' + t.name), value: k, priority: t.priority} : null;
            })
            .compact()
            .sortBy(function(t) { return t.priority; })
            .value();

        if ($.isBlank((data || {}).parentId) && this._view.hasDatasetLinkColumn())
        {
            types.push({value: 'link', text: $.t('core.data_types.link')});
        }

        return types;
    };

    $.Control.extend('pane_addColumn', {
        isAvailable: function()
        {
            return this._view.valid &&
                (!this._view.temporary || this._view.minorChange) &&
                this._view.type == 'blist';
        },

        getTitle: function()
        { return $.t('screens.ds.grid_sidebar.add_column.title'); },

        getSubtitle: function()
        { return $.t('screens.ds.grid_sidebar.add_column.subtitle'); },

        getDisabledSubtitle: function()
        {
            return !this._view.valid ?
                $.t('screens.ds.grid_sidebar.base.validation.invalid_view') :
                $.t('screens.ds.grid_sidebar.add_column.validation.view_column');
        },

        _getSections: function()
        {
            return [
                {
                    title: $.t('screens.ds.grid_sidebar.column_common.basic.title'),
                    fields: [
                        {text: $.t('screens.ds.grid_sidebar.column_common.basic.name'), type: 'text', required: true, name: 'name', prompt: $.t('screens.ds.grid_sidebar.column_common.basic.name_prompt')},
                        {text: $.t('screens.ds.grid_sidebar.column_common.basic.description'), type: 'textarea',
                        name: 'description', prompt: $.t('screens.ds.grid_sidebar.column_common.basic.description_prompt')}
                    ]
                },
                {
                    title: $.t('screens.ds.grid_sidebar.column_common.type.title'),
                    fields: [
                        {text: $.t('screens.ds.grid_sidebar.column_common.type.type'), type: 'select', required: true, prompt: $.t('screens.ds.grid_sidebar.column_common.type.type_prompt'),
                        name: 'dataTypeName', options: getTypes},

                        {text: $.t('screens.ds.grid_sidebar.column_common.type.key'), type: 'columnSelect', name: 'format.linkedKey', required: true,
                            onlyIf: {field: 'dataTypeName', value: 'link'},
                            columns: {type: 'dataset_link', hidden: false}},
                        {text: $.t('screens.ds.grid_sidebar.column_common.type.source'), type: 'select', name: 'format.linkedSource', required: true,
                            onlyIf: {field: 'dataTypeName', value: 'link'}, linkedField: 'format.linkedKey',
                            options:
                                // wrap in function to set up the "this" var
                                // so that it points to the view when
                                // getLinkedColumnOptions is called.
                                function(keyCol, notUsed, $field, curVal)
                                {
                                    var v = this._view;
                                    return v.getLinkedColumnOptions.call(v, keyCol, notUsed, $field, curVal);
                                }
                        }
                    ]
                },

                // Multiple choice value chooser
                {
                    title: $.t('screens.ds.grid_sidebar.add_column.multiple_choice.title'),
                    onlyIf: {field: 'dataTypeName', value: 'drop_down_list'},
                    fields: [
                        {type: 'repeater', addText: $.t('screens.ds.grid_sidebar.add_column.multiple_choice.add_option_button'),
                        name: 'dropDownList.values',  minimum: 1,
                        field: {type: 'text', text: $.t('screens.ds.grid_sidebar.add_column.multiple_choice.option'), name: 'description'}}
                    ]
                },

                // Dataset Link
                {
                    title: $.t('screens.ds.grid_sidebar.column_common.linked_dataset.title'),
                    onlyIf: {field: 'dataTypeName', value: 'dataset_link'},
                    fields: [
                        {text: $.t('screens.ds.grid_sidebar.column_common.linked_dataset.dataset'), type: 'text', name: 'format.linkedDataset',
                            data: { '4x4uid': 'unverified' }, prompt: ''
                        },
                        {text: $.t('screens.ds.grid_sidebar.column_common.linked_dataset.key'), type: 'select', name: 'format.keyColumn',
                            linkedField: 'format.linkedDataset',
                            // allow selected value to be determined until options are loaded.
                            // this is done by setting default value to '_selected' and
                            // adding _selected attrib = true in the desired option.
                            defaultValue: '_selected',
                            options: Dataset.getLinkedDatasetOptionsDefault},
                        {text: $.t('screens.ds.grid_sidebar.column_common.linked_dataset.label'), type: 'select', name: 'format.labelColumn',
                            linkedField: 'format.linkedDataset',
                            options: Dataset.getLinkedDatasetOptionsDefault}
                    ]
                },

                // Location convert
                {
                    title: $.t('screens.ds.grid_sidebar.add_column.convert_latlong.title'),
                    onlyIf: {field: 'dataTypeName', value: 'location'},
                    type: 'selectable',
                    name: 'latLongSection',
                    fields: [
                        {text: $.t('screens.ds.grid_sidebar.add_column.convert_latlong.latitude'), type: 'columnSelect', name: 'convert.latitudeColumn',
                            required: true, notequalto: 'convertNumber',
                            columns: {type: 'number', hidden: false, defaultNames: ['latitude', 'lat', 'y']}
                        },
                        {text: $.t('screens.ds.grid_sidebar.add_column.convert_latlong.longitude'), type: 'columnSelect', name: 'convert.longitudeColumn',
                            required: true, notequalto: 'convertNumber',
                            columns: {type: 'number', hidden: false,
                                defaultNames: ['longitude', 'long', 'x']}
                        }
                    ]
                },
                {
                    title: $.t('screens.ds.grid_sidebar.add_column.convert_address.title'),
                    onlyIf: {field: 'dataTypeName', value: 'location'},
                    type: 'selectable',
                    name: 'addressSection',
                    fields: [
                        {text: $.t('screens.ds.grid_sidebar.add_column.convert_address.street'), type: 'radioGroup', name: 'convertStreetGroup',
                            defaultValue: 'streetNone',
                            options: [
                                {value: $.t('core.forms.none'), name: 'streetNone', type: 'static'},
                                {type: 'columnSelect', name: 'convert.addressColumn',
                                    notequalto: 'convertText',
                                    columns: {type: 'text', hidden: false,
                                        defaultNames: ['street address', 'street', 'address']} }
                            ]
                        },
                        {text: $.t('screens.ds.grid_sidebar.add_column.convert_address.city'), type: 'radioGroup', name: 'convertCityGroup',
                            defaultValue: 'cityNone',
                            options: [
                                {value: $.t('core.forms.none'), type: 'static', name: 'cityNone'},
                                {type: 'columnSelect', name: 'convert.cityColumn', notequalto: 'convertText',
                                    columns: {type: 'text', hidden: false, defaultNames: ['city']} },
                                {type: 'text', name: 'convert.cityValue', prompt: $.t('screens.ds.grid_sidebar.add_column.convert_address.city_prompt')}
                            ]
                        },
                        {text: $.t('screens.ds.grid_sidebar.add_column.convert_address.state'), type: 'radioGroup', name: 'convertStateGroup',
                            defaultValue: 'stateNone',
                            options: [
                                {value: $.t('core.forms.none'), type: 'static', name: 'stateNone'},
                                {type: 'columnSelect', name: 'convert.stateColumn',
                                    notequalto: 'convertText',
                                    columns: {type: 'text', hidden: false, defaultNames: ['state']} },
                                {type: 'text', name: 'convert.stateValue', prompt: $.t('screens.ds.grid_sidebar.add_column.convert_address.state_prompt')}
                            ]
                        },
                        {text: $.t('screens.ds.grid_sidebar.add_column.convert_address.zip_code'), type: 'radioGroup', name: 'convertZipGroup',
                            defaultValue: 'zipNone',
                            options: [
                                {value: $.t('core.forms.none'), type: 'static', name: 'zipNone'},
                                {type: 'columnSelect', name: 'convert.zipColumn',
                                    notequalto: 'convertText convertNumber',
                                    columns: {type: ['text', 'number'], hidden: false,
                                        defaultNames: ['zip code', 'postal code', 'zip']} },
                                {type: 'text', name: 'convert.zipValue', prompt: $.t('screens.ds.grid_sidebar.add_column.convert_address.zip_code_prompt')}
                            ]
                        }
                    ]
                }
            ];
        },

        _getFinishButtons: function()
        { return [$.controlPane.buttons.create, $.controlPane.buttons.cancel]; },

        _finish: function(data, value, finalCallback)
        {
            var cpObj = this;
            if (!cpObj._super.apply(this, arguments)) { return; }

            var column = cpObj._getFormValues();

            if (column.dataTypeName == 'nested_table')
            {
                column.childColumns = [{dataTypeName: 'text', name: $.t('screens.ds.grid_sidebar.add_column.nested_table.default_column_name'), width: 100}];
            }
            else if (column.dataTypeName == 'location' && !$.isBlank(column.convert))
            {
                convertLocation(cpObj, column, finalCallback);
                return;
            }
            else if (column.dataTypeName == 'link')
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
                column.dataTypeName =
                    cpObj._view.getLinkSourceDataType(null, srcColId, keyColId).value;
            }

            if (!$.isBlank((data || {}).parentId))
            {
                var parCol = cpObj._view.columnForID(data.parentId);
                parCol.addChildColumn(column,
                    function(nc) { columnCreated(cpObj, nc, finalCallback); },
                    function(xhr) { cpObj._genericErrorHandler(xhr); });
            }
            else
            {
                cpObj._view.addColumn(column,
                    function(nc) { columnCreated(cpObj, nc, finalCallback); },
                    function(xhr) { cpObj._genericErrorHandler(xhr); });
            }
        }
    }, {name: 'addColumn'}, 'controlPane');


    var columnCreated = function(cpObj, newCol, finalCallback)
    {
        cpObj._finishProcessing();
        cpObj._showMessage($.t('screens.ds.grid_sidebar.add_column.success'));
        cpObj._hide();
        if (_.isFunction(finalCallback)) { finalCallback(); }
    };

    var convertLocation = function(cpObj, column, finalCallback)
    {
        cpObj._view.addColumn(null, function(newCol)
        {
            if (!$.isBlank(column.description))
            {
                newCol.description = column.description;
                newCol.save(function(nc) { columnCreated(cpObj, nc, finalCallback); },
                    function(xhr) { cpObj._genericErrorHandler(xhr); });
            }
            else { columnCreated(cpObj, newCol, finalCallback); }
            // Since we imported data, need to reload
            cpObj._view.reload(true);
        },
        function(xhr) { cpObj._genericErrorHandler(xhr); },
        $.extend({method: 'addressify', deleteOriginalColumns: false,
            location: column.name}, column.convert));
    };


    if ($.isBlank(blist.sidebarHidden.edit) || !blist.sidebarHidden.edit.addColumn)
    { $.gridSidebar.registerConfig('edit.addColumn', 'pane_addColumn', 1); }

})(jQuery);
