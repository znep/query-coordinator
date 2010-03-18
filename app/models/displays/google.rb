class Displays::Google < Displays::Base
    def initialize(view)
        super

        # Determine google visualization package to load
        @type = @view.displayFormat ? @view.displayFormat['type'] : 'unknown'

        # Fallback for legacy displays TODO - remove
        @type = @view.displayType
    end

    def valid?
        @view.has_columns_for_visualization_type? @view.displayType
    end

    def type
      'visualization'
    end

    def render_javascript_links
        result = super

        # Must insert this JavaScript manually because it must execute before onload.  Must insert jsapi here rather
        # than via required_javascriptsion because POS asset packager will add ".js" extension
        result << <<-END
            <script type="text/javascript" src="http://www.google.com/jsapi"></script>
            <script type="text/javascript">
                google.load('visualization', '1', {'packages':[#{@type.to_json}]});
            </script>
        END

        result
    end

    def render_inline_setup_js(target_dom_id, context)
        result = super

        result << <<-END
            blist.display.invalid = #{!valid?};
            blist.display.options.wmode = 'opaque';
        END

        result
    end

    def render_inline_runtime_js(context)
        config = Displays::Config[@view.displayType]
        library = config['library'] if config

        # Note that chartClass gets set after the page loads so the proper google class is loaded
        <<-END
blist.display.chartClass = #{library || 'null'};
blist.$display.visualization(function() {
});
        END
    end
end
