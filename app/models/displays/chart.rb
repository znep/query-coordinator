class Displays::Chart < Displays::Base
  def valid?
    @view.has_columns_for_visualization_type? @view.displayType
  end

  def invalid_message
    'There are not enough columns to display this chart'
  end

  def type
    'visualization'
  end

  def required_javascripts
    [ 'shared-chart' ]
  end

  def required_stylesheets
    [ 'chart-screen' ]
  end

  def render_javascript_links
    # Must insert js here rather than via required_javascriptsion because POS
    # asset packager will add ".js" extension
    js = <<-END
    <!--[if IE]>
      <script type="text/javascript" src="/javascripts/plugins/excanvas.compiled.js"></script>
    <![endif]-->
    END

    super << js
  end

  def render_inline_runtime_js(context)
    js = <<-END
      blist.$display.socrataChart({displayFormat: blist.display.options,
        chartType: '#{@view.displayType}', invalid: blist.display.isInvalid});
    END
    super << js
  end

end
