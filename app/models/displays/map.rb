class Displays::Map < Displays::Base
  def invalid_message
    'Columns required for this map are missing'
  end

  def required_edit_javascripts
    ['shared-table-editor']
  end

  MAP_TYPES = [
    {'value' => 'google', 'label' => 'Google Maps'},
    {'value' => 'bing', 'label' => 'Bing Maps'},
    {'value' => 'esri', 'label' => 'ESRI ArcGIS'},
    {'value' => 'heatmap', 'label' => 'Heat Map'}
  ]

  HEATMAP_TYPES = [
    {'value' => 'countries', 'label' => 'Countries'},
    {'value' => 'state', 'label' => 'US States'},
    {'value' => 'counties', 'label' => 'Counties in'},
  ]

  ESRI_LAYERS = [
    {'url' => 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer', 'type' => 'tile', 'name' => 'Street Map'},
    {'url' => 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer', 'type' => 'tile', 'name' => 'Satellite Imagery'},
    {'url' => 'http://server.arcgisonline.com/ArcGIS/rest/services/USA_Topo_Maps/MapServer', 'type' => 'tile', 'name' => 'Detailed USA Topographic Map'},
    {'url' => 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer', 'type' => 'tile', 'name' => 'Annotated World Topographic Map'},
    {'url' => 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer', 'type' => 'tile', 'name' => 'Natural Earth Map'}
  ]
end
