class Displays::Chart < Displays::Base
  def type
    'chart'
  end

  def name
    I18n.t('core.view_types.chart')
  end
end
