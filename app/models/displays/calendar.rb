class Displays::Calendar < Displays::Base
  def name
    I18n.t('core.view_types.calendar')
  end
end
