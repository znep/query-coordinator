class Displays::Chart < Displays::Base
  def valid?
    @view.has_columns_for_visualization_type? chart_type
  end

  def can_be_edited?
    @view.has_columns_for_visualization_type?(chart_type, true)
  end

  def invalid_message
    'There are not enough columns to display this chart'
  end

  def type
    'visualization'
  end

  def chart_type
    t = @options.chartType || @view.displayType
    CHART_TYPES[t] || t
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
        chartType: '#{chart_type}', invalid: blist.display.isInvalid});
    END
    super << js
  end

  CHART_TYPES = { 'imagesparkline' => 'line',
                  'annotatedtimeline' => 'timeline',
                  'areachart' => 'area',
                  'barchart' => 'bar',
                  'columnchart' => 'column',
                  'linechart' => 'line',
                  'piechart' => 'pie'
  }
end
