module MixpanelHelper
  include FeaturesHelper

  # The value for cookie_expiration is copied from the logic in frontend in the
  # render_mixpanel_config helper method:
  # https://github.com/socrata/platform-ui/blob/master/frontend/app/helpers/application_helper.rb#L884
  def mixpanel_config_options
    options = { secure_cookie: true, cookie_expiration: nil }
    options[:cookie_expiration] = 365 if full_mixpanel_tracking_feature_enabled?
    options
  end

end
