require 'test_helper'

class DataLensControllerTest < ActionController::TestCase

  def setup
    init_environment

    ::Configuration.stubs(:find_by_type => [])

    load_sample_data('test/fixtures/sample-data.json')

    test_view = View.find('test-data')

    View.any_instance.stubs(
      :find => test_view,
      :find_related => [test_view]
    )

    View.stubs(
      :migrations => migration_metadata
    )
  end

  test 'should successfully get data_lens' do
    stub_basic_data_lens
    get :data_lens, :id => '1234-1234', :app => 'dataCards'
    assert_response :success
  end

  test 'should assign dataset_id' do
    stub_basic_data_lens
    get :data_lens, :id => '1234-1234', :app => 'dataCards'
    assert_equal(assigns[:dataset_id], migration_metadata[:obeId])
  end

  test 'should assign dataset_metadata' do
    stub_basic_data_lens
    get :data_lens, :id => '1234-1234', :app => 'dataCards'
    assert_equal(assigns[:dataset_metadata], v1_dataset_metadata)
  end

  test 'should assign page metadata' do
    stub_basic_data_lens
    get :data_lens, :id => '1234-1234', :app => 'dataCards'
    assert_equal(assigns[:page_metadata], data_lens_page_metadata)
  end

  test 'should assign migration metadata' do
    stub_basic_data_lens
    get :data_lens, :id => '1234-1234', :app => 'dataCards'
    assert_equal(assigns[:migration_metadata], migration_metadata)
  end

  test 'should allow frame embedding of data_lens page' do
    stub_basic_data_lens
    get :data_lens, :id => '1234-1234', :app => 'dataCards'
    assert_response :success
    # Should set the header that allows frame embedding
    assert_equal('ALLOWALL', @response.headers['X-Frame-Options'])
  end

  test 'should successfully get data_lens for single card view' do
    stub_basic_data_lens
    get :data_lens, :id => '1234-1234', :field_id => 'field', :app => 'dataCards'
    assert_response :success
    assert_equal(assigns[:dataset_metadata], v1_dataset_metadata)
  end

  test 'should successfully get data_lens with empty page data' do
    DataLensManager.any_instance.stubs(:fetch).returns({})
    PageMetadataManager.any_instance.stubs(
      :show => data_lens_page_metadata,
    )
    DataLensController.any_instance.stubs(:fetch_dataset_metadata).returns(v1_dataset_metadata.with_indifferent_access)

    get :data_lens, :id => '1234-1234', :app => 'dataCards'
    assert_response :success
  end

  test 'should successfully get data_lens with empty metadb page data' do
    DataLensManager.any_instance.stubs(:fetch).returns({})
    View.any_instance.stubs(:find_related).returns({})
    PageMetadataManager.any_instance.stubs(
      :show => data_lens_page_metadata
    )
    DataLensController.any_instance.stubs(:fetch_dataset_metadata).returns(v1_dataset_metadata.with_indifferent_access)

    get :data_lens, :id => '1234-1234', :app => 'dataCards'
    assert_response :success
  end

  test 'should raise an error when a non-existent app is requested' do
    assert_raises(ActionController::UrlGenerationError) do
      get :data_lens, :id => '1234-1234', :app => nil
    end
    assert_raises(ActionController::UrlGenerationError) do
      get :data_lens, :id => '1234-1234', :app => 'notAnApp'
    end
  end

  test 'generic & seo datalens paths route here' do
    base_path_params = {controller: 'data_lens', action: 'data_lens', app: 'dataCards'}
    View.any_instance.stubs(
      :data_lens? => true
    )

    test_paths = %w(
      view/1234-five
      cats/dogs/1234-five
    )

    test_paths.each do |path|
      segments = path.split('/')
      flunk('invalid url') unless !segments.empty?
      if segments.length >= 3
        add_path_params = {category: segments[0], view_name: segments[1], id: segments[2]}
      elsif segments.length == 2
        add_path_params = {id: segments[1]}
      else
        add_path_params = {id: segments[0]}
      end

      # rails skips automatic params parsing sometimes https://github.com/rspec/rspec-rails/issues/172
      ActionDispatch::Request.any_instance.stubs(
        :path_parameters => base_path_params.merge(add_path_params).with_indifferent_access
      )

      assert_routing(path, base_path_params.merge(add_path_params))
    end
  end

  context 'accessibility' do
    setup do
      DataLensManager.any_instance.stubs(:fetch).returns({})
      PageMetadataManager.any_instance.stubs(
        :show => data_lens_page_metadata
      )
      DataLensController.any_instance.stubs(:fetch_dataset_metadata).returns(v1_dataset_metadata.with_indifferent_access)

      get :data_lens, :id => '1234-1234', :app => 'dataCards'
    end

    should 'render skip-links in html' do
      assert_match(/<div class=\"skip-links\">/, @response.body)
      assert_match(/Go to an accessible version of this page/, @response.body)
    end

    should 'render noscript in html' do
      assert_match(/<noscript>/, @response.body)
    end
  end

  context 'when unauthenticated' do
    setup do
      DataLensController.any_instance.stubs(:fetch_dataset_metadata).returns(v1_dataset_metadata.with_indifferent_access)
    end

    should 'redirect to the login page if the page is private' do
      PageMetadataManager.any_instance.stubs(:show).raises(DataLensManager::ViewAuthenticationRequired)

      get :data_lens, :id => '1234-1234', :app => 'dataCards'

      assert_equal('/view/1234-1234', @controller.session[:return_to])
      assert_redirected_to('/login?referer_redirect=1')
    end

    should 'redirect to the 404 page if the page is not found' do
      PageMetadataManager.any_instance.stubs(:show).raises(DataLensManager::ViewNotFound)

      get :data_lens, :id => '1234-1234', :app => 'dataCards'

      assert_response(404)
    end

    should 'redirect to the login page if the dataset is private' do
      DataLensManager.any_instance.stubs(:fetch).raises(DataLensManager::ViewAuthenticationRequired)

      get :data_lens, :id => '1234-1234', :app => 'dataCards'

      assert_equal('/view/1234-1234', @controller.session[:return_to])
      assert_redirected_to('/login?referer_redirect=1')
    end

    should 'redirect to the 404 page if the dataset is not found' do
      DataLensManager.any_instance.stubs(:fetch).raises(DataLensManager::ViewNotFound)

      get :data_lens, :id => '1234-1234', :app => 'dataCards'

      assert_response(404)
    end

    should 'redirect to the 500 page if it encounters an upstream error' do
      DataLensManager.any_instance.stubs(:fetch).raises(RuntimeError)

      get :data_lens, :id => '1234-1234', :app => 'dataCards'

      assert_response(500)
    end

    should 'redirect to 403 for permission denied error on migration endpoint' do
      DataLensController.any_instance.stubs(
        :fetch_page_metadata => data_lens_page_metadata,
        :fetch_dataset_metadata => v1_dataset_metadata
      )
      View.stubs(:migrations).raises(CoreServer::CoreServerError.new(
        'GET http://hostname/migrations/cant-hazz',
        'permission_denied',
        "The current user doesn't have access to this view"
      ))

      get :data_lens, :id => 'cant-hazz', :app => 'dataCards'

      assert_response(403)
    end

    should 'return success for CoreServer::ResourceNotFound' do
      DataLensController.any_instance.stubs(
        :fetch_page_metadata => data_lens_page_metadata,
        :fetch_dataset_metadata => v1_dataset_metadata
      )
      View.stubs(:migrations).raises(
        CoreServer::ResourceNotFound.new(Net::HTTPNotFound.new(nil, nil, nil))
      )
      get :data_lens, :id => 'aint-here', :app => 'dataCards'

      assert_response(200)
    end
  end

  context 'when authenticated' do
    setup do
      DataLensController.any_instance.stubs(:fetch_dataset_metadata).returns(v1_dataset_metadata)
    end

    should 'redirect to the 403 page if the page is private' do
      PageMetadataManager.any_instance.stubs(:show).raises(DataLensManager::ViewAccessDenied)

      get :data_lens, :id => '1234-1234', :app => 'dataCards'

      assert_response(403)
    end

    should 'redirect to the 404 page if the page is not found' do
      PageMetadataManager.any_instance.stubs(:show).raises(DataLensManager::ViewNotFound)

      get :data_lens, :id => '1234-1234', :app => 'dataCards'

      assert_response(404)
    end

    should 'redirect to the 403 page if the dataset is private' do
      PageMetadataManager.any_instance.stubs(:show).returns(data_lens_page_metadata)
      DataLensController.any_instance.stubs(:fetch_dataset_metadata).raises(CommonMetadataMethods::UnauthorizedDatasetMetadataRequest)
      DataLensManager.any_instance.stubs(:fetch).returns({})

      get :data_lens, :id => '1234-1234', :app => 'dataCards'
      assert_response(403)

      get :visualization_add, :datasetId => 'data-sett', :app => 'dataCards'
      assert_response(403)
    end

    should 'redirect to the 403 page if the dataset is private case two' do
      PageMetadataManager.any_instance.stubs(:show).returns(data_lens_page_metadata)
      DataLensController.any_instance.stubs(:fetch_dataset_metadata).raises(CommonMetadataMethods::UnauthorizedPageMetadataRequest)
      DataLensManager.any_instance.stubs(:fetch).returns({})

      get :data_lens, :id => '1234-1234', :app => 'dataCards'
      assert_response(403)

      get :visualization_add, :datasetId => 'data-sett', :app => 'dataCards'
      assert_response(403)
    end

    should 'redirect to the 404 page if the dataset is not found' do
      PageMetadataManager.any_instance.stubs(:show).returns(data_lens_page_metadata)
      DataLensController.any_instance.stubs(:fetch_dataset_metadata).raises(CommonMetadataMethods::DatasetMetadataNotFound)
      DataLensManager.any_instance.stubs(:fetch).returns({})

      get :data_lens, :id => '1234-1234', :app => 'dataCards'
      assert_response(404)

      get :visualization_add, :datasetId => 'data-sett', :app => 'dataCards'
      assert_response(404)
    end

    should 'redirect to the 500 page if it encounters an upstream error' do
      DataLensManager.any_instance.stubs(:fetch).raises(RuntimeError)

      get :data_lens, :id => '1234-1234', :app => 'dataCards'
      assert_response(500)
    end
  end

  context 'visualization_add' do
    setup do
      DataLensController.any_instance.stubs(:fetch_dataset_metadata).returns(v1_dataset_metadata.with_indifferent_access)

      # note that this is not parsed json!
      View.any_instance.stubs(:find_related_as_json => '[]')
      DataLensController.stubs(
        :find_all_uids => {
          :nbe => 'test-data',
          :all => [ 'test-data', 'obev-rson' ]
        }
      )
    end

    should 'successfully get' do
      get :visualization_add, :datasetId => 'test-data', :app => 'dataCards'
      assert_response :success
    end

    should 'assign dataset_metadata' do
      get :visualization_add, :datasetId => 'test-data', :app => 'dataCards'
      assert_equal(assigns[:dataset_id], 'obev-rson')
    end
  end

  context 'google analytics' do
    setup do
      PageMetadataManager.any_instance.stubs(
        :show => data_lens_page_metadata
      )
      DataLensController.any_instance.stubs(:fetch_dataset_metadata).returns(v1_dataset_metadata.with_indifferent_access)
      DataLensManager.any_instance.stubs(:fetch).returns({})
    end

    should 'not render google analytics JS if feature flag is not set' do
      init_feature_flag_signaller(:with => {
        :enable_opendata_ga_tracking => false,
        :site_chrome_header_and_footer_for_data_lens => false
      })
      get :data_lens, :id => '1234-1234', :app => 'dataCards'
      assert_no_match(/_gaSocrata\('create', 'UA-.+-.+'/, @response.body)
    end

    should 'render google analytics JS using the app config token if feature flag is set to true' do
      APP_CONFIG.opendata_ga_tracking_code = 'UA-9046230'
      init_feature_flag_signaller(:with => {
        :enable_opendata_ga_tracking => true,
        :site_chrome_header_and_footer_for_data_lens => false
      })
      get :data_lens, :id => '1234-1234', :app => 'dataCards'
      assert_match(/_gaSocrata\('create', 'UA-9046230', 'auto', 'socrata'\);/, @response.body)
    end

    should 'render google analytics JS using the app config token if feature flag is an empty string' do
      APP_CONFIG.opendata_ga_tracking_code = 'UA-9046230'
      init_feature_flag_signaller(:with => {
        :enable_opendata_ga_tracking => '',
        :site_chrome_header_and_footer_for_data_lens => false
      })
      get :data_lens, :id => '1234-1234', :app => 'dataCards'
      assert_match(/_gaSocrata\('create', 'UA-9046230', 'auto', 'socrata'\);/, @response.body)
    end

    should 'render google analytics JS with explicit ga code if specified' do
      init_feature_flag_signaller(:with => {
        :enable_opendata_ga_tracking => 'UA-1234-567890',
        :site_chrome_header_and_footer_for_data_lens => false
      })
      get :data_lens, :id => '1234-1234', :app => 'dataCards'
      assert_match(/_gaSocrata\('create', 'UA-1234-567890', 'auto', 'socrata'\);/, @response.body)
    end
  end

  # Note you can always reach the mobile page by appending /mobile
  test 'should redirect to mobile when appending /mobile to the URL' do
    View.any_instance.stubs(
      :data_lens? => true
    )

    params = {
      :controller => 'data_lens',
      :action => 'show_mobile',
      :id => '1234-five'
    }

    ActionDispatch::Request.any_instance.stubs(
      :path_parameters => params.with_indifferent_access
    )

    assert_recognizes(params, 'view/1234-five/mobile')
  end

  test 'should redirect to mobile when appending /mobile to the SEO friendly URL' do
    View.any_instance.stubs(
      :data_lens? => true
    )

    params = {
      :controller => 'data_lens',
      :action => 'show',
      :id => '1234-five'
    }

    ActionDispatch::Request.any_instance.stubs(
      :path_parameters => params.with_indifferent_access
    )

    assert_recognizes(params, '/incredibly/friendly/view/1234-five')
  end

  test 'should not show the mobile page when is_mobile is true' do
    View.any_instance.stubs(
      :data_lens? => true
    )

    ApplicationHelper.stubs(
      :is_mobile? => true
    )

    params = {
      :controller => 'data_lens',
      :action => 'show',
      :id => '1234-five'
    }

    ActionDispatch::Request.any_instance.stubs(
      :path_parameters => params.with_indifferent_access
    )

    assert_recognizes(params, '/incredibly/friendly/view/1234-five')
  end

  private

  def migration_metadata
    {
      :nbeId => 'test-data',
      :obeId => 'obev-rson'
    }
  end

  def data_lens_page_metadata
    outer_metadata = JSON.parse(File.read("#{Rails.root}/test/fixtures/v2-page-metadata.json")).with_indifferent_access
    outer_metadata['displayFormat']['data_lens_page_metadata']
  end

  def v1_dataset_metadata
    JSON.parse(File.read("#{Rails.root}/test/fixtures/v1-dataset-metadata.json")).with_indifferent_access
  end

  def vif_fixture_string
    File.read("#{Rails.root}/test/fixtures/vif.json")
  end

  def visualization_embed_json
    JSON::parse(File.read("#{Rails.root}/test/fixtures/vif.json"))
  end

  def stub_basic_data_lens
    DataLensManager.any_instance.stubs(:fetch).returns({})
    PageMetadataManager.any_instance.stubs(:show).returns(data_lens_page_metadata)
    DataLensController.any_instance.stubs(:fetch_dataset_metadata).returns(v1_dataset_metadata.with_indifferent_access)
  end
end
