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
  command: build? ? 'npm run gulp' : 'npm run watch',
  source: 'dist'

after_configuration do
  FileUtils.mkdir_p('./docs/javascripts/vendor')
  FileUtils.cp(Dir.glob('./node_modules/prismjs/prism.js'), './docs/javascripts/vendor')
  FileUtils.cp(Dir.glob('./node_modules/tether/dist/js/tether.js'), './docs/javascripts/vendor')
  FileUtils.cp(Dir.glob('./node_modules/tether-shepherd/dist/js/shepherd.js'), './docs/javascripts/vendor')
end
