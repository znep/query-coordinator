(function($)
{
    if (blist.sidebarHidden.edit &&
        blist.sidebarHidden.edit.addColumn) { return; }

    var cachedLinkedDatasetOptions = {};

    var getTypes = function(data)
    {
        return _(blist.data.types).chain()
            .map(function(t, k)
            {
                return t.createable && ($.isBlank((data || {}).parentId) ||
                    !t.excludeInNestedTable) ?
                    {text: t.title, value: k, priority: t.priority} : null;
            })
            .compact()
            .sortBy(function(t) { return t.priority; })
            .value();
    };

    var configName = 'edit.addColumn';
    var config =
    {
        name: configName,
        priority: 1,
        title: 'Add Column',
        subtitle: 'Add a new column to your dataset',
        onlyIf: function(view)
        {
            return !blist.display.isInvalid && !blist.display.isTempView &&
                blist.datasetUtil.getDisplayType(blist.display.view) == 'Blist';
        },
        disabledSubtitle: function()
        {
            return blist.display.isInvalid ? 'This view must be valid' :
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
                    wizard: 'Choose what type of column you want'}
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
                        options: blist.dataset.getLinkedDatasetOptionsDefault,
                        wizard: 'Select the key column'},
                    {text: 'Label Column', type: 'select', name: 'format.labelColumn',
                        linkedField: 'format.linkedDataset',
                        options: blist.dataset.getLinkedDatasetOptionsDefault,
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
                        columns: {type: 'number', hidden: false},
                        wizard: {prompt: 'Choose the column that contains ' +
                            'latitude data'}
                    },
                    {text: 'Longitude', type: 'columnSelect',
                        name: 'convert.longitudeColumn',
                        required: true, notequalto: 'convertNumber',
                        columns: {type: 'number', hidden: false},
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
                                columns: {type: 'text', hidden: false} }
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
                                columns: {type: 'text', hidden: false} },
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
                                columns: {type: 'text', hidden: false} },
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
                                    hidden: false} },
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

        sidebarObj.$grid().blistModel().updateColumn(newCol);

        sidebarObj.$dom().socrataAlert(
            {message: 'Your column has been added', overlay: true});
        sidebarObj.hide();
    };

    var convertLocation = function(sidebarObj, column, $pane)
    {
        $.ajax({url: '/views/' + blist.display.view.id + '/columns.json?' +
            'method=addressify' +
            '&deleteOriginalColumns=false' +
            '&location=' + column.name + '&' +
            _.map(column.convert, function(v, k) { return k + '=' + v; }).join('&'),
            type: 'POST', contentType: 'application/json', dataType: 'json',
            error: function(xhr) { sidebarObj.genericErrorHandler($pane, xhr); },
            success: function(resp)
            {
                if (!$.isBlank(column.description))
                {
                    $.ajax({url: '/views/' + blist.display.view.id +
                        '/columns/' + resp.id + '.json', type: 'PUT',
                        contentType: 'application/json', dataType: 'json',
                        data: JSON.stringify({description: column.description}),
                        error: function(xhr)
                        { sidebarObj.genericErrorHandler($pane, xhr); },
                        success: function(nc) { columnCreated(sidebarObj, nc); }
                    });
                }
                else { columnCreated(sidebarObj, resp); }
            }
        });
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

        var url = '/views/' + blist.display.view.id + '/columns';
        if (!$.isBlank((data || {}).parentId))
        { url += '/' + data.parentId + '/sub_columns'; }
        url += '.json';
        $.ajax({url: url, type: 'POST', dataType: 'json',
            contentType: 'application/json', data: JSON.stringify(column),
            error: function(xhr) { sidebarObj.genericErrorHandler($pane, xhr); },
            success: function(nc) { columnCreated(sidebarObj, nc); }
        });
    };

    $.gridSidebar.registerConfig(config);

})(jQuery);
