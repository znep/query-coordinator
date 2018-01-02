# Display properties for an Open Performance standalone measure
class Displays::Measure < Displays::Base

  def type
    'measure'
  end

  def name
    I18n.t('core.view_types.measure')
  end

  def title
    name
  end

  def scrolls_inline?
    false
  end

  def render_partial
    'displays/blob'
  end

  def display_type
    'measure'
  end

  def icon_class
    'icon-op-measure'
  end

end
