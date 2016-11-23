source 'https://repo.socrata.com/artifactory/api/gems/rubygems-virtual/'

ruby File.read('.ruby-version').strip

gem 'dotenv-rails', groups: [:development, :test]

gem 'rails', '4.2.7.1'

# Use postgres as the database for Active Record
gem 'pg'

# Cetera access wrapper
gem 'cetera-ruby', '~> 0.1.1', :require => 'cetera'

gem 'jquery-rails'

# Use SCSS for stylesheets
gem 'sass-rails', '5.0.6'
gem 'bourbon'
gem 'neat'
gem 'breakpoint'

# Use Uglifier as compressor for JavaScript assets
gem 'uglifier', '>= 1.3.0'

# See https://github.com/rails/execjs#readme for more supported runtimes
# gem 'therubyracer', platforms: :ruby

# Build JSON APIs with ease. Read more: https://github.com/rails/jbuilder
gem 'jbuilder', '~> 2.0'

# bundle exec rake doc:rails generates the API under doc/api.
gem 'sdoc', '~> 0.4.0', group: :doc

# Configurable retry of blocks with exponential backoff
gem 'retries'

# Logging formatter to make sumo happier
gem 'lograge'

# We use aws-sdk-v1 for paperclip for S3
gem 'aws-sdk-v1'

# File uploading
gem 'paperclip', '4.3.6'

# Run async jobs in the background
gem 'delayed_job_active_record'
gem 'daemons'

# Use sanitize to clean html
gem 'sanitize'

# Use Unicorn as the app server
gem 'unicorn'

# Semantic versioning
gem 'semver2'

# Memcache library
gem 'dalli'

# Stores the request for use later
gem 'request_store'

# Exception notifier - required last so we get airbrake from delayed jobs
gem 'airbrake'

# Getty Images' library for making OAuth2 calls to their API.
gem 'ConnectSDK', path: 'vendor/gems/ConnectSDK'

# We use aws-sdk v2 for RDS database migrations
gem 'aws-sdk'

# Provides common header and footer
gem 'socrata_site_chrome', '2.0.5'

# AWS DB migration tasks
gem 'httparty'
gem 'decima-ruby', '0.1.0', path: 'vendor/gems/decima-ruby-0.1.0'
# Fetch from git, we need some of the recent bugfixes.
gem 'marathon-api', require: 'marathon', :git => 'https://github.com/otto-de/marathon-api.git', :ref => '0c5e5e0600b298ebb8f47d4007f96ac6bd5c34c6'

# Ops tasks
gem 'net-ping'
gem 'mrdialog'
gem 'inifile'
gem 'diplomat'
gem 'git'
gem 'clipboard'
gem 'jenkins_api_client'

# ActiveMQ message processing
gem 'stomp', '1.4.3'

# Feature flag operations.
gem 'signaller-ruby', :require => 'signaller'

group :production do
  # Reaps unicorn worker processes under predefined conditions
  gem 'unicorn-worker-killer', '~> 0.4'
end

group :development, :test do
  # Make pry the default in rails console
  gem 'pry-rails'

  # Call 'byebug' anywhere in the code to stop execution and get a debugger console
  gem 'byebug'
  gem 'pry-byebug'
  gem 'pry-remote'
  gem 'pry-stack_explorer'

  # Access an IRB console on exception pages or by using <%= console %> in views
  gem 'web-console', '~> 2.0'

  # Spring speeds up development by keeping your application running in the background. Read more: https://github.com/rails/spring
  gem 'spring'

  # Allows setting up an instance with multiple domains
  gem 'powder'

  gem 'simplecov', require: false
  gem 'simplecov-cobertura', require: false
  gem 'factory_girl_rails'
end

group :test do
  # Testing framework
  gem 'rspec-rails', '~> 3.4'

  gem 'webmock', require: false
  gem 'database_cleaner'

  # integration tests
  gem 'capybara'
  gem 'selenium-webdriver'
  gem 'headless'

  gem 'os'
end

group :development do
  # Run application with $RAILS_ROOT/Procfile
  gem 'foreman'

  gem 'stackprof', require: false
  gem 'flamegraph'
  gem 'rack-mini-profiler'
end
