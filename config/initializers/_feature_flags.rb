# This file is underscore-prefixed because Rails loads initializers in alphabetical order,
# and other initializers may need to rely on these variables for further configuration.

# Enable or disable Goal Tiles
Rails.application.config.enable_svg_visualizations = (ENV['ENABLE_SVG_VISUALIZATIONS'].to_s.downcase == 'true')

# Enable or disable creating new tables off of filtered views.
Rails.application.config.enable_filtered_table_creation = (ENV['ENABLE_FILTERED_TABLE_CREATION'].to_s.downcase == 'true')

# Enable or disable Getty Images gallery
Rails.application.config.enable_getty_images_gallery = (ENV['ENABLE_GETTY_IMAGES_GALLERY'].to_s.downcase == 'true')

# Enable or disable visualization Authoring Workflow
Rails.application.config.enable_visualization_authoring_workflow = (ENV['ENABLE_VISUALIZATION_AUTHORING_WORKFLOW'].to_s.downcase == 'true')
