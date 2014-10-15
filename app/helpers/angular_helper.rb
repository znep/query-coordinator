module AngularHelper

  def angular_app
    params[:app]
  end

  def render_angular_config
    javascript_tag("var socrataConfig = #{JSON(angular_config)}")
  end

  def angular_config
    {
      statsdEnabled: APP_CONFIG['statsd_enabled'],
      useViewStubs: FeatureFlags.derive(nil, request)[:use_view_stubs],
      enableFullstoryTracking: FeatureFlags.derive(nil, request)[:enable_fullstory_tracking],
      enableAirbrakeJs: FeatureFlags.derive(nil, request)[:enable_airbrake_js]
    }
  end

  def angular_stylesheet_tag
    rendered_stylesheet_tag("angular-app-#{angular_app}")
  end

  def angular_javascript_tag
    include_javascripts_unminified("angular-app-#{angular_app}")
  end

  def render_airbrake_notifier
    return nil unless FeatureFlags.derive(nil, request)[:enable_airbrake_js]

    javascript_include_tag('exception_notifier.js')
  end

end
