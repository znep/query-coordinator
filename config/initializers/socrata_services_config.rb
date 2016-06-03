Rails.application.config.coreservice_uri = begin
  uri = ENV['CORESERVICE_URI'] || 'http://localhost:8080'
  uri = "http://#{uri}" unless uri.starts_with?('http')
  uri
end

Rails.application.config.core_service_app_token = ENV['CORESERVICE_APP_TOKEN']

# These timeouts might turn out to be overly-aggressive. We will have
# to see how it goes.
Rails.application.config.core_service_request_open_timeout = ENV['CORESERVICE_OPEN_TIMEOUT'] || 5
Rails.application.config.core_service_request_read_timeout = ENV['CORESERVICE_READ_TIMEOUT'] || 5

# Base URI for the consul server in the current ENV
Rails.application.config.consul_service_uri = ENV['CONSUL_SERVICE_URI'] || 'http://localhost:8500'
Rails.application.config.consul_service_timeout = (ENV['CONSUL_SERVICE_TIMEOUT_SECONDS'] || 2).to_i

# Enable or disable Goal Tiles
Rails.application.config.enable_svg_visualizations = (ENV['ENABLE_SVG_VISUALIZATIONS'].to_s.downcase == 'true')

# Enable or disable creating new tables off of filtered views.
Rails.application.config.enable_filtered_table_creation = (ENV['ENABLE_FILTERED_TABLE_CREATION'].to_s.downcase == 'true')

# Change to metrics, which relies on a frontend fix
Rails.application.config.send_new_page_views_metric = (ENV['SEND_NEW_PAGE_VIEWS_METRIC'].to_s.downcase == 'true')

# Enable or disable Getty Images gallery
Rails.application.config.enable_getty_images_gallery = (ENV['ENABLE_GETTY_IMAGES_GALLERY'].to_s.downcase == 'true')

# Enable or disable visualization Authoring Workflow
Rails.application.config.enable_visualization_authoring_workflow = (ENV['ENABLE_VISUALIZATION_AUTHORING_WORKFLOW'].to_s.downcase == 'true')

# Enable or disable responsive images in view mode
# We initially set this to disabled until we can regenerate all the thumbnails for existing images
Rails.application.config.enable_responsive_images = (ENV['ENABLE_RESPONSIVE_IMAGES'].to_s.downcase == 'true')
