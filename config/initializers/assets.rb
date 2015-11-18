# Be sure to restart your server when you modify this file.

# Version of your assets, change this if you want to expire all your assets.
Rails.application.config.assets.version = '1.0'

# Add additional assets to the asset load path
# Rails.application.config.assets.paths << Emoji.images_path

Rails.application.config.assets.paths << Rails.root.join('vendor', 'assets', 'components')

# Precompile additional assets.
# application.js, application.css, and all non-JS/CSS in app/assets folder are already added.
# Rails.application.config.assets.precompile += %w( search.js )

Rails.application.config.assets.precompile += %w( editor.js )
Rails.application.config.assets.precompile += %w( view.js )
Rails.application.config.assets.precompile += %w( AssetFinder.js )
Rails.application.config.assets.precompile += %w( themes/themes.css )
Rails.application.config.assets.precompile += %w( story-view.css )
Rails.application.config.assets.precompile += %w( airbrake-js-client/dist/client.js )
Rails.application.config.assets.precompile += %w( admin.js )
Rails.application.config.assets.precompile += %w( admin.css )
