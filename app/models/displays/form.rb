class Displays::Form < Displays::Base
  def scrolls_inline?
    false
  end

  def required_stylesheets
    [ 'displays-form' ]
  end

  def render_partial
    return 'displays/form_view'
  end

  def render_publishing_partial
    return 'displays/form_tab_publishing'
  end

end
