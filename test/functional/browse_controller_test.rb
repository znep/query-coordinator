require 'test_helper'

class BrowseControllerTest < ActionController::TestCase

  def setup
    init_core_session
    init_current_domain
    @user = login
    @new_view_id = 'knew-view'
    @new_view_url = 'https://example.com/view/cool-view'
    init_stubs
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
      :categories_facet => nil
    )
    connection_stub = stub.tap do |stub|
      stub.stubs(
        :batch_request => [],
        :get_request => File.open('test/fixtures/catalog_search_results.json').read,
        :reset_counters => {
          :runtime => 0,
          :requests => {}
        }
      )
    end
    Configuration.stubs(:find_by_type => {})
    CoreServer::Base.stubs(:connection => connection_stub)
    Tag.stubs(:find => [])
    Federation.stubs(:find => [])
  end

  test 'it should not show the new view facet by default' do
    get :show
    assert_response :success
    assert_select_quiet '.facetSection.limitTo > ul > li > .typeNewView', 0
  end

  test 'it should show the new view facet when exit_tech_preview feature flag is true' do
    stub_feature_flags_with(:exit_tech_preview, true)
    get :show
    assert_response :success
    assert_select_quiet '.facetSection.limitTo > ul > li > .typeNewView', 1
  end

  test 'it should not show the new view listing by default' do
    get :show
    assert_response :success
    assert_select_quiet %Q(tr[data-viewId="#{@new_view_id}"]), 0
  end

  test 'it should show the new view listing when exit_tech_preview feature flag is true' do
    stub_feature_flags_with(:exit_tech_preview, true)
    get :show
    assert_response :success
    assert_select_quiet %Q(tr[data-viewId="#{@new_view_id}"]), 1
  end

  test 'a new view catalog entry should link to the new view' do
    stub_feature_flags_with(:exit_tech_preview, true)
    get :show
    assert_response :success
    assert_select_quiet %Q(.titleLine a.name[href="#{@new_view_url}"]), 1
  end

  test 'it should respond to the exit_tech_preview feature flag as a query string parameter' do
    get :show, { 'exit_tech_preview' => 'true' }
    assert_response :success
    assert_select_quiet %Q(tr[data-viewId="#{@new_view_id}"]), 1
  end

end
