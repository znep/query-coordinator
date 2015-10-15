class Displays::DataLensMap < Displays::Base

  def type
    'map'
  end

  def name
    I18n.t('core.view_types.map')
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
    'data_lens_map'
  end
end
