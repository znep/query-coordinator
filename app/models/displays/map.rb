class Displays::Map < Displays::Base
  def invalid_message
    'Columns required for this map are missing'
  end

  def required_javascripts
    [ 'http://serverapi.arcgisonline.com/jsapi/arcgis/?v=1.6', 'shared-map' ]
  end

  def render_javascript_links
    result = super

    # Must insert js here rather than via required_javascriptsion because POS
    # asset packager will add ".js" extension
    result << <<-END
      <script type="text/javascript" src="http://maps.google.com/maps/api/js?sensor=false"></script>
      <script type="text/javascript" src="http://ecn.dev.virtualearth.net/mapcontrol/mapcontrol.ashx?v=6.2"></script>
    END

    result
  end

  def required_stylesheets
    [ 'http://serverapi.arcgisonline.com/jsapi/arcgis/1.5/js/dojo/dijit/themes/tundra/tundra.css' ]
  end

  def required_style_packages
    [ 'screen-map' ]
  end

  def render_inline_runtime_js(context)
    js = <<-END
      blist.$display.socrataMap({displayFormat: blist.display.options,
        invalid: blist.display.isInvalid});
    END
    super << js
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
