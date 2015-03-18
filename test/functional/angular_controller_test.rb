require 'test_helper'

class AngularControllerTest < ActionController::TestCase

  def setup
    init_core_session
    init_current_domain
  end

  test 'should successfully get serve_app' do
    # i.e. url_for(:action => :serve_app, :controller => :angular, :id => '1234-1234', :app => 'dataCards')
    get :serve_app, :id => '1234-1234', :app => 'dataCards'
    assert_response :success
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
        :enable_opendata_ga_tracking => false
      }
    )
    get :serve_app, :id => '1234-1234', :app => 'dataCards'
    assert_no_match(/ga\('create', 'UA-.+-.+', 'auto'\);/, @response.body)
  end
  
  test 'should render google analytics JS if feature flag is set' do
    FeatureFlags.stubs(
      :derive => {
        :enable_opendata_ga_tracking => true
      }
    )
    get :serve_app, :id => '1234-1234', :app => 'dataCards'
    assert_match(/ga\('create', 'UA-.+-.+', 'auto'\);/, @response.body)
  end

  test 'should render google analytics JS with explicit ga code if specified' do
    FeatureFlags.stubs(
      :derive => {
        :enable_opendata_ga_tracking => 'UA-1234-567890'
      }
    )
    get :serve_app, :id => '1234-1234', :app => 'dataCards'
    assert_match(/ga\('create', 'UA-1234-567890', 'auto'\);/, @response.body)
  end

end
