require 'hashie/extensions/ignore_undeclared'
require 'hashie/extensions/indifferent_access'

class AppConfig < Hashie::Trash
  include Hashie::Extensions::IgnoreUndeclared
  include Hashie::Extensions::IndifferentAccess

  as_int = lambda(&:to_i)
  as_interval = lambda { |str| str.to_i.minutes }

  # Services and service coordination
  property :consul_host
  property :coreservice_uri
  property :feature_flag_signaller_uri
  property :odysseus_app_name
  property :odysseus_uri
  property :zk_hosts

  # App tokens
  property :app_token
  property :data_cards_app_token

  # Ports
  property :http_port, default: 80, transform_with: as_int
  property :ssl_port, default: 443, transform_with: as_int

  # Tileserver
  property :tileserver_hosts

  # Search
  property :cetera_internal_uri

  # Sitemap
  property :sitemap_s3_url

  # Polaroid
  property :polaroid_hostname
  property :polaroid_port, transform_with: as_int

  # Catalog Federator service
  property :catalog_federator_url

  # Curated Region Job Queue
  property :curated_region_job_queue_hostname
  property :curated_region_job_queue_port, transform_with: as_int

  # Import Status Service
  property :import_status_service_hostname
  property :import_status_service_port

  # Dataset Management API
  property :dataset_management_api_hostname
  property :dataset_management_api_port

  # Esri Crawler service
  property :esri_crawler_hostname
  property :esri_crawler_port

  # Storyteller service
  property :storyteller_uri

  # Metrics
  property :atomic_metrics_flush, default: false
  property :metrics_dir
  property :metrics_batch_size, default: 100, transform_with: as_int
  property :statsd_enabled
  property :statsd_server

  # Third-party analytics and errors
  property :airbrake_api_key
  property :airbrake_project_id
  property :approvals_airbrake_api_key
  property :approvals_airbrake_project_id
  property :admin_goals_page_airbrake_api_key
  property :admin_goals_page_airbrake_project_id
  property :catalog_landing_page_airbrake_api_key
  property :catalog_landing_page_airbrake_project_id
  property :dataset_landing_page_airbrake_api_key
  property :dataset_landing_page_airbrake_project_id
  property :google_maps_site_key
  property :internal_asset_manager_airbrake_api_key
  property :internal_asset_manager_airbrake_project_id
  property :mixpanel_token
  property :opendata_ga_tracking_code
  property :op_measure_airbrake_api_key
  property :op_measure_airbrake_project_id
  property :publishing_airbrake_api_key
  property :publishing_airbrake_project_id
  property :recaptcha_2_secret_token
  property :recaptcha_2_site_key
  property :standard_ga_tracking_code
  property :visualization_canvas_airbrake_api_key
  property :visualization_canvas_airbrake_project_id
  property :pendo_token

  # Auth0
  property :auth0_id
  property :auth0_secret
  property :auth0_uri
  property :auth0_database_connection

  #Session
  property :default_session_time_minutes, default: 15.minutes, transform_with: as_interval

  # Data lens tuning parameters
  property :enable_png_download_ui
  property :enable_search_suggestions
  property :feature_map_disable_pan_zoom
  property :feature_map_features_per_tile
  property :feature_map_zoom_debounce
  property :feature_map_zoom_debounce
  property :shape_file_region_query_limit

  # Third-party survey configuration
  property :qualtrics, default: {}

  # Zendesk notifications configuration
  property :zendesk_notifications, default: {}

  # Dataset restore configuration
  property :restore_dataset_days, default: 5

  # Canary declaration
  property :canary, default: false

  # Caching
  property :cache_dataslate_routing, default: 1.minute

  # Configurable Roles Admin
  property :roles_admin_faq_url
  # Misc
  property :secondary_group_identifier
  property :threadpool_count, default: 0, transform_with: as_int

  def method_missing(name)
    message = "Attempted to access invalid property '#{name}' in AppConfig!"
    Airbrake.notify(
      :error_class => 'AppConfigInvalidProperty',
      :error_message => message
    )
    Rails.logger.error(message)
    raise message
  end

end
