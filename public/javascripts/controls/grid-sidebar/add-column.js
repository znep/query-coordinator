(function($)
{
    if (blist.sidebarHidden.edit &&
        blist.sidebarHidden.edit.addColumn) { return; }

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

        if ($.isBlank((data || {}).parentId) && blist.dataset.hasDatasetLinkColumn())
        {
            types.push({value: 'link', text: 'Link Column'});
        }

        return types;
    };

    var configName = 'edit.addColumn';
    var config =
    {
        name: configName,
        priority: 1,
        title: 'Add Column',
        subtitle: 'Add a new column to your dataset',
        onlyIf: function()
        {
            return blist.dataset.valid &&
                (!blist.dataset.temporary || blist.dataset.minorChange) &&
                blist.dataset.type == 'blist';
        },
        disabledSubtitle: function()
        {
            return !blist.dataset.valid ? 'This view must be valid' :
                'You cannot add a column to a view';
        },
        sections: [
            {
                title: 'Basic Information',
                fields: [
                    {text: 'Name', type: 'text', required: true,
                    name: 'name', prompt: 'Enter a name',
                    wizard: 'Enter a name for your new column'},
                    {text: 'Description', type: 'textarea',
                    name: 'description', prompt: 'Enter a description',
                    wizard: 'Enter a description to provide more information ' +
                        'about your new column'}
                ]
            },
            {
                title: 'Column Type',
                fields: [
                    {text: 'Data Type', type: 'select', required: true,
                    prompt: 'Select a data type',
                    name: 'dataTypeName', options: getTypes,
                    wizard: 'Choose what type of column you want'},

                    {text: 'Key', type: 'columnSelect', name: 'format.linkedKey',
                        required: true,
                        onlyIf: {field: 'dataTypeName', value: 'link'},
                        columns: {type: 'dataset_link', hidden: false},
                        wizard: {prompt: 'Choose a local key column'}
                    },
                    {text: 'Source', type: 'select', name: 'format.linkedSource',
                        required: true,
                        onlyIf: {field: 'dataTypeName', value: 'link'},
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

            // Multiple choice value chooser
            {
                title: 'Multiple Choice Options',
                onlyIf: {field: 'dataTypeName', value: 'drop_down_list'},
                fields: [
                    {type: 'repeater', addText: 'Add Option',
                    name: 'dropDownList.values',  minimum: 1,
                    field: {type: 'text', text: 'Option', name: 'description'},
                    wizard: 'Enter all the possible options for your ' +
                        'multiple choice column'}
                ]
            },

            // Dataset Link
            {
                title: 'Linked Dataset',
                onlyIf: {field: 'dataTypeName', value: 'dataset_link'},
                fields: [
                    {text: 'Dataset', type: 'text', name: 'format.linkedDataset',
                        data: { '4x4uid': 'unverified' },
                        prompt: 'Dataset URL or 4x4 UID',
                        wizard: 'Enter the URL or 4x4 UID of the linked dataset'
                    },
                    {text: 'Key Column', type: 'select', name: 'format.keyColumn',
                        linkedField: 'format.linkedDataset',
        // allow selected value to be determined until options are loaded.
        // this is done by setting default value to '_selected' and
        // adding _selected attrib = true in the desired option.
                        defaultValue: '_selected',
                        options: Dataset.getLinkedDatasetOptionsDefault,
                        wizard: 'Select the key column'},
                    {text: 'Label Column', type: 'select', name: 'format.labelColumn',
                        linkedField: 'format.linkedDataset',
                        options: Dataset.getLinkedDatasetOptionsDefault,
                        wizard: 'Select the label column'}
                ]
            },

            // Location convert
            {
                title: 'Use Existing Latitude & Longitude',
                onlyIf: {field: 'dataTypeName', value: 'location'},
                type: 'selectable',
                name: 'latLongSection',
                fields: [
                    {text: 'Latitude', type: 'columnSelect',
                        name: 'convert.latitudeColumn',
                        required: true, notequalto: 'convertNumber',
                        columns: {type: 'number', hidden: false,
                            defaultNames: ['latitude', 'lat', 'y']},
                        wizard: {prompt: 'Choose the column that contains ' +
                            'latitude data'}
                    },
                    {text: 'Longitude', type: 'columnSelect',
                        name: 'convert.longitudeColumn',
                        required: true, notequalto: 'convertNumber',
                        columns: {type: 'number', hidden: false,
                            defaultNames: ['longitude', 'long', 'x']},
                        wizard: {prompt: 'Choose the column that contains ' +
                            'longitude data'}
                    }
                ],
                wizard: {prompt: 'Does this dataset contain ' +
                    'latitude and longitude columns that you want to convert?'}
            },
            {
                title: 'Use Existing US Address Columns',
                onlyIf: {field: 'dataTypeName', value: 'location'},
                type: 'selectable',
                name: 'addressSection',
                fields: [
                    {text: 'Street', type: 'radioGroup',
                        name: 'convertStreetGroup',
                        defaultValue: 'streetNone',
                        options: [
                            {value: 'None', name: 'streetNone', type: 'static'},
                            {type: 'columnSelect', name: 'convert.addressColumn',
                                notequalto: 'convertText',
                                columns: {type: 'text', hidden: false,
                                    defaultNames: ['street address',
                                        'street', 'address']} }
                        ],
                        wizard: {prompt: 'Choose the column that contains ' +
                            'street address data'}
                    },
                    {text: 'City', type: 'radioGroup', name: 'convertCityGroup',
                        defaultValue: 'cityNone',
                        options: [
                            {value: 'None', type: 'static', name: 'cityNone'},
                            {type: 'columnSelect', name: 'convert.cityColumn',
                                notequalto: 'convertText',
                                columns: {type: 'text', hidden: false,
                                    defaultNames: ['city']} },
                            {type: 'text', name: 'convert.cityValue',
                                prompt: 'Enter a city'}
                        ],
                        wizard: {prompt: 'Choose the column that contains ' +
                            'city data, or fill in a value to be used for all rows'}
                    },
                    {text: 'State', type: 'radioGroup', name: 'convertStateGroup',
                        defaultValue: 'stateNone',
                        options: [
                            {value: 'None', type: 'static', name: 'stateNone'},
                            {type: 'columnSelect', name: 'convert.stateColumn',
                                notequalto: 'convertText',
                                columns: {type: 'text', hidden: false,
                                    defaultNames: ['state']} },
                            {type: 'text', name: 'convert.stateValue',
                                prompt: 'Enter a state'}
                        ],
                        wizard: {prompt: 'Choose the column that contains state ' +
                            'data, or fill in a value to be used for all rows'}
                    },
                    {text: 'Zip Code', type: 'radioGroup', name: 'convertZipGroup',
                        defaultValue: 'zipNone',
                        options: [
                            {value: 'None', type: 'static', name: 'zipNone'},
                            {type: 'columnSelect', name: 'convert.zipColumn',
                                notequalto: 'convertText convertNumber',
                                columns: {type: ['text', 'number'],
                                    hidden: false,
                                    defaultNames: ['zip code', 'postal code',
                                        'zip']} },
                            {type: 'text', name: 'convert.zipValue',
                                prompt: 'Enter a zip code'}
                        ],
                        wizard: {prompt: 'Choose the column that contains zip ' +
                            'code data, or fill in a value to be used for all rows'}
                    }
                ],
                wizard: {prompt: 'Does this dataset contain address column(s) ' +
                    'that you want to convert?'}
            }
        ],
        finishBlock: {
            buttons: [$.gridSidebar.buttons.create, $.gridSidebar.buttons.cancel],
            wizard: "Now you're ready to create a new column"
        }
    };


    var columnCreated = function(sidebarObj, newCol)
    {
        sidebarObj.finishProcessing();

        sidebarObj.$dom().socrataAlert(
            {message: 'Your column has been added', overlay: true});
        sidebarObj.hide();
    };

    var convertLocation = function(sidebarObj, column, $pane)
    {
        blist.dataset.addColumn(null,
            function(newCol)
            {
                if (!$.isBlank(column.description))
                {
                    newCol.description = column.description;
                    newCol.save(function(nc) { columnCreated(sidebarObj, nc); },
                        function(xhr)
                        { sidebarObj.genericErrorHandler($pane, xhr); });
                }
                else { columnCreated(sidebarObj, newCol); }
                // Since we imported data, need to reload
                blist.dataset.reload();
            },
            function(xhr) { sidebarObj.genericErrorHandler($pane, xhr); },
            $.extend({method: 'addressify', deleteOriginalColumns: false,
                location: column.name}, column.convert));
    };


    config.finishCallback = function(sidebarObj, data, $pane, value)
    {
        if (!sidebarObj.baseFormHandler($pane, value)) { return; }

        var column = sidebarObj.getFormValues($pane);

        if (column.dataTypeName == 'nested_table')
        {
            column.childColumns = [{dataTypeName: 'text',
                name: 'Untitled', width: 100}];
        }
        else if (column.dataTypeName == 'location' && !$.isBlank(column.convert))
        {
            convertLocation(sidebarObj, column, $pane);
            return;
        }
        else if (column.dataTypeName == 'link')
        {
            var keyColId = column.format.linkedKey;
            var srcColId = column.format.linkedSource;
            column.dataTypeName = blist.dataset.getLinkSourceDataType(null, srcColId, keyColId).value;
        }

        if (!$.isBlank((data || {}).parentId))
        {
            var parCol = blist.dataset.columnForID(data.parentId);
            parCol.addChildColumn(column,
                function(nc) { columnCreated(sidebarObj, nc); },
                function(xhr) { sidebarObj.genericErrorHandler($pane, xhr); });
        }
        else
        {
            blist.dataset.addColumn(column,
                function(nc) { columnCreated(sidebarObj, nc); },
                function(xhr) { sidebarObj.genericErrorHandler($pane, xhr); });
        }
    };

    $.gridSidebar.registerConfig(config);

})(jQuery);
