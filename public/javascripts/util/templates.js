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
    var normalDownloadTypes = _.get(
      window,
      'blist.configuration.normalDownloadTypes',
      ['CSV', 'CSV for Excel', 'JSON', 'PDF', 'RDF', 'RSS', 'XLS', 'XLSX', 'XML']
    );
    $.templates.downloadsTable = {
        downloadTypes: {
            'obe_normal': normalDownloadTypes,
            'nbe_normal': [ 'CSV', 'JSON' ],
            'layer_attributes_v1': [ 'CSV', 'JSON' ], // for obe and nbe monolayer datasets
            'layer_attributes_v2': [ 'CSV', 'JSON', 'GeoJSON' ],
            'obe_geo': [ 'KML', 'KMZ', 'Shapefile', 'Original' ],
            'nbe_geo': [ 'KML', 'KMZ', 'Shapefile', 'Original', 'GeoJSON' ]
        },
        directive: {
            'obe_normal': {
                '.downloadsTable .downloadsList tbody .item': downloadTypesDirective('downloadTypes')
            },
            'nbe_normal': {
                '.downloadsTable .downloadsList tbody .item': downloadTypesDirective('downloadTypes')
            },
            'obe_geo': {
                '.downloadsTable .downloadsList tbody .item':
                    downloadTypesDirective('downloadTypes'),
                '.layerDownloadsContent .downloadsList tbody .item':
                    downloadTypesDirective('layerDownloadTypes', true)
            },
            'nbe_geo': {
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
