class Displays::Map < Displays::Base
    def can_publish?
        false
    end

    def required_javascripts
        [ 'http://serverapi.arcgisonline.com/jsapi/arcgis/?v=1.5', 'shared-map' ]
    end

    def required_stylesheets
        [ 'http://serverapi.arcgisonline.com/jsapi/arcgis/1.5/js/dojo/dijit/themes/tundra/tundra.css' ]
    end

    def render_inline_runtime_js(context)
        js = <<END
$('#dataGrid').blistMap(blist.display.options);
END
        super << js
    end
end
