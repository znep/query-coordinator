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
                    {text: 'Name', type: 'text', name: 'columnName',
                        prompt: 'Enter a name', required: true},
                    {text: 'Description', type: 'textarea',
                        name: 'columnDescription',
                        prompt: 'Enter a description'}
                ]
            },
            {
                title: 'Use Existing Latitude & Longitude',
                type: 'selectable',
                name: 'latLongSection',
                fields: [
                    {text: 'Latitude', type: 'columnSelect', name: 'convertLat',
                        required: true, notequalto: 'convertNumber',
                        columns: {type: 'number', hidden: false},
                        wizard: {prompt: 'Choose the column that contains latitude data'}
                    },
                    {text: 'Longitude', type: 'columnSelect',
                        name: 'convertLong',
                        required: true, notequalto: 'convertNumber',
                        columns: {type: 'number', hidden: false},
                        wizard: {prompt: 'Choose the column that contains longitude data'}
                    }
                ],
                wizard: {prompt: 'Does this dataset contain a latitude and longitude column?',
                    actions: $.gridSidebar.wizard.buttonGroups.sectionExpand}
            },
            {
                title: 'Use Existing US Address Columns',
                type: 'selectable',
                name: 'addressSection',
                fields: [
                    {text: 'Street', type: 'radioGroup',
                        name: 'convertStreetGroup',
                        options: [
                            {text: 'None', type: 'static', checked: true},
                            {type: 'columnSelect', name: 'convertStreetCol',
                                notequalto: 'convertText',
                                columns: {type: 'text', hidden: false} }
                        ],
                        wizard: {prompt: 'Choose the column that contains street address data',
                            actions: [
                                $.gridSidebar.wizard.buttons.skip,
                                $.gridSidebar.wizard.buttons.done
                            ]
                        }
                    },
                    {text: 'City', type: 'radioGroup', name: 'convertCityGroup',
                        options: [
                            {text: 'None', type: 'static', checked: true},
                            {type: 'columnSelect', name: 'convertCityCol',
                                notequalto: 'convertText',
                                columns: {type: 'text', hidden: false} },
                            {type: 'text', name: 'convertCityStatic',
                                prompt: 'Enter a city'}
                        ],
                        wizard: {prompt: 'Choose the column that contains city data, or fill in a value to be used for all rows',
                            actions: [
                                $.gridSidebar.wizard.buttons.skip,
                                $.gridSidebar.wizard.buttons.done
                            ]
                        }
                    },
                    {text: 'State', type: 'radioGroup',
                        name: 'convertStateGroup',
                        options: [
                            {text: 'None', type: 'static', checked: true},
                            {type: 'columnSelect', name: 'convertStateCol',
                                notequalto: 'convertText',
                                columns: {type: 'text', hidden: false} },
                            {type: 'text', name: 'convertStateStatic',
                                prompt: 'Enter a state'}
                        ],
                        wizard: {prompt: 'Choose the column that contains state data, or fill in a value to be used for all rows',
                            actions: [
                                $.gridSidebar.wizard.buttons.skip,
                                $.gridSidebar.wizard.buttons.done
                            ]
                        }
                    },
                    {text: 'Zip Code', type: 'radioGroup',
                        name: 'convertZipGroup',
                        options: [
                            {text: 'None', type: 'static', checked: true},
                            {type: 'columnSelect', name: 'convertZipCol',
                                notequalto: 'convertText convertNumber',
                                columns: {type: ['text', 'number'],
                                    hidden: false} },
                            {type: 'text', name: 'convertZipStatic',
                                prompt: 'Enter a zip code'}
                        ],
                        wizard: {prompt: 'Choose the column that contains zip code data, or fill in a value to be used for all rows',
                            actions: [
                                $.gridSidebar.wizard.buttons.skip,
                                $.gridSidebar.wizard.buttons.done
                            ]
                        }
                    }
                ],
                wizard: {prompt: 'Does this dataset contain address column(s)?',
                    actions: $.gridSidebar.wizard.buttonGroups.sectionExpand}
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

        if ($pane.find('.formSection.latLongSection .sectionSelect').value() ||
                $pane.find('.formSection.addressSection .sectionSelect').value())
        { convertLocation(sidebarObj, data, $pane); }
        else
        { createLocation(sidebarObj, data, $pane); }
    };

    var columnCreated = function(sidebarObj, newCol)
    {
        sidebarObj.$grid().blistModel().updateColumn(newCol);
        $(document).trigger(blist.events.COLUMNS_CHANGED, [newCol.id]);
        $.Tache.DeleteAll();
        sidebarObj.resetFinish();
        sidebarObj.hide();
    };

    var convertLocation = function(sidebarObj, data, $pane)
    {
        var useLatLong =
            $pane.find('.formSection.latLongSection .sectionSelect').value();
        var useAddress =
            $pane.find('.formSection.addressSection .sectionSelect').value();

        var latVal = useLatLong ? $pane.find('#convertLat').val() : null;
        var longVal = useLatLong ? $pane.find('#convertLong').val() : null;

        var streetIsCol = false;
        var streetVal;
        var cityIsCol = false;
        var cityVal;
        var stateIsCol = false;
        var stateVal;
        var zipIsCol = false;
        var zipVal;
        if (useAddress)
        {
            var $street = $pane.find(':input[name="convertStreetGroup"]:checked')
                .siblings('label').find(':input:not(.prompt)');
            streetIsCol = $street.is('select');
            streetVal = $street.val() || null;

            var $city = $pane.find(':input[name="convertCityGroup"]:checked')
                .siblings('label').find(':input:not(.prompt)');
            cityIsCol = $city.is('select');
            cityVal = $city.val() || null;

            var $state = $pane.find(':input[name="convertStateGroup"]:checked')
                .siblings('label').find(':input:not(.prompt)');
            stateIsCol = $state.is('select');
            stateVal = $state.val() || null;

            var $zip = $pane.find(':input[name="convertZipGroup"]:checked')
                .siblings('label').find(':input:not(.prompt)');
            zipIsCol = $zip.is('select');
            zipVal = $zip.val() || null;
        }

        $.ajax({url: '/views/' + blist.display.viewId + '/columns.json?' +
            'method=addressify' +
            '&deleteOriginalColumns=false' +
            '&location=' + ($pane.find('#columnName:not(.prompt)').val() || '') +
            (latVal ? '&latitudeColumn=' + latVal : '') +
            (longVal ? '&longitudeColumn=' + longVal : '') +
            (streetVal ? '&address' + (streetIsCol ? 'Column' : 'Value') +
                '=' + streetVal : '') +
            (cityVal ? '&city' + (cityIsCol ? 'Column' : 'Value') +
                '=' + cityVal : '') +
            (stateVal ? '&state' + (stateIsCol ? 'Column' : 'Value') +
                '=' + stateVal : '') +
            (zipVal ? '&zip' + (zipIsCol ? 'Column' : 'Value') +
                '=' + zipVal : ''),
            type: 'POST', contentType: 'application/json', dataType: 'json',
            error: function(xhr) { sidebarObj.genericErrorHandler($pane, xhr); },
            success: function(resp)
            {
                var desc = $pane.find('#columnDescription:not(.prompt)').val();
                if (desc)
                {
                    $.ajax({url: '/views/' + blist.display.viewId +
                        '/columns/' + resp.id + '.json', type: 'PUT',
                        contentType: 'application/json', dataType: 'json',
                        data: JSON.stringify({description: desc}),
                        error: function(xhr)
                        { sidebarObj.genericErrorHandler($pane, xhr); },
                        success: function(r) { columnCreated(sidebarObj, r); }
                    });
                }
                else { columnCreated(sidebarObj, resp); }
            }
        });
    };

    var createLocation = function(sidebarObj, data, $pane)
    {
        var column = {name: $pane.find('#columnName:not(.prompt)').val() || null,
            description:
                $pane.find('#columnDescription:not(.prompt)').val() || null,
            dataTypeName: data.columnType};

        $.ajax({url: '/views/' + blist.display.viewId + '/columns.json',
            type: 'POST', contentType: 'application/json', dataType: 'json',
            data: JSON.stringify(column),
            error: function(xhr) { sidebarObj.genericErrorHandler($pane, xhr); },
            success: function(resp) { columnCreated(sidebarObj, resp); }
        });
    };

    $.gridSidebar.registerConfig(config);

})(jQuery);
