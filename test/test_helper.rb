ENV["RAILS_ENV"] = "test"
require File.expand_path('../../config/environment', __FILE__)
require 'rails/test_help'

class Test::Unit::TestCase
  # Add more helper methods to be used by all tests here...
  def init_current_domain
    @domain = YAML::load(File.open("test/fixtures/domain.yml"))
    CurrentDomain.set_domain(@domain)
  end

end
