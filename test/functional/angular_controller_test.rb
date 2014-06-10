require 'test_helper'

class AngularControllerTest < ActionController::TestCase

  def setup
    init_core_session
    init_current_domain
  end

  test 'should successfully get serve_app for an app with its feature flag set to true' do
    # i.e. url_for(:action => :serve_app, :controller => :angular, :id => '1234-1234', :app => 'data-cards')
    FeatureFlags.stubs(
      :derive => {
        'app-dummy' => false,
        'app-data-cards' => true
      }
    )
    get :serve_app, :id => '1234-1234', :app => 'data-cards'
    assert_response :success
  end

  test 'should 404 in serve_app for an app with its feature flag set to false' do
    FeatureFlags.stubs(
      :derive => {
        'app-dummy' => true,
        'app-data-cards' => false
      }
    )
    get :serve_app, :id => '1234-1234', :app => 'data-cards'
    assert_response 404
  end

  test 'should 404 in serve_app for an app with no feature flag set' do
    FeatureFlags.stubs(
      :derive => {}
    )
    get :serve_app, :id => '1234-1234', :app => 'data-cards'
    assert_response 404

    FeatureFlags.stubs(
      :derive => {
        'app-dummy' => true
      }
    )
    get :serve_app, :id => '1234-1234', :app => 'data-cards'
    assert_response 404
  end

  test 'should raise for a non-existent app' do
    assert_raises(ActionController::RoutingError) do
      get :serve_app, :id => '1234-1234', :app => nil
    end
    assert_raises(ActionController::RoutingError) do
      get :serve_app, :id => '1234-1234', :app => 'notAnApp'
    end
  end

end
