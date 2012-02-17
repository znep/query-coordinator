# This defines how to display an HREF-dataset, e.g.g a link to another page
class Displays::Href < Displays::Base
  def type
    'href'
  end

  def name
    I18n.t('core.view_types.href')
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
end
