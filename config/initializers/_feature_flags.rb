# This file is underscore-prefixed because Rails loads initializers in alphabetical order,
# and other initializers may need to rely on these variables for further configuration.

# Enable or disable creating new tables off of filtered views.
Rails.application.config.enable_filtered_table_creation = (ENV['ENABLE_FILTERED_TABLE_CREATION'].to_s.downcase == 'true')

# Enable or disable Getty Images gallery
Rails.application.config.enable_getty_images_gallery = (ENV['ENABLE_GETTY_IMAGES_GALLERY'].to_s.downcase == 'true')

# Allows testing experimental OP goal embeds via big, ugly button.
Rails.application.config.enable_goal_embed_experimental = (ENV['ENABLE_GOAL_EMBED_EXPERIMENTAL'].to_s.downcase == 'true')
