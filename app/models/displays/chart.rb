class Displays::Chart < Displays::Base
  def valid?
    @view.has_columns_for_visualization_type? chart_type
  end

  def can_be_edited?
    @view.has_columns_for_visualization_type?(chart_type, true)
  end

  def invalid_message
    'Columns required for this chart are missing'
  end

  def type
    'visualization'
  end

  def chart_type
    t = @options.chartType || @view.displayType
    CHART_TYPES[t] || t
  end

  def required_edit_javascripts
    [ 'shared-table-editor' ]
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
