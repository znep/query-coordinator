# Display properties for a visualization, which for the time being
# is to be treated as a data lens
class Displays::Visualization < Displays::Base

  def type
    'data_lens'
  end

  def name
    I18n.t('core.view_types.data_lens')
  end

  def title
    name
  end

  def icon_class
    'icon-cards'
  end

end
