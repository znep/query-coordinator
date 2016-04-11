require 'fileutils'

compass_config do |config|
   config.output_style = :expanded
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
  FileUtils.mkdir_p('./docs/fonts')
  FileUtils.cp(Dir.glob('./src/fonts/socrata-icons*'), './docs/fonts')

  FileUtils.mkdir_p('./docs/javascripts/vendor')
  FileUtils.cp(Dir.glob('./node_modules/prismjs/prism.js'), './docs/javascripts/vendor')
  FileUtils.cp(Dir.glob('./dist/js/styleguide.js'), './docs/javascripts/vendor')
end
