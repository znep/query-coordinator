require "#{Rails.root}/../lib/shared/load_paths"

require "#{Rails.root}/../lib/shared/fontana/approval/workflow"
require "#{Rails.root}/../lib/shared/fontana/approval/step"
require "#{Rails.root}/../lib/shared/fontana/approval/task"

# Be sure to restart your server when you modify this file.
include ::Shared::LoadPaths

# Version of your assets, change this if you want to expire all your assets.
Rails.application.config.assets.version = '1.0'

Rails.application.config.assets.paths += SCSS_LOAD_PATHS

# Precompile additional assets.
# application.js, application.css, and all non-JS/CSS in app/assets folder are already added.
# Rails.application.config.assets.precompile += %w( search.js )

Rails.application.config.assets.precompile += %w( sinon-server-1.17.3.js )
Rails.application.config.assets.precompile += %w( themes/themes.css )
Rails.application.config.assets.precompile += %w( story-view.css )
Rails.application.config.assets.precompile += %w( print.css )
Rails.application.config.assets.precompile += %w( admin.css )
Rails.application.config.assets.precompile += %w( tile.css )
Rails.application.config.assets.precompile += %w( error.css )
