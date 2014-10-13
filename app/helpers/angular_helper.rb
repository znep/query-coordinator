module AngularHelper

  def angular_app
    params[:app]
  end

  def angular_config
    {
      statsdEnabled: APP_CONFIG['statsd_enabled'],
      useViewStubs: FeatureFlags.derive(nil, request)[:use_view_stubs],
      enableFullstoryTracking: FeatureFlags.derive(nil, request)[:enable_fullstory_tracking]
    }
  end

  def angular_stylesheet_tag
    rendered_stylesheet_tag("angular-app-#{angular_app}")
  end

  def angular_javascript_tag
    include_javascripts_unminified("angular-app-#{angular_app}")
  end

end
