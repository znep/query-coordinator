class Displays::Map < Displays::Base
  def type
    'map'
  end

  def name
    I18n.t('core.view_types.map')
  end

  def display_type
    'geo'
  end
end
