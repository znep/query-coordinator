# This defines how to display a link to a new backend view
class Displays::NewView < Displays::Base

  def type
    'new_view'
  end

  def name
    I18n.t('core.view_types.new_view')
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
    'link'
  end

  def icon_class
    'icon-cards'
  end

end
