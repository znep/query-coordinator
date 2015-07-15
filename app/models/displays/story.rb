# This defines how to display a link to a new backend view
class Displays::Story < Displays::Base

  def type
    'story'
  end

  def name
    I18n.t('core.view_types.story')
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
    'icon-stories'
  end

end
