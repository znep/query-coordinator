class Displays::Calendar < Displays::Base
  def type
    'calendar'
  end

  def name
    I18n.t('core.view_types.calendar')
  end
end
