module AngularHelper

  def angular_app
    params[:app]
  end

  def render_angular_config
    javascript_tag("var socrataConfig = #{JSON(angular_config)}")
  end

  def render_user
    javascript_tag("var currentUser = #{@current_user.to_json}")
  end

  def render_metadata
    javascript_tag(
      "var pageMetadata = #{@page_metadata.to_json}\n" \
      "var datasetMetadata = #{@dataset_metadata.to_json}"
    )
  end

  def angular_config
    {
      'statsdEnabled' => APP_CONFIG['statsd_enabled'],
      'assetRevisionKey' => asset_revision_key,
      'railsEnv' => Rails.env,
      'cname' => CurrentDomain.cname,
      'featureSet' => features,
      'themeV3' => theme,
      'tileserverHosts' => APP_CONFIG['tileserver_hosts'].present? ? APP_CONFIG['tileserver_hosts'].split(',') : []
    }.tap do |config|
      FeatureFlags.list.each do |feature_key|
        js_feature_key = "#{feature_key[0]}#{feature_key.camelize[1..-1]}"
        config.merge!(js_feature_key => FeatureFlags.derive(nil, request)[feature_key.to_sym])
      end
    end
  end

  def angular_theme_tag
    theme = CurrentDomain.property('theme', 'theme_v3') || 'default'
    return ("<link type=\"text/css\" rel=\"stylesheet\" media=\"all\" " +
            "href=\"/styles/individual/dataCards/theme/#{theme}.css?#{asset_revision_key}\"/>").html_safe
  end

  def features
    configuration_by_type('feature_set')
  end

  def theme
    configuration_by_type('theme_v3')
  end

  def configuration_by_type(key)
    config = ::Configuration.find_by_type(key, true, CurrentDomain.cname)
    config.first.properties unless config.empty?
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
