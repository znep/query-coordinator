class Displays::Map < Displays::Base
  def required_javascripts
    [ 'http://serverapi.arcgisonline.com/jsapi/arcgis/?v=1.5', 'shared-map' ]
  end

  def render_javascript_links
    result = super

    # Must insert js here rather than via required_javascriptsion because POS
    # asset packager will add ".js" extension
    result << <<-END
      <script type="text/javascript" src="http://maps.google.com/maps/api/js?sensor=false"></script>
    END

    result
  end

  def required_stylesheets
    [ 'http://serverapi.arcgisonline.com/jsapi/arcgis/1.5/js/dojo/dijit/themes/tundra/tundra.css', 'google-map' ]
  end

  def render_inline_runtime_js(context)
    js = <<-END
      blist.$display.GoogleMap({displayFormat: blist.display.options});
    END
    super << js
  end
end
