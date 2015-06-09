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
      },
      :rights => []
    )
    User.stubs(:find_profile => @user)
    @controller.stubs(
      :current_user => @user,
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

  test 'it should respond to the data_lens_state feature flag as a query string parameter' do
    stub_feature_flags_with(:data_lens_transition_state, 'pre_beta')
    get :show, { 'data_lens_transition_state' => 'post_beta' }

    assert_response :success
    assert_select_quiet '.facetSection.limitTo > ul > li > .typeNewView', 1
  end

  context 'when the data_lens_state feature flag is set to "pre_beta"' do
    setup do
      stub_feature_flags_with(:data_lens_transition_state, 'pre_beta')
    end

    should 'not show any new view facet for users unable to edit the datasets of others' do
      @user.stubs(
        :followers => [],
        :friends => [],
        :route_params => {
          :profile_name => @user.screen_name,
          :id => @user.uid
        },
        :rights => []
      )
      @controller.stubs(
        :current_user => @user,
        :categories_facet => nil
      )
      get :show

      assert_response :success
      assert_select_quiet '.facetSection.limitTo > ul > li > .typeNewView', 0
    end

    should 'not show any new view facet for users able to edit the datasets of others' do
      @user.stubs(
        :followers => [],
        :friends => [],
        :route_params => {
          :profile_name => @user.screen_name,
          :id => @user.uid
        },
        :rights => ['edit_others_datasets']
      )
      @controller.stubs(
        :current_user => @user,
        :categories_facet => nil
      )
      get :show

      assert_response :success
      assert_select_quiet '.facetSection.limitTo > ul > li > .typeNewView', 0
    end
  end

  context 'when the data_lens_state feature flag is set to "beta"' do
    setup do
      stub_feature_flags_with(:data_lens_transition_state, 'beta')
    end

    should 'not show any new view facet for users unable to edit the datasets of others' do
      @user.stubs(
        :followers => [],
        :friends => [],
        :route_params => {
          :profile_name => @user.screen_name,
          :id => @user.uid
        },
        :rights => []
      )
      @controller.stubs(
        :current_user => @user,
        :categories_facet => nil
      )
      get :show

      assert_response :success
      assert_select_quiet '.facetSection.limitTo > ul > li > .typeNewView', 0
    end

    should 'show new view facets for users able to edit the datasets of others' do
      @user.stubs(
        :followers => [],
        :friends => [],
        :route_params => {
          :profile_name => @user.screen_name,
          :id => @user.uid
        },
        :rights => ['edit_others_datasets']
      )
      @controller.stubs(
        :current_user => @user,
        :categories_facet => nil
      )
      get :show

      assert_response :success
      assert_select_quiet '.facetSection.limitTo > ul > li > .typeNewView', 1
    end
  end

  context 'when the data_lens_state feature flag is set to "post_beta"' do
    setup do
      stub_feature_flags_with(:data_lens_transition_state, 'post_beta')
    end

    should 'show new view facets for users unable to edit the datasets of others' do
      @user.stubs(
        :followers => [],
        :friends => [],
        :route_params => {
          :profile_name => @user.screen_name,
          :id => @user.uid
        },
        :rights => []
      )
      @controller.stubs(
        :current_user => @user,
        :categories_facet => nil
      )
      get :show

      assert_response :success
      assert_select_quiet '.facetSection.limitTo > ul > li > .typeNewView', 1
    end

    should 'show new view facets for users able to edit the datasets of others' do
      @user.stubs(
        :followers => [],
        :friends => [],
        :route_params => {
          :profile_name => @user.screen_name,
          :id => @user.uid
        },
        :rights => ['edit_others_datasets']
      )
      @controller.stubs(
        :current_user => @user,
        :categories_facet => nil
      )
      get :show

      assert_response :success
      assert_select_quiet '.facetSection.limitTo > ul > li > .typeNewView', 1
    end
  end

  test 'it should not send a limitTo for search when no facet is selected' do
    Clytemnestra.
      expects(:search_views).
      with() { |actual| !actual[:limitTo].present? }.
      returns(Clytemnestra::ViewSearchResult.from_result(File.open('test/fixtures/catalog_search_results.json').read))
    get :show
    assert_response :success
    Clytemnestra.unstub(:search_views)
  end

  test 'it should send an appropriate limitTo for search when new_view type facet is selected' do
    Clytemnestra.
      expects(:search_views).
      with() { |actual| actual[:limitTo].eql? 'new_view' }.
      returns(Clytemnestra::ViewSearchResult.from_result(File.open('test/fixtures/catalog_search_results.json').read))
    get :show, { 'limitTo' => 'new_view' }
    assert_response :success
    Clytemnestra.unstub(:search_views)
  end

end
