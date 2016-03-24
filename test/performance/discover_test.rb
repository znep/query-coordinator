require 'test_helper'
require 'authentication_helper'
require 'performance_test_help'

class BlistsListTest < ActionController::PerformanceTest
  include AuthenticatedTestHelper
  include RubyProf::Test

  # Replace this with your real tests.
  def test_blists_list
    #login('paul', 'test')
    get '/data'
    assert_response :ok
  end
end
