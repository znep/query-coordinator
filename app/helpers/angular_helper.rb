module AngularHelper

  def angular_app
    params[:app]
  end

  def render_angular_config
    javascript_tag("var socrataConfig = #{JSON(angular_config)}")
  end

  def angular_config
    { 'statsdEnabled' => APP_CONFIG['statsd_enabled'] }.tap do |config|
      FeatureFlags.list.each do |feature_key|
        js_feature_key = "#{feature_key[0]}#{feature_key.camelize[1..-1]}"
        config.merge!(js_feature_key => FeatureFlags.derive(nil, request)[feature_key.to_sym])
      end
    end
  end

  def angular_stylesheet_tag
    rendered_stylesheet_tag("angular-app-#{angular_app}")
  end

  def angular_javascript_tag
    include_javascripts_unminified("angular-app-#{angular_app}")
  end

  def render_airbrake_notifier
    return nil unless FeatureFlags.derive(nil, request)[:enable_airbrake_js]

    include_javascripts_unminified('exception_notifier')
  end

end
