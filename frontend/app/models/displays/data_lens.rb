# Display properties for a data lens
class Displays::DataLens < Displays::Base

  def type
    'data_lens'
  end

  def name
    I18n.t('core.view_types.data_lens')
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
    'data_lens'
  end

  def icon_class
    'icon-cards'
  end

end
