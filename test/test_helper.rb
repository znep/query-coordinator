ENV['RAILS_ENV'] = 'test'
require File.expand_path('../../config/environment', __FILE__)
require 'rails/test_help'
require 'minitest/autorun'
require 'minitest/reporters'
require 'webmock/minitest'
require 'simplecov_custom_profile'

SimpleCov.start 'filtered'

# Don't allow any network connections
WebMock.disable_net_connect!

if ENV['RM_INFO']
  MiniTest::Reporters.use!
end

[Test::Unit::TestCase, MiniTest::Unit::TestCase].each do |klass|
  klass.send(:include, TestHelperMethods)
end

class ActionController::TestCase
  include ActionView::Helpers::UrlHelper
  include ActionView::Helpers::TagHelper
  include ActionView::Helpers
  include ActionDispatch::Routing
  include Rails.application.routes.url_helpers

  protected

  # Returns a helper lambda that, when passed a route-like string will substitute
  # route parameters into the string.
  #
  # Example:
  # route_params = { foo: 'bar' }
  # routelike_builder(route_params).call('/namespace/action/:foo/extra')
  # #=> '/namespace/action/bar/extra'
  def routelike_builder(route_params)
    lambda do |routelike_url, method = :get|
      {
        method: method,
        path: routelike_url.gsub(/:[^\/]+/) { |match| route_params[match[1..-1].to_sym] }
      }
    end
  end

end

# assert_select doesn't like the formatting of our HTML... this adds a quieter version
ActionDispatch::Assertions::SelectorAssertions.class_eval do
  def assert_select_quiet(*args, &block)
    original_verbosity = $-v # store original output value
    $-v = nil # set to nil
    begin
      assert_select(*args, &block)
    ensure
      $-v = original_verbosity # and restore after execute assert_select
    end
  end
end

require 'mocha/setup'
