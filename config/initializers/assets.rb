# Be sure to restart your server when you modify this file.

# Version of your assets, change this if you want to expire all your assets.
Rails.application.config.assets.version = '1.0'

# Add additional assets to the asset load path
# Rails.application.config.assets.paths << Emoji.images_path

Rails.application.config.assets.paths << Rails.root.join('spec', 'scripts')
Rails.application.config.assets.paths << Rails.root.join('node_modules')

# Precompile additional assets.
# application.js, application.css, and all non-JS/CSS in app/assets folder are already added.
# Rails.application.config.assets.precompile += %w( search.js )

Rails.application.config.assets.precompile += %w( sinon-server-1.17.3.js )
Rails.application.config.assets.precompile += %w( themes/themes.css )
Rails.application.config.assets.precompile += %w( story-view.css )
Rails.application.config.assets.precompile += %w( print.css )
Rails.application.config.assets.precompile += %w( admin.css )
Rails.application.config.assets.precompile += %w( tile.css )
Rails.application.config.assets.precompile += %w( 404.css )
