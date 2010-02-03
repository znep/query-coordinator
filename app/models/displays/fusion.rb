class Displays::Fusion < Displays::Base
    def initialize(view)
        super

        # Determine the type of chart to render
        @type = @view.displayFormat ? @view.displayFormat['type'] : 'unknown'

        # Fallback for legacy displays TODO - remove
        @type = @view.displayType
    end

    def type
        @type
    end
    
    def required_javascripts
        '/javascripts/util/FusionMaps.js'
    end

    def render_inline_setup_js(target_dom_id, context)
        result = super
        result << <<-END
            blist.display.options.wmode = 'opaque';
            blist.display.isFusionMap = true;
            blist.display.fusionMapSwf = #{@type.to_json} + '.swf';
            blist.display.invokeVisualization = true;
        END
        result
    end
end
