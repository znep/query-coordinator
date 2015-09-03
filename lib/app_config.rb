class AppConfig < Hashie::Dash

  as_int = ->(val) { val.to_i }

  # Services and service coordination
  property :coreservice_uri
  property :odysseus_uri
  property :odysseus_app_name
  property :intercessio_uri
  property :consul_host
  property :zk_hosts

  # App tokens
  property :app_token
  property :data_cards_app_token

  # Ports
  property :http_port, default: 80, transform_with: as_int
  property :ssl_port, default: 443, transform_with: as_int

  # Tileserver
  property :tileserver_hosts
  property :tileserver_hostname
  property :tileserver_port, transform_with: as_int

  # Search
  property :cetera_host

  # Polaroid
  property :polaroid_hostname
  property :polaroid_port, transform_with: as_int

  # Metrics
  property :metrics_dir
  property :statsd_enabled
  property :statsd_server

  # Third-party analytics and errors
  property :opendata_ga_tracking_code
  property :airbrake_api_key
  property :mixpanel_token

  # Auth0
  property :auth0_uri
  property :auth0_id
  property :auth0_secret
  property :auth0_jwt

  # RPX/JanRain auth
  property :rpx_facebook_url
  property :rpx_twitter_url
  property :rpx_googleplus_url
  property :rpx_windowslive_url
  property :rpx_signin_url

  # Data lens tuning parameters
  property :feature_map_disable_pan_zoom
  property :feature_map_zoom_debounce
  property :feature_map_features_per_tile
  property :odux_enable_feature_map
  property :shape_file_region_query_limit
  property :enable_png_download_ui
  property :enable_search_suggestions

  # Misc
  property :threadpool_count, default: 0, transform_with: as_int
  property :secondary_group_identifier
  property :max_core_server_requests

  def method_missing(name)
    message = "Attempted to access invalid property '#{name}' in AppConfig!"
    Airbrake.notify(
      :error_class => 'AppConfigInvalidProperty',
      :error_message => message
    )
    Rails.logger.error(message)
  end

end
