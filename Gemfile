source 'https://rubygems.org'

ruby File.read('.ruby-version').strip

gem 'dotenv-rails', groups: [:development, :test]

gem 'rails', '4.2.4'

# Use postgres as the database for Active Record
gem 'pg'

gem 'jquery-rails'

# Use SCSS for stylesheets
gem 'sass-rails', '~> 5.0'
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

# Exception notifier
gem 'airbrake'

# Logging formatter to make sumo happier
gem 'lograge'

# We use aws-sdk-v1 for paperclip for S3
gem 'aws-sdk-v1'

# File uploading
gem 'paperclip', '~> 4.3'

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

group :development, :test do
  # Testing framework
  gem 'rspec-rails', '~> 3.2'

  # Make pry the default in rails console
  gem 'pry-rails'

  # Call 'byebug' anywhere in the code to stop execution and get a debugger console
  gem 'byebug'
  gem 'pry-byebug', '~> 1.3.3'
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
  gem 'nyan-cat-formatter', require: false
  gem 'factory_girl_rails'
end

group :test do
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

  # We use aws-sdk v2 for RDS database migrations
  gem 'aws-sdk'

  gem 'decima-ruby', '0.1.0', path: 'vendor/gems/decima-ruby-0.1.0'
end
