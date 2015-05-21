require 'test_helper'

class VersionControllerTest < ActionController::TestCase

  def setup
    init_core_session
    init_current_domain
  end

  test 'html result should include version' do
    get :index
    assert_response :success
    assert_match /Current Version:/, @response.body
  end

  test 'json result should include version' do
    get :index, :format => :json
    assert_response :success
    body = JSON.parse @response.body
    assert_match /^\d+\.\d+\.\d+$/, body['version']
  end

end
