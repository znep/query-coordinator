class Displays::DataLensChart < Displays::Base

  def type
    'chart'
  end

  def name
    I18n.t('core.view_types.chart')
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
    'data_lens_chart'
  end

end
