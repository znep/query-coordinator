require 'test_helper'

class ProfileControllerTest < ActionController::TestCase
  def setup
    init_core_session
    init_current_domain
    @user = login

    # so the the news widget finds a cached (empty) article list
    # otherwise, it will try to connect to Zendesk which WebMock
    # doesn't like
    # (a blank list is an acceptable state that happens by default
    # if there are any issues connecting to Zendesk)
    Rails.cache.stubs(:read => [])
  end

  # LOL! Stub all the things!!
  def init_stubs
    @user.stubs(
      :followers => [],
      :friends => [],
      :route_params => {
        :profile_name => @user.screen_name,
        :id => @user.uid
      }
    )
    User.stubs(:find_profile => @user)
    @controller.stubs(
      :user => @user,
      :get_request => nil,
      :view_types_facet => nil,
      :categories_facet => nil,
      :get_facet_cutoff => 0,
      :process_browse => {
        :sort_opts => [],
        :user_params => {:q => nil},
        :facets => [],
        :disable => {},
        :view_count => 0,
        :base_url => '',
        :view_results => []
      },
      :options => {},
      :cleanup_view_runtime => nil,
      :append_info_to_payload => nil
    )
    connection_stub = stub.tap do |stub|
      stub.stubs(
        :batch_request => [],
        :get_request => [],
        :reset_counters => {
          :requests => []
        }
      )
    end
    CoreServer::Base.stubs(:connection => connection_stub)
    Tag.stubs(:find => OpenStruct.new(:data => []))
  end

  test 'can view own profile page when logged in' do
    init_stubs
    get :show, :profile_name => @user.screen_name, :id => @user.uid
    assert_response :success
  end

  test 'redirected to login page when not logged in' do
    init_stubs
    logout
    get :show, :profile_name => @user.screen_name, :id => @user.uid
    assert_redirected_to login_url(:protocol => 'https', :host => @request.host)
  end
end
