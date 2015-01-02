require 'test_helper'

class AngularControllerTest < ActionController::TestCase

  def setup
    init_core_session
    init_current_domain
  end

  test 'should successfully get serve_app for an app with its feature flag set to true' do
    # i.e. url_for(:action => :serve_app, :controller => :angular, :id => '1234-1234', :app => 'dataCards')
    FeatureFlags.stubs(
      :derive => {
        'app-dummy' => false,
        'app-dataCards' => true
      }
    )
    get :serve_app, :id => '1234-1234', :app => 'dataCards'
    assert_response :success
  end

  test 'should 404 in serve_app for an app with its feature flag set to false' do
    FeatureFlags.stubs(
      :derive => {
        'app-dummy' => true,
        'app-dataCards' => false
      }
    )
    get :serve_app, :id => '1234-1234', :app => 'dataCards'
    assert_response 404
  end

  test 'should 404 in serve_app for an app with no feature flag set' do
    FeatureFlags.stubs(
      :derive => {}
    )
    get :serve_app, :id => '1234-1234', :app => 'dataCards'
    assert_response 404

    FeatureFlags.stubs(
      :derive => {
        'app-dummy' => true
      }
    )
    get :serve_app, :id => '1234-1234', :app => 'dataCards'
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

  test 'should not render google analytics JS if feature flag is not set' do
    FeatureFlags.stubs(
      :derive => {
        'app-dataCards' => true,
        :enable_opendata_ga_tracking => false
      }
    )
    get :serve_app, :id => '1234-1234', :app => 'dataCards'
    assert_no_match(/ga\('create', 'UA-.+-.+', 'auto'\);/, @response.body)
  end
  
  test 'should render google analytics JS if feature flag is set' do
    FeatureFlags.stubs(
      :derive => {
        'app-dataCards' => true,
        :enable_opendata_ga_tracking => true
      }
    )
    get :serve_app, :id => '1234-1234', :app => 'dataCards'
    assert_match(/ga\('create', 'UA-.+-.+', 'auto'\);/, @response.body)
  end

  test 'should render google analytics JS with explicit ga code if specified' do
    FeatureFlags.stubs(
      :derive => {
        'app-dataCards' => true,
        :enable_opendata_ga_tracking => 'UA-1234-567890'
      }
    )
    get :serve_app, :id => '1234-1234', :app => 'dataCards'
    assert_match(/ga\('create', 'UA-1234-567890', 'auto'\);/, @response.body)
  end

end
