require 'fileutils'

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

activate :external_pipeline,
  name: :gulp,
  command: build? ? './node_modules/.bin/gulp dist' : './node_modules/.bin/gulp watch',
  source: 'dist'

after_configuration do
  FileUtils.mkdir_p('./docs/javascripts/vendor')
  FileUtils.cp(Dir.glob('./node_modules/prismjs/prism.js'), './docs/javascripts/vendor')
end

