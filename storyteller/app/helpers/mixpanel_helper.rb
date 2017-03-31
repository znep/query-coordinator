module MixpanelHelper

  FLAG = 'enable_storyteller_mixpanel'.freeze

  def mixpanel_tracking_enabled?
    Rails.application.config.mixpanel_token.present? &&
      Signaller.for(flag: FLAG).value(on_domain: request.host)
  end

end
