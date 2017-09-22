ENV['RAILS_ENV'] ||= 'test'
require File.expand_path('../../config/environment', __FILE__)
require 'rails/test_help'
require 'minitest/autorun'
require 'minitest/reporters'
require 'webmock/minitest'

# Don't allow any network connections
WebMock.disable_net_connect!

# The tests expect a Hashie::Mash, not a RestrictedHash.
# This is the fastest way to deal with it, but it WILL come back
# to bite us someday.
Signaller::Utils.wrapper_class = Hashie::Mash

if ENV['RM_INFO']
  MiniTest::Reporters.use!
end

[Minitest::Test, MiniTest::Test].each do |klass|
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

require 'mocha/setup'
