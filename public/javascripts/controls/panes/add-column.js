(function($)
{
    var getTypes = function(data)
    {
        var types = _(blist.datatypes).chain()
            .map(function(t, k)
            {
                return t.createable && ($.isBlank((data || {}).parentId) ||
                    !t.excludeInNestedTable) ?
                    {text: t.title, value: k, priority: t.priority} : null;
            })
            .compact()
            .sortBy(function(t) { return t.priority; })
            .value();

        if ($.isBlank((data || {}).parentId) && this._view.hasDatasetLinkColumn())
        {
            types.push({value: 'link', text: 'Link Column'});
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
        { return 'Add Column'; },

        getSubtitle: function()
        { return 'Add a new column to your dataset'; },

        getDisabledSubtitle: function()
        {
            return !this._view.valid ? 'This view must be valid' :
                'You cannot add a column to a view';
        },

        _getSections: function()
        {
            return [
                {
                    title: 'Basic Information',
                    fields: [
                        {text: 'Name', type: 'text', required: true, name: 'name', prompt: 'Enter a name'},
                        {text: 'Description', type: 'textarea',
                        name: 'description', prompt: 'Enter a description'}
                    ]
                },
                {
                    title: 'Column Type',
                    fields: [
                        {text: 'Data Type', type: 'select', required: true, prompt: 'Select a data type',
                        name: 'dataTypeName', options: getTypes},

                        {text: 'Key', type: 'columnSelect', name: 'format.linkedKey', required: true,
                            onlyIf: {field: 'dataTypeName', value: 'link'},
                            columns: {type: 'dataset_link', hidden: false}},
                        {text: 'Source', type: 'select', name: 'format.linkedSource', required: true,
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
                    title: 'Multiple Choice Options',
                    onlyIf: {field: 'dataTypeName', value: 'drop_down_list'},
                    fields: [
                        {type: 'repeater', addText: 'Add Option',
                        name: 'dropDownList.values',  minimum: 1,
                        field: {type: 'text', text: 'Option', name: 'description'}}
                    ]
                },

                // Dataset Link
                {
                    title: 'Linked Dataset',
                    onlyIf: {field: 'dataTypeName', value: 'dataset_link'},
                    fields: [
                        {text: 'Dataset', type: 'text', name: 'format.linkedDataset',
                            data: { '4x4uid': 'unverified' }, prompt: 'Dataset URL or 4x4 UID'
                        },
                        {text: 'Key Column', type: 'select', name: 'format.keyColumn',
                            linkedField: 'format.linkedDataset',
                            // allow selected value to be determined until options are loaded.
                            // this is done by setting default value to '_selected' and
                            // adding _selected attrib = true in the desired option.
                            defaultValue: '_selected',
                            options: Dataset.getLinkedDatasetOptionsDefault},
                        {text: 'Label Column', type: 'select', name: 'format.labelColumn',
                            linkedField: 'format.linkedDataset',
                            options: Dataset.getLinkedDatasetOptionsDefault}
                    ]
                },

                // Location convert
                {
                    title: 'Use Existing Latitude & Longitude',
                    onlyIf: {field: 'dataTypeName', value: 'location'},
                    type: 'selectable',
                    name: 'latLongSection',
                    fields: [
                        {text: 'Latitude', type: 'columnSelect', name: 'convert.latitudeColumn',
                            required: true, notequalto: 'convertNumber',
                            columns: {type: 'number', hidden: false, defaultNames: ['latitude', 'lat', 'y']}
                        },
                        {text: 'Longitude', type: 'columnSelect', name: 'convert.longitudeColumn',
                            required: true, notequalto: 'convertNumber',
                            columns: {type: 'number', hidden: false,
                                defaultNames: ['longitude', 'long', 'x']}
                        }
                    ]
                },
                {
                    title: 'Use Existing Address Columns',
                    onlyIf: {field: 'dataTypeName', value: 'location'},
                    type: 'selectable',
                    name: 'addressSection',
                    fields: [
                        {text: 'Street', type: 'radioGroup', name: 'convertStreetGroup',
                            defaultValue: 'streetNone',
                            options: [
                                {value: 'None', name: 'streetNone', type: 'static'},
                                {type: 'columnSelect', name: 'convert.addressColumn',
                                    notequalto: 'convertText',
                                    columns: {type: 'text', hidden: false,
                                        defaultNames: ['street address', 'street', 'address']} }
                            ]
                        },
                        {text: 'City', type: 'radioGroup', name: 'convertCityGroup',
                            defaultValue: 'cityNone',
                            options: [
                                {value: 'None', type: 'static', name: 'cityNone'},
                                {type: 'columnSelect', name: 'convert.cityColumn', notequalto: 'convertText',
                                    columns: {type: 'text', hidden: false, defaultNames: ['city']} },
                                {type: 'text', name: 'convert.cityValue', prompt: 'Enter a city'}
                            ]
                        },
                        {text: 'State', type: 'radioGroup', name: 'convertStateGroup',
                            defaultValue: 'stateNone',
                            options: [
                                {value: 'None', type: 'static', name: 'stateNone'},
                                {type: 'columnSelect', name: 'convert.stateColumn',
                                    notequalto: 'convertText',
                                    columns: {type: 'text', hidden: false, defaultNames: ['state']} },
                                {type: 'text', name: 'convert.stateValue', prompt: 'Enter a state'}
                            ]
                        },
                        {text: 'Zip Code', type: 'radioGroup', name: 'convertZipGroup',
                            defaultValue: 'zipNone',
                            options: [
                                {value: 'None', type: 'static', name: 'zipNone'},
                                {type: 'columnSelect', name: 'convert.zipColumn',
                                    notequalto: 'convertText convertNumber',
                                    columns: {type: ['text', 'number'], hidden: false,
                                        defaultNames: ['zip code', 'postal code', 'zip']} },
                                {type: 'text', name: 'convert.zipValue', prompt: 'Enter a zip code'}
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
                column.childColumns = [{dataTypeName: 'text', name: 'Untitled', width: 100}];
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
        cpObj._showMessage('Your column has been added');
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
            cpObj._view.reload();
        },
        function(xhr) { cpObj._genericErrorHandler(xhr); },
        $.extend({method: 'addressify', deleteOriginalColumns: false,
            location: column.name}, column.convert));
    };


    if ($.isBlank(blist.sidebarHidden.edit) || !blist.sidebarHidden.edit.addColumn)
    { $.gridSidebar.registerConfig('edit.addColumn', 'pane_addColumn', 1); }

})(jQuery);
