source 'https://rubygems.org/'

if RUBY_VERSION =~ /1.9/
  Encoding.default_external = Encoding::UTF_8
  Encoding.default_internal = Encoding::UTF_8
end

gem "jammit", "~>0.6.5"
gem "axlsx", "~> 1.3.4"
gem "rails", "~>3.2.12", :require => nil
gem "rack", "~>1.4.5"
gem "erubis", ">= 2.6.4"
gem "multipart-post", ">= 1.0.1", :require => 'net/http/post/multipart'
gem 'hashie', '2.0.5'
gem "sass", "~>3.2"
gem "stomp", "1.1.6"
gem "airbrake", "~>3.1.6"
gem "money", "~> 3.7.1"
gem "graylog2_exceptions"
gem 'memcache-client', '~>1.8.5'
gem 'rinku', :require => 'rails_rinku'
gem 'timecop'
gem 'statsd-ruby', :require => 'statsd', :git => 'git@git.socrata.com:statsd-ruby-fork'
gem "thin", :group => :development
gem "ruby-debug19", :group => :development
gem 'redcarpet'
gem 'sanitize'
gem 'snappy'
gem 'xray', :require => 'xray/thread_dump_signal_handler'
gem 'recaptcha', :require => 'recaptcha/rails'
gem 'zk', '~>1.9.2'

group :test do
  gem 'mocha', :require => false
  gem 'minitest'
end

group :development, :test do
  gem 'jazz_hands'
end
