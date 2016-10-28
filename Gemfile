source 'https://socrata.artifactoryonline.com/socrata/api/gems/rubygems-virtual/'

ruby '2.3.1'

gem 'actionpack-page_caching'
gem 'addressable'
gem 'airbrake', '4.3.0'
gem 'awesome_print'
gem 'axlsx', '~> 1.3.4'
gem 'cetera-ruby', '0.1.2', :require => 'cetera'
gem 'dalli', '~> 2.7', '>= 2.7.6' # Doesn't work with nutcracker / twemproxy
gem 'diplomat' # Used by downtime / mainenance window notices
gem 'hashie', '2.1.2'
gem 'httparty'
gem 'lograge'
gem 'memcache-client', '~> 1.8.5' # Using this unsupported gem since twemproxy doesn't support binary protocol used by Dalli
gem 'mixpanel-ruby', '~> 1.6.0'
gem 'money', '~> 3.7.1'
gem 'multipart-post', '>= 1.0.1', :require => 'net/http/post/multipart'
gem 'omniauth', '~> 1.2'
gem 'omniauth-auth0', '~> 1.1'
gem 'parser', '~> 2.3', '>= 2.3.0.6'
gem 'rack'
gem 'rails', '~> 4.2.7.1', :require => nil
gem 'recaptcha', '0.3.5', :require => 'recaptcha/rails'
gem 'redcarpet'
gem 'request_store'
gem 'rinku', :require => 'rails_rinku'
gem 'sanitize' # Note that this is in addition to the default Rails implementation.
gem 'sass-rails', '~> 5.0'
gem 'semver2'
gem 'signaller-ruby', '0.0.2', :require => 'signaller'
gem 'socrata_site_chrome', '1.2.7'
gem 'snappy'
gem 'statsd-ruby', '~>1.3.0'
gem 'therubyracer'
gem 'unicorn'
gem 'unicorn_metrics', '~> 0.2.3'
gem 'unicorn-worker-killer'
gem 'unparser', '~> 0.2.5'
gem 'xray', :require => 'xray/thread_dump_signal_handler'
gem 'zip'
gem 'zk', '~> 1.9.2'
gem 'zookeeper', '~> 1.4.9'
gem 'zendesk2', '~> 1.8.1'

# For Ops rake tasks
gem 'net-ping'
gem 'mrdialog'
gem 'inifile'
gem 'git'
gem 'clipboard'
gem 'jenkins_api_client'

group :test do
  gem 'factory_girl'
  gem 'guard'
  gem 'guard-minitest'
  gem 'guard-rspec', :require => false
  gem 'minitest', '~> 5.8', '>= 5.8.4'
  gem 'minitest-reporters', '~> 1.1', '>= 1.1.8'
  gem 'mocha', :require => false
  gem 'rails-dom-testing'
  gem 'rb-fsevent'
  gem 'rspec', '~> 3.4'
  gem 'rspec-core', '~> 3.4', '>= 3.4.3'
  gem 'rspec-rails', '~> 3.4', '>= 3.4.2'
  gem 'shoulda-context'
  gem 'timecop'
  gem 'test-unit'
  gem 'vcr'
  gem 'webmock'
end

group :development, :test do
  gem 'byebug'
  gem 'foreman'
  gem 'rb-readline'
  gem 'reek', '~> 2.2.1'
  gem 'thin'
end
