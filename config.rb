require 'fileutils'

compass_config do |config|
   config.output_style = :expanded
end

configure :development do
   activate :livereload
end

sprockets.append_path '/src/js'
set :source, 'docs'

set :css_dir, 'stylesheets'
set :js_dir, 'javascripts'
set :images_dir, 'images'

# Build-specific configuration
configure :build do
  # Enable cache buster
  activate :asset_hash

  # Use relative URLs
  activate :relative_assets
end

after_configuration do
  FileUtils.cp_r('./src/fonts', './docs/fonts')
end
