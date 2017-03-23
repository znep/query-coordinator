class Displays::Pulse < Displays::Base

  def type
    'pulse'
  end

  def name
    I18n.t('core.view_types.pulse')
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
    'pulse'
  end

  def icon_class
    'icon-pulse'
  end

end
