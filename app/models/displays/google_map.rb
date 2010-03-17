class Displays::GoogleMap < Displays::Base
  def type
    'map'
  end

    def required_stylesheets
        [ 'google-map' ]
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

  def render_inline_runtime_js(context)
    <<-END
      blist.$display.GoogleMap();
    END
  end
end
