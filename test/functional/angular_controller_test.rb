require 'test_helper'

class AngularControllerTest < ActionController::TestCase

  def setup
    init_core_session
    init_current_domain

    @phidippides = Phidippides.new
    @new_view_manager = NewViewManager.new
  end

  test 'should successfully get serve_app' do
    NewViewManager.any_instance.stubs(:fetch).returns({})
    Phidippides.any_instance.stubs(
      :fetch_page_metadata => {
        :status => '200',
        :body => v1_page_metadata
      },
      :fetch_dataset_metadata => {
        :status => '200',
        :body => v1_dataset_metadata
      },
      :fetch_pages_for_dataset => {
        :status => '200',
        :body => v1_pages_for_dataset
      },
      :set_default_and_available_card_types_to_columns! => {}
    )
    stub_feature_flags_with(:use_catalog_lens_permissions, true)

    # i.e. url_for(:action => :serve_app, :controller => :angular, :id => '1234-1234', :app => 'dataCards')
    get :serve_app, :id => '1234-1234', :app => 'dataCards'
    assert_response :success
  end

  test 'should raise an error when a non-existent app is requested' do
    assert_raises(ActionController::RoutingError) do
      get :serve_app, :id => '1234-1234', :app => nil
    end
    assert_raises(ActionController::RoutingError) do
      get :serve_app, :id => '1234-1234', :app => 'notAnApp'
    end
  end

  context 'when unauthenticated' do
    setup do
      Phidippides.any_instance.stubs(
        :fetch_page_metadata => {
          :status => '200',
          :body => v1_page_metadata
        },
        :fetch_dataset_metadata => {
          :status => '200',
          :body => v1_dataset_metadata
        },
        :fetch_pages_for_dataset => {
          :status => '200',
          :body => v1_pages_for_dataset
        },
        :set_default_and_available_card_types_to_columns! => {}
      )
      stub_feature_flags_with(:use_catalog_lens_permissions, true)
    end

    should 'should redirect to the login page if the page is private' do
      NewViewManager.any_instance.stubs(:fetch).raises(NewViewManager::ViewAuthenticationRequired)

      get :serve_app, :id => '1234-1234', :app => 'dataCards'

      assert_equal('/view/1234-1234', @controller.session[:return_to])
      assert_redirected_to('/login?referer_redirect=1')
    end

    should 'should redirect to the 404 page if the page is not found' do
      NewViewManager.any_instance.stubs(:fetch).raises(NewViewManager::ViewNotFound)

      get :serve_app, :id => '1234-1234', :app => 'dataCards'

      assert_response(404)
    end

    should 'should redirect to the login page if the dataset is private' do
      NewViewManager.any_instance.stubs(:fetch).raises(NewViewManager::ViewAuthenticationRequired)

      get :serve_app, :id => '1234-1234', :app => 'dataCards'

      assert_equal('/view/1234-1234', @controller.session[:return_to])
      assert_redirected_to('/login?referer_redirect=1')
    end

    should 'should redirect to the 404 page if the dataset is not found' do
      NewViewManager.any_instance.stubs(:fetch).raises(NewViewManager::ViewNotFound)

      get :serve_app, :id => '1234-1234', :app => 'dataCards'

      assert_response(404)
    end

    should 'should redirect to the 500 page if it encounters an upstream error' do
      NewViewManager.any_instance.stubs(:fetch).raises(RuntimeError)

      get :serve_app, :id => '1234-1234', :app => 'dataCards'

      assert_response(500)
    end
  end

   context 'when authenticated' do
     setup do
      Phidippides.any_instance.stubs(
        :fetch_page_metadata => {
          :status => '200',
          :body => v1_page_metadata
        },
        :fetch_dataset_metadata => {
          :status => '200',
          :body => v1_dataset_metadata
        },
        :fetch_pages_for_dataset => {
          :status => '200',
          :body => v1_pages_for_dataset
        },
        :set_default_and_available_card_types_to_columns! => {}
      )
      stub_feature_flags_with(:use_catalog_lens_permissions, true)
    end

    should 'should redirect to the 403 page if the page is private' do
      NewViewManager.any_instance.stubs(:fetch).raises(NewViewManager::ViewAccessDenied)

      get :serve_app, :id => '1234-1234', :app => 'dataCards'

      assert_response(403)
    end

    should 'should redirect to the 404 page if the page is not found' do
      NewViewManager.any_instance.stubs(:fetch).raises(NewViewManager::ViewNotFound)

      get :serve_app, :id => '1234-1234', :app => 'dataCards'

      assert_response(404)
    end

    should 'should redirect to the 403 page if the dataset is private' do
      NewViewManager.any_instance.stubs(:fetch).raises(NewViewManager::ViewAccessDenied)

      get :serve_app, :id => '1234-1234', :app => 'dataCards'

      assert_response(403)
    end

    should 'should redirect to the 404 page if the dataset is not found' do
      NewViewManager.any_instance.stubs(:fetch).raises(NewViewManager::ViewNotFound)

      get :serve_app, :id => '1234-1234', :app => 'dataCards'

      assert_response(404)
    end

    should 'should redirect to the 500 page if it encounters an upstream error' do
      NewViewManager.any_instance.stubs(:fetch).raises(RuntimeError)

      get :serve_app, :id => '1234-1234', :app => 'dataCards'

      assert_response(500)
    end
  end

  context 'google analytics' do
    setup do
      Phidippides.any_instance.stubs(
        :fetch_page_metadata => {
          :status => '200',
          :body => v1_page_metadata
        },
        :fetch_dataset_metadata => {
          :status => '200',
          :body => v1_dataset_metadata
        },
        :fetch_pages_for_dataset => {
          :status => '200',
          :body => v1_pages_for_dataset
        },
        :set_default_and_available_card_types_to_columns! => {}
      )
    end

    should 'not render google analytics JS if feature flag is not set' do
      FeatureFlags.stubs(
        :derive => {
          :enable_opendata_ga_tracking => false,
          :use_catalog_lens_permissions => false
        }
      )
      get :serve_app, :id => '1234-1234', :app => 'dataCards'
      assert_no_match(/ga\('create', 'UA-.+-.+', 'auto'\);/, @response.body)
    end

    should 'render google analytics JS if feature flag is set' do
      FeatureFlags.stubs(
        :derive => {
          :enable_opendata_ga_tracking => true,
          :use_catalog_lens_permissions => false
        }
      )
      get :serve_app, :id => '1234-1234', :app => 'dataCards'
      assert_match(/ga\('create', 'UA-.+-.+', 'auto'\);/, @response.body)
    end

    should 'render google analytics JS with explicit ga code if specified' do
      FeatureFlags.stubs(
        :derive => {
          :enable_opendata_ga_tracking => 'UA-1234-567890',
          :use_catalog_lens_permissions => false
        }
      )
      get :serve_app, :id => '1234-1234', :app => 'dataCards'
      assert_match(/ga\('create', 'UA-1234-567890', 'auto'\);/, @response.body)
    end
  end

  private

  def v1_page_metadata
    JSON.parse(File.read("#{Rails.root}/test/fixtures/v1-page-metadata.json")).with_indifferent_access
  end

  def v1_dataset_metadata
    JSON.parse(File.read("#{Rails.root}/test/fixtures/v1-dataset-metadata.json")).with_indifferent_access
  end

  def v1_pages_for_dataset
    JSON.parse(File.read("#{Rails.root}/test/fixtures/v1-pages-for-dataset.json")).with_indifferent_access
  end
end
