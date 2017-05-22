require 'fileutils'

set :source, 'pages'

set :css_dir, 'stylesheets'
set :js_dir, 'javascripts'
set :images_dir, 'images'

# Build-specific configuration
configure :build do
  # Use relative URLs
  activate :relative_assets
end

activate :external_pipeline,
  name: :gulp,
  command: build? ? 'npm run gulp' : 'npm run watch',
  source: 'dist'
