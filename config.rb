require 'fileutils'

compass_config do |config|
   config.output_style = :expanded
end

configure :development do
   activate :livereload
end

sprockets.append_path '../src'
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
  if !File.exists?('./docs/fonts')
  	FileUtils.mkdir('./docs/fonts')
  end
  FileUtils.cp(Dir.glob('./src/fonts/socrata-icons*'), './docs/fonts')

  if !File.exists?('./src/js/vendor')
    FileUtils.mkdir('./src/js/vendor')
  end
  FileUtils.cp(Dir.glob('./node_modules/tether-shepherd/dist/js/shepherd.min.js'), './src/js/vendor')
  FileUtils.cp(Dir.glob('./node_modules/tether/dist/js/tether.min.js'), './src/js/vendor')
end
