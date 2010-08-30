class Displays::Calendar < Displays::Base
  def invalid_message
    'Columns required for this calendar are missing'
  end

  def scrolls_inline?
    false
  end

  def required_javascripts
    [ 'shared-calendar' ]
  end

  def required_edit_javascripts
    ['shared-table-editor']
  end

  def required_stylesheets
    [ 'fullcalendar' ]
  end

  def required_style_packages
    [ 'screen-calendar' ]
  end

  def render_inline_runtime_js(context)
    js = <<END
blist.$display.socrataCalendar({view: blist.dataset});
END
    super << js
  end
end
