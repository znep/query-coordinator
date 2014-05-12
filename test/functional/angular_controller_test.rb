require 'test_helper'

class AngularControllerTest < ActionController::TestCase
  test "should get serve_app" do
    get :serve_app
    assert_response :success
  end

end
