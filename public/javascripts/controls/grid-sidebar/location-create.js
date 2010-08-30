(function($)
{
    var config =
    {
        name: 'locationCreate',
        title: 'Create a Location Column',
        subtitle: 'Create a blank column to fill in location data, or fill it with values from existing columns',
        sections: [
            {
                title: 'Column Information',
                fields: [
                    {text: 'Name', type: 'text', name: 'name', required: true,
                        defaultValue: 'Location', prompt: 'Enter a name'},
                    {text: 'Description', type: 'textarea',
                        name: 'description', prompt: 'Enter a description'}
                ]
            },
            {
                title: 'Use Existing Latitude & Longitude',
                type: 'selectable',
                name: 'latLongSection',
                fields: [
                    {text: 'Latitude', type: 'columnSelect',
                        name: 'convert.latitudeColumn',
                        required: true, notequalto: 'convertNumber',
                        columns: {type: 'number', hidden: false},
                        wizard: {prompt: 'Choose the column that contains latitude data'}
                    },
                    {text: 'Longitude', type: 'columnSelect',
                        name: 'convert.longitudeColumn',
                        required: true, notequalto: 'convertNumber',
                        columns: {type: 'number', hidden: false},
                        wizard: {prompt: 'Choose the column that contains longitude data'}
                    }
                ],
                wizard: {prompt: 'Does this dataset contain a latitude and longitude column?'}
            },
            {
                title: 'Use Existing US Address Columns',
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
                        wizard: {prompt: 'Choose the column that contains street address data'}
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
                        wizard: {prompt: 'Choose the column that contains city data, or fill in a value to be used for all rows'}
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
                        wizard: {prompt: 'Choose the column that contains state data, or fill in a value to be used for all rows'}
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
                        wizard: {prompt: 'Choose the column that contains zip code data, or fill in a value to be used for all rows'}
                    }
                ],
                wizard: {prompt: 'Does this dataset contain address column(s)?'}
            }
        ],
        finishBlock: {
            buttons: [$.gridSidebar.buttons.create, $.gridSidebar.buttons.cancel],
            wizard: {prompt: "Now you're ready to create a new column"}
        },
        wizard: {prompt: 'Does this dataset already contain one or more columns that represent a location?',
            actions: [
                {text: 'Yes', action: 'nextSection'},
                {text: 'No', action: 'finish'}
            ]
        }
    };


    config.finishCallback = function(sidebarObj, data, $pane, value)
    {
        if (!sidebarObj.baseFormHandler($pane, value)) { return; }

        var col = $.extend(sidebarObj.getFormValues($pane),
            {dataTypeName: data.columnType});

        if (!$.isBlank(col.convert))
        { convertLocation(sidebarObj, col, $pane); }
        else
        { createLocation(sidebarObj, col, $pane); }
    };

    var columnCreated = function(sidebarObj, newCol)
    {
        sidebarObj.finishProcessing();
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
            },
            function(xhr) { sidebarObj.genericErrorHandler($pane, xhr); },
            $.extend({method: 'addressify', deleteOriginalColumns: false,
                location: column.name}, column.convert));
    };

    var createLocation = function(sidebarObj, column, $pane)
    {
        blist.dataset.addColumn(column,
            function(nc) { columnCreated(sidebarObj, nc); },
            function(xhr) { sidebarObj.genericErrorHandler($pane, xhr); });
    };

    $.gridSidebar.registerConfig(config);

})(jQuery);
