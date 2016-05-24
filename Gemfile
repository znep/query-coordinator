source 'https://socrata.artifactoryonline.com/socrata/api/gems/rubygems-remote/'

if RUBY_VERSION =~ /1.9/
  Encoding.default_external = Encoding::UTF_8
  Encoding.default_internal = Encoding::UTF_8
end

gem 'mixpanel-ruby', '~> 1.6.0'
gem 'addressable'
gem 'airbrake', '4.3.0'
gem 'axlsx', '~> 1.3.4'
gem 'diplomat'
gem 'hashie', '2.1.2'
gem 'httparty'
gem 'jammit', '0.6.5'
gem 'lograge'
gem 'memcache-client', '~> 1.8.5'
gem 'money', '~> 3.7.1'
gem 'multipart-post', '>= 1.0.1', :require => 'net/http/post/multipart'
gem 'omniauth', '~> 1.2'
gem 'omniauth-auth0', '~> 1.1'
gem 'rack'
gem 'rails', '~> 3.2.22.1', :require => nil
gem 'recaptcha', '0.3.5', :require => 'recaptcha/rails'
gem 'redcarpet'
gem 'rinku', :require => 'rails_rinku'
gem 'sanitize' # Note that this is in addition to the default Rails implementation.
gem 'sass', '~> 3.2'
gem 'semver2'
gem 'snappy'
gem 'statsd-ruby', :require => 'statsd', :git => 'https://github.com/socrata-platform/statsd-ruby-fork.git'
gem 'unicorn'
gem 'unparser', '0.2.4'
gem 'xray', :require => 'xray/thread_dump_signal_handler'
gem 'zip'
gem 'zk', '~> 1.9.2'
gem 'zookeeper', '~> 1.4.9'
gem 'zendesk2', '~> 1.7.5'

group :test do
  gem 'factory_girl'
  gem 'guard'
  gem 'guard-minitest'
  gem 'minitest', '~> 4.0'
  gem 'minitest-reporters', '>= 0.5.0'
  gem 'mocha', :require => false
  gem 'rb-fsevent'
  gem 'shoulda-context'
  gem 'timecop'
  gem 'webmock'
  gem 'rspec-rails', '~> 3.1.0'
  gem 'vcr'
end

group :development, :test do
  gem 'foreman'
  gem 'jazz_hands' unless ENV['RM_INFO']
  gem 'pry'
  gem 'pry-debugger'
  gem 'pry-remote'
  gem 'pry-stack_explorer'
  gem 'rb-readline'
  gem 'reek', '~> 2.2.1'
  gem 'thin'
end
