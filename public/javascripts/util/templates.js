;(function($)
{
    $.templates = $.templates || {};

    // TEMPLATE:
    //   Downloads Table; renders a table with downloadable types for a view
    // DEPENDENCIES:
    //   combination-list.js
    var downloadTypesDirective = function(typeName, isDynamic) {
        var directive = {};
        directive['downloadType<-' + typeName] = {
            '.type a': '#{downloadType}',
            '.type a@data-type': '#{downloadType}',
            '.type a@href': function(args)
            {
                if (isDynamic) { return '#download'; }
                return args.context.view.downloadUrl(args.item);
            },
            '@class+': function(args)
            {
                return args.item.toLowerCase() + 'Download';
            }
            // TODO: add download count when supported
        };
        return directive;
    };

    $.templates.downloadsTable = {
        downloadTypes: {
            'normal': [ 'CSV', 'JSON', 'PDF', 'RDF', 'RSS', 'XLS', 'XLSX', 'XML'  ],
            'geo_attributes': [ 'CSV', 'JSON' ],
            'nbe': [ 'CSV', 'JSON' ],
            'geo': [ 'KML', 'KMZ', 'Shapefile', 'Original' ]
        },
        directive: {
            'normal': {
                '.downloadsTable .downloadsList tbody .item': downloadTypesDirective('downloadTypes')
            },
            'nbe': {
                '.downloadsTable .downloadsList tbody .item': downloadTypesDirective('downloadTypes')
            },
            'geo': {
                '.downloadsTable .downloadsList tbody .item':
                    downloadTypesDirective('downloadTypes'),
                '.layerDownloadsContent .downloadsList tbody .item':
                    downloadTypesDirective('layerDownloadTypes', true)
            }
        },
        postRender: function($elem)
        {
            $elem.find('table.gridList').combinationList({
                headerContainerSelector: $elem.find('.gridListWrapper'),
                initialSort: [[0, 0]],
                scrollableBody: false,
                selectable: false,
                sortGrouping: false,
                sortHeaders: {0: {sorter: 'text'}}
            });
        }
    };

})(jQuery);
