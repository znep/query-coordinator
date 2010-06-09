(function($)
{
    if (blist.sidebarHidden.visualize &&
        blist.sidebarHidden.visualize.mapCreate) { return; }

    var mapTypes = [
        {text: 'Google Maps', value: 'google'},
        {text: 'Bing Maps', value: 'bing'},
        {text: 'ESRI ArcGIS', value: 'esri'}
    ];

    var arcgisBaseService = 'http://server.arcgisonline.com/ArcGIS/rest/services/';
    var mapLayers = [
        {text: 'Street Map',
            value: arcgisBaseService + 'World_Street_Map/MapServer',
            data: {type: 'tile'}},
        {text: 'Satellite Imagery',
            value: arcgisBaseService + 'World_Imagery/MapServer',
            data: {type: 'tile'}},
        {text: 'Detailed USA Topographic Map',
            value: arcgisBaseService + 'USA_Topo_Maps/MapServer',
            data: {type: 'tile'}},
        {text: 'Annotated World Topographic Map',
            value: arcgisBaseService + 'World_Topo_Map/MapServer',
            data: {type: 'tile'}},
        {text: 'Natural Earth Map',
            value: arcgisBaseService + 'World_Physical_Map/MapServer',
            data: {type: 'tile'}}
    ];

    var config =
    {
        name: 'visualize.mapCreate',
        title: 'Map',
        subtitle: 'Views with locations can be displayed as points on a map',
        onlyIf: function(view)
        {
            return _.select(view.columns, function(c)
                {
                    return c.dataTypeName == 'location' &&
                        ($.isBlank(c.flags) || !_.include(c.flags, 'hidden'));
                }).length > 0;
        },
        disabledSubtitle: 'This view must have a location column',
        sections: [
            {
                title: 'Map Setup',
                fields: [
                    {text: 'Name', name: 'name', type: 'text', required: true,
                        prompt: 'Enter a name',
                        wizard: {prompt: 'Enter a name for your map'}
                    },
                    {text: 'Map Type', name: 'displayFormat.type', type: 'select',
                        required: true, prompt: 'Select a map type',
                        options: mapTypes,
                        wizard: {prompt: 'Select a map type'}
                    }
                ]
            },
            {
                title: 'Location',
                fields: [
                    {text: 'Location', name: 'displayFormat.plot.locationId',
                        required: true, type: 'columnSelect', isTableColumn: true,
                        columns: {type: 'location', hidden: false},
                        wizard: {prompt: 'Choose a column with location coordinates to map'}
                    }
                ]
            },
            {
                title: 'Details', type: 'selectable', name: 'detailsSection',
                fields: [
                    {text: 'Title', name: 'displayFormat.plot.titleId',
                        type: 'columnSelect', isTableColumn: true,
                        columns: {type: ['text', 'location'], hidden: false},
                        wizard: {prompt: 'Choose a column that contains titles for each point'}
                    },
                    {text: 'Description', name: 'displayFormat.plot.descriptionId',
                        type: 'columnSelect', isTableColumn: true,
                        columns: {type: ['text', 'html', 'location'], hidden: false},
                        wizard: {prompt: 'Choose a column that contains descriptions for each point'}
                    }
                ],
                wizard: {prompt: 'Do you have titles or descriptions for your points?'}
            },
            {
                title: 'Layers',
                onlyIf: {field: 'displayFormat.type', value: 'esri'},
                fields: [
                    {type: 'repeater', minimum: 1, addText: 'Add Layer',
                        name: 'displayFormat.layers',
                        field: {type: 'group', requires: 'url', options: [
                            {text: 'Layer', type: 'select',
                                name: 'url',
                                defaultValue: mapLayers[0].value,
                                repeaterValue: '',
                                required: true, prompt: 'Select a layer',
                                options: mapLayers},
                            {text: 'Opacity', type: 'slider',
                                name: 'options.opacity',
                                defaultValue: 1, repeaterValue: 0.6,
                                minimum: 0, maximum: 1}
                        ]},
                        wizard: {prompt: 'Choose one or more layers to display for your map; and set their visibility'}
                    }
                ]
            }
        ],
        finishBlock: {
            buttons: [$.gridSidebar.buttons.create, $.gridSidebar.buttons.cancel],
            wizard: {prompt: "Now you're ready to create a new map"}
        }
    };

    config.finishCallback = function(sidebarObj, data, $pane, value)
    {
        if (!sidebarObj.baseFormHandler($pane, value)) { return; }

        var model = sidebarObj.$grid().blistModel();
        var view = blist.dataset.baseViewCopy(blist.display.view);
        view.displayType = 'map';

        $.extend(view, sidebarObj.getFormValues($pane));

        $.ajax({url: '/views.json', type: 'POST', data: JSON.stringify(view),
            dataType: 'json', contentType: 'application/json',
            error: function(xhr) { sidebarObj.genericErrorHandler($pane, xhr); },
            success: function(resp)
            {
                sidebarObj.resetFinish();
                blist.util.navigation.redirectToView(resp.id);
            }});
    };

    $.gridSidebar.registerConfig(config);

})(jQuery);
