module DataLensHelper

  def angular_app
    params[:app]
  end

  def angular_translations
    LocaleCache.render_translations([LocalePart.angular])['angular'][angular_app]
  end

  def render_angular_config
    javascript_tag("var socrataConfig = #{JSON(angular_config)};")
  end

  def render_angular_translations
    old_translations = json_escape(angular_translations.to_json)
    new_translations = json_escape(LocaleCache.render_partial_translations(:angular).to_json)
    javascript_tag("var translations = #{old_translations}; var datalensTranslations = #{new_translations};")
  end

  def render_user
    javascript_tag("var currentUser = #{json_escape(@current_user.to_json)};")
  end

  def render_metadata
    # this may not be needed for all routes,
    # and the data lens code should gracefully handle its omission
    @migration_metadata ||= {}

    javascript_tag(
      "var pageMetadata = #{json_escape(@page_metadata.to_json)};\n" \
      "var datasetMetadata = #{json_escape(@dataset_metadata.to_json)};\n" \
      "var migrationMetadata = #{json_escape(@migration_metadata.slice(:nbeId, :obeId).to_json)};"
    )
  end

  def tileserver_hosts
    hosts = ENV['TILESERVER_HOSTS'] || APP_CONFIG.tileserver_hosts
    hosts.present? ? hosts.split(',').map { |value| value.strip } : []
  end

  def angular_config
    # Keys from APP_CONFIG that we want to include in FeatureFlags for use in the JS
    app_config_whitelist = %w(
      statsd_enabled
      data_cards_app_token
      feature_map_zoom_debounce
      enable_search_suggestions
      feature_map_disable_pan_zoom
      feature_map_features_per_tile
      shape_file_region_query_limit
      enable_png_download_ui
    )

    {
      'assetRevisionKey' => asset_revision_key,
      'siteTitle' => get_site_title,
      'railsEnv' => Rails.env,
      'cname' => CurrentDomain.cname,
      'locales' => {currentLocale: I18n.locale.to_s, defaultLocale: CurrentDomain.default_locale},
      'featureSet' => features,
      'themeV3' => theme,
      'tileserverHosts' => tileserver_hosts,
      'siteChromeEnabled' => enable_site_chrome?
    }.tap do |config|
      app_config_whitelist.each do |config_key|
        js_config_key = config_key.camelize(:lower)
        config.merge!(js_config_key => APP_CONFIG[config_key])
      end

      FeatureFlags.list.each do |feature_key|
        config.merge!(feature_key => FeatureFlags.derive(nil, request)[feature_key.to_sym])
      end

      data_lens_config.each do |key, value|
        js_key = key.camelize(:lower)
        config.merge!(js_key => value)
      end
    end
  end

  def angular_theme_tag
    theme = CurrentDomain.property('theme', 'theme_v3') || 'default'
    %Q{<link type="text/css" rel="stylesheet" media="all" href="/styles/individual/dataCards/theme/#{theme}.css?#{asset_revision_key}"/>}.html_safe
  end

  def features
    configuration_by_type('feature_set')
  end

  def theme
    configuration_by_type('theme_v3')
  end

  def data_lens_config
    configuration_by_type('data_lens_config') || {}
  end

  def configuration_by_type(key)
    # returns a hash of properties or nil
    config = CurrentDomain.configuration(key)
    config.properties unless config.nil?
  end

  def angular_stylesheet_tag
    rendered_stylesheet_tag("angular-app-#{angular_app}")
  end

  def angular_templates
    basedir = "#{Rails.root}/public"
    Dir.glob("#{basedir}/angular_templates/**/*.html").map do |path|
      { :id => path.gsub(basedir, ''), :template => File.read(path) }
    end
  end
end
