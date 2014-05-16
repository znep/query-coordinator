require 'test_helper'

class AngularControllerTest < ActionController::TestCase

  def setup
    init_core_session
    init_current_domain
  end

  test 'should get serve_app' do
    # i.e. url_for(:action => :serve_app, :controller => :angular, :id => '1234-1234', :app => 'dataCards')
    get :serve_app, :id => '1234-1234', :app => 'dataCards'
    assert_response :success
  end

end
