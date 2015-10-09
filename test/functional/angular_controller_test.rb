require 'test_helper'

class AngularControllerTest < ActionController::TestCase

  def setup
    init_core_session
    init_current_domain
    ::Configuration.stubs(:find_by_type => [])

    @phidippides = Phidippides.new('localhost', 2401)
    @controller.stubs(:phidippides => @phidippides)
    @new_view_manager = NewViewManager.new
    @page_metadata_manager = PageMetadataManager.new
    load_sample_data('test/fixtures/sample-data.json')
    test_view = View.find('test-data')
    View.any_instance.stubs(
      :find => test_view,
      :find_related => [test_view],
      :migrations => {
        :nbeId => '1234-1234',
        :obeId => '1234-1234'
      }
    )
  end

  test 'should successfully get serve_app' do
    NewViewManager.any_instance.stubs(:fetch).returns({})
    View.stubs(
      :migrations => {
        :nbeId => '1234-1234',
        :obeId => '1234-1234'
      }
    )
    PageMetadataManager.any_instance.stubs(
      :show => v1_page_metadata
    )
    Phidippides.any_instance.stubs(
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

    # i.e. url_for(:action => :serve_app, :controller => :angular, :id => '1234-1234', :app => 'dataCards')
    get :serve_app, :id => '1234-1234', :app => 'dataCards'
    assert_response :success
    # Should flag subcolumns
    assert_match(/var datasetMetadata *= *[^\n]*isSubcolumn[^:]+:true/, @response.body)
  end

  test 'should successfully get serve_app for single card view' do
    NewViewManager.any_instance.stubs(:fetch).returns({})
    View.stubs(
      :migrations => {
        :nbeId => '1234-1234',
        :obeId => '1234-1234'
      }
    )
    PageMetadataManager.any_instance.stubs(
      :show => v1_page_metadata
    )
    Phidippides.any_instance.stubs(
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

    # i.e. url_for(:action => :serve_app, :controller => :angular, :id => '1234-1234', :app => 'dataCards')
    get :serve_app, :id => '1234-1234', :field_id => 'field', :app => 'dataCards'
    assert_response :success
    # Should flag subcolumns
    assert_match(/var datasetMetadata *= *[^\n]*isSubcolumn[^:]+:true/, @response.body)
  end

  test 'should successfully get serve_app with empty Phidippides page data' do
    NewViewManager.any_instance.stubs(:fetch).returns({})
    View.stubs(
      :migrations => {
        :nbeId => '1234-1234',
        :obeId => '1234-1234'
      }
    )
    PageMetadataManager.any_instance.stubs(
      :show => v1_page_metadata
    )
    Phidippides.any_instance.stubs(
      :fetch_dataset_metadata => {
        :status => '200',
        :body => v1_dataset_metadata
      },
      :fetch_pages_for_dataset => {
        :status => '200',
        :body => {'publisher' => '', 'user' => ''}.with_indifferent_access
      },
      :set_default_and_available_card_types_to_columns! => {}
    )

    # i.e. url_for(:action => :serve_app, :controller => :angular, :id => '1234-1234', :app => 'dataCards')
    get :serve_app, :id => '1234-1234', :app => 'dataCards'
    assert_response :success
    # Should flag subcolumns
    assert_match(/var datasetMetadata *= *[^\n]*isSubcolumn[^:]+:true/, @response.body)
  end

  test 'should successfully get serve_app with empty metadb page data' do
    NewViewManager.any_instance.stubs(:fetch).returns({})
    View.any_instance.stubs(:find_related).returns({})
    PageMetadataManager.any_instance.stubs(
      :show => v1_page_metadata
    )
    Phidippides.any_instance.stubs(
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

    # i.e. url_for(:action => :serve_app, :controller => :angular, :id => '1234-1234', :app => 'dataCards')
    get :serve_app, :id => '1234-1234', :app => 'dataCards'
    assert_response :success
    # Should flag subcolumns
    assert_match(/var datasetMetadata *= *[^\n]*isSubcolumn[^:]+:true/, @response.body)
  end

  test 'should raise an error when a non-existent app is requested' do
    assert_raises(ActionController::RoutingError) do
      get :serve_app, :id => '1234-1234', :app => nil
    end
    assert_raises(ActionController::RoutingError) do
      get :serve_app, :id => '1234-1234', :app => 'notAnApp'
    end
  end

  context 'accessibility' do
    setup do
      NewViewManager.any_instance.stubs(:fetch).returns({})
      load_sample_data('test/fixtures/sample-data.json')
      test_view = View.find('test-data')
      View.any_instance.stubs(
        :find => test_view,
        :find_related => [test_view],
        :migrations => {
          :nbeId => '1234-1234',
          :obeId => '1234-1234'
        }
      )
      PageMetadataManager.any_instance.stubs(
        :show => v1_page_metadata
      )
      Phidippides.any_instance.stubs(
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

      get :serve_app, :id => '1234-1234', :app => 'dataCards'
    end

    should 'render skip-links in html' do
      assert_match(/<div id=\"skip-links\">/, @response.body)
      assert_match(/Go to an accessible version of this page/, @response.body)
    end

    should 'render noscript in html' do
      assert_match(/<noscript>/, @response.body)
    end
  end

  context 'when unauthenticated' do
    setup do
      Phidippides.any_instance.stubs(
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

    should 'redirect to the login page if the page is private' do
      PageMetadataManager.any_instance.stubs(:show).raises(NewViewManager::ViewAuthenticationRequired)

      get :serve_app, :id => '1234-1234', :app => 'dataCards'

      assert_equal('/view/1234-1234', @controller.session[:return_to])
      assert_redirected_to('/login?referer_redirect=1')
    end

    should 'redirect to the 404 page if the page is not found' do
      PageMetadataManager.any_instance.stubs(:show).raises(NewViewManager::ViewNotFound)

      get :serve_app, :id => '1234-1234', :app => 'dataCards'

      assert_response(404)
    end

    should 'redirect to the login page if the dataset is private' do
      NewViewManager.any_instance.stubs(:fetch).raises(NewViewManager::ViewAuthenticationRequired)

      get :serve_app, :id => '1234-1234', :app => 'dataCards'

      assert_equal('/view/1234-1234', @controller.session[:return_to])
      assert_redirected_to('/login?referer_redirect=1')
    end

    should 'redirect to the 404 page if the dataset is not found' do
      NewViewManager.any_instance.stubs(:fetch).raises(NewViewManager::ViewNotFound)

      get :serve_app, :id => '1234-1234', :app => 'dataCards'

      assert_response(404)
    end

    should 'redirect to the 500 page if it encounters an upstream error' do
      NewViewManager.any_instance.stubs(:fetch).raises(RuntimeError)

      get :serve_app, :id => '1234-1234', :app => 'dataCards'

      assert_response(500)
    end

    should 'redirect to 403 for permission denied error on migration endpoint' do
      @controller.stubs(
        :fetch_page_metadata => v1_page_metadata,
        :fetch_dataset_metadata => v1_dataset_metadata
      )
      View.stubs(:migrations).raises(CoreServer::CoreServerError.new(
        'GET http://hostname/migrations/cant-hazz',
        'permission_denied',
        "The current user doesn't have access to this view"
      ))

      get :serve_app, :id => 'cant-hazz', :app => 'dataCards'

      assert_response(403)
    end

    should 'return success for CoreServer::ResourceNotFound' do
      @controller.stubs(
        :fetch_page_metadata => v1_page_metadata,
        :fetch_dataset_metadata => v1_dataset_metadata
      )
      View.stubs(:migrations).raises(
        CoreServer::ResourceNotFound.new(Net::HTTPNotFound.new(nil, nil, nil))
      )
      get :serve_app, :id => 'aint-here', :app => 'dataCards'

      assert_response(200)
    end
  end

  context 'when authenticated' do
    setup do
      Phidippides.any_instance.stubs(
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

    should 'redirect to the 403 page if the page is private' do
      PageMetadataManager.any_instance.stubs(:show).raises(NewViewManager::ViewAccessDenied)

      get :serve_app, :id => '1234-1234', :app => 'dataCards'

      assert_response(403)
    end

    should 'redirect to the 404 page if the page is not found' do
      PageMetadataManager.any_instance.stubs(:show).raises(NewViewManager::ViewNotFound)

      get :serve_app, :id => '1234-1234', :app => 'dataCards'

      assert_response(404)
    end

    should 'redirect to the 403 page if the dataset is private' do
      PageMetadataManager.any_instance.stubs(:show).returns(v1_page_metadata)
      AngularController.any_instance.stubs(:fetch_dataset_metadata).raises(CommonMetadataMethods::UnauthorizedDatasetMetadataRequest)
      NewViewManager.any_instance.stubs(:fetch).returns({})

      get :serve_app, :id => '1234-1234', :app => 'dataCards'
      assert_response(403)

      get :visualization_add, :datasetId => 'data-sett', :app => 'dataCards'
      assert_response(403)
    end

    should 'redirect to the 404 page if the dataset is not found' do
      PageMetadataManager.any_instance.stubs(:show).returns(v1_page_metadata)
      AngularController.any_instance.stubs(:fetch_dataset_metadata).raises(CommonMetadataMethods::DatasetMetadataNotFound)
      NewViewManager.any_instance.stubs(:fetch).returns({})

      get :serve_app, :id => '1234-1234', :app => 'dataCards'
      assert_response(404)

      get :visualization_add, :datasetId => 'data-sett', :app => 'dataCards'
      assert_response(404)
    end

    should 'redirect to the 500 page if it encounters an upstream error' do
      NewViewManager.any_instance.stubs(:fetch).raises(RuntimeError)

      get :serve_app, :id => '1234-1234', :app => 'dataCards'
      assert_response(500)

      get :visualization_add, :datasetId => 'data-sett', :app => 'dataCards'
      assert_response(500)
    end
  end

  test 'should successfully get visualization_add' do
    NewViewManager.any_instance.stubs(:fetch).returns({})
    View.stubs(
      :migrations => {
        :nbeId => '1234-1234',
        :obeId => '1234-1234'
      }
    )
    Phidippides.any_instance.stubs(
      :fetch_dataset_metadata => {
        :status => '200',
        :body => v1_dataset_metadata
      },
      :set_default_and_available_card_types_to_columns! => {}
    )

    get :visualization_add, :datasetId => '1234-1234', :app => 'dataCards'
    assert_response :success
    # Should flag subcolumns
    assert_match(/var datasetMetadata *= *[^\n]*isSubcolumn[^:]+:true/, @response.body)
  end

  context 'google analytics' do
    setup do
      PageMetadataManager.any_instance.stubs(
        :show => v1_page_metadata
      )
      Phidippides.any_instance.stubs(
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
      load_sample_data('test/fixtures/sample-data.json')
      test_view = View.find('test-data')
      View.any_instance.stubs(
        :find => test_view,
        :find_related => [test_view]
      )
      NewViewManager.any_instance.stubs(:fetch).returns({})
    end

    should 'not render google analytics JS if feature flag is not set' do
      FeatureFlags.stubs(
        :derive => {
          :enable_opendata_ga_tracking => false
        }
      )
      get :serve_app, :id => '1234-1234', :app => 'dataCards'
      assert_no_match(/_gaSocrata\('create', 'UA-.+-.+'/, @response.body)
    end

    should 'render google analytics JS using the app config token if feature flag is set to true' do
      APP_CONFIG.opendata_ga_tracking_code = 'UA-9046230'
      FeatureFlags.stubs(
        :derive => {
          :enable_opendata_ga_tracking => true
        }
      )
      get :serve_app, :id => '1234-1234', :app => 'dataCards'
      assert_match(/_gaSocrata\('create', 'UA-9046230', 'auto', 'socrata'\);/, @response.body)
    end

    should 'render google analytics JS using the app config token if feature flag is an empty string' do
      APP_CONFIG.opendata_ga_tracking_code = 'UA-9046230'
      FeatureFlags.stubs(
        :derive => {
          :enable_opendata_ga_tracking => ''
        }
      )
      get :serve_app, :id => '1234-1234', :app => 'dataCards'
      assert_match(/_gaSocrata\('create', 'UA-9046230', 'auto', 'socrata'\);/, @response.body)
    end

    should 'render google analytics JS with explicit ga code if specified' do
      FeatureFlags.stubs(
        :derive => {
          :enable_opendata_ga_tracking => 'UA-1234-567890'
        }
      )
      get :serve_app, :id => '1234-1234', :app => 'dataCards'
      assert_match(/_gaSocrata\('create', 'UA-1234-567890', 'auto', 'socrata'\);/, @response.body)
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
