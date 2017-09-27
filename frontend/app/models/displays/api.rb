class Displays::Api < Displays::Base
  def initialize(view)
    super
  end

  def type
    'api'
  end

  def name
    I18n.t('core.view_types.api')
  end

  def can_publish?
    false
  end

end
