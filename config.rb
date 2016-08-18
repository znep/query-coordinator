require 'fileutils'

set :source, 'pages'

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
  FileUtils.mkdir_p('./pages/javascripts/vendor')
  FileUtils.cp(Dir.glob('./node_modules/prismjs/prism.js'), './pages/javascripts/vendor')
  FileUtils.cp(Dir.glob('./node_modules/tether-shepherd/node_modules/tether/dist/js/tether.js'), './pages/javascripts/vendor')
  FileUtils.cp(Dir.glob('./node_modules/tether-shepherd/dist/js/shepherd.js'), './pages/javascripts/vendor')
end
