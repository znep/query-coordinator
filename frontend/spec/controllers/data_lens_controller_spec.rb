require 'rails_helper'

describe DataLensController do
  include TestHelperMethods

  before do
    init_environment
  end

  it 'should successfully get data_lens' do
    stub_basic_data_lens
    get :data_lens, :id => '1234-1234', :app => 'dataCards'
    expect(response).to have_http_status(:ok)
  end

  it 'should assign dataset_id, dataset/page metadata, and migration metadata' do
    stub_basic_data_lens
    get :data_lens, :id => '1234-1234', :app => 'dataCards'
    expect(assigns[:dataset_id]).to eq(migration_metadata[:obeId])
    expect(assigns[:dataset_metadata]).to eq(v1_dataset_metadata)
    expect(assigns[:page_metadata]).to eq(data_lens_page_metadata)
    expect(assigns[:migration_metadata]).to eq(migration_metadata)
  end

  it 'should allow frame embedding of data_lens page' do
    stub_basic_data_lens
    get :data_lens, :id => '1234-1234', :app => 'dataCards'
    expect(response.headers['X-Frame-Options']).to eq('ALLOWALL')
  end

  it 'should successfully get data_lens for single card view' do
    stub_basic_data_lens
    get :data_lens, :id => '1234-1234', :field_id => 'field', :app => 'dataCards'
    expect(response).to have_http_status(:ok)
  end

  it 'should successfully get data_lens with empty metadb page data' do
    stub_basic_data_lens
    allow_any_instance_of(View).to receive(:find_related).and_return([])
    get :data_lens, :id => '1234-1234', :app => 'dataCards'
    expect(response).to have_http_status(:ok)
  end

  it 'should raise an error when a non-existent app is requested' do
    expect {
      get :data_lens, :id => '1234-1234', :app => nil
    }.to raise_error(ActionController::UrlGenerationError)

    expect {
      get :data_lens, :id => '1234-1234', :app => 'notAnApp'
    }.to raise_error(ActionController::UrlGenerationError)
  end

  it 'generic & seo datalens paths route here' do
    test_paths = %w(
      view/1234-five
      cats/dogs/1234-five
    )

    test_paths.each do |path|
      segments = path.split('/')
      if segments.length >= 3
        add_path_params = {category: segments[0], view_name: segments[1], id: segments[2]}
      elsif segments.length == 2
        add_path_params = {id: segments[1]}
      else
        add_path_params = {id: segments[0]}
      end

      params = add_path_params.merge({
        controller: 'data_lens',
        action: 'data_lens',
        app: 'dataCards'
      }).with_indifferent_access

      # rails skips automatic params parsing sometimes https://github.com/rspec/rspec-rails/issues/172
      allow_any_instance_of(ActionDispatch::Request).to receive(:path_parameters).and_return(params)

      expect(get: path).to route_to(params)
    end
  end

  describe 'accessibility' do
    render_views

    before do
      allow(Configuration).to receive(:find_by_type).and_return(Configuration.parse('[{}]'))

      stub_basic_data_lens
      get :data_lens, :id => '1234-1234', :app => 'dataCards'
    end

    it 'should render skip-links in html' do
      expect(response.body).to match(/<div class=\"skip-links\">/)
      expect(response.body).to match(/Go to an accessible version of this page/)
    end

    it 'should render noscript in html' do
      expect(response.body).to match(/<noscript>/)
    end
  end

  describe 'when unauthenticated' do
    it 'should redirect to the login page if the page is private' do
      allow_any_instance_of(PageMetadataManager).to receive(:show).and_raise(DataLensManager::ViewAuthenticationRequired)

      get :data_lens, :id => '1234-1234', :app => 'dataCards'

      expect(controller.session[:return_to]).to eq('/view/1234-1234')
      expect(response).to redirect_to('/login?referer_redirect=1')
    end

    it 'should redirect to the login page if the dataset is private' do
      allow_any_instance_of(DataLensManager).to receive(:fetch).and_raise(DataLensManager::ViewAuthenticationRequired)

      get :data_lens, :id => '1234-1234', :app => 'dataCards'

      expect(controller.session[:return_to]).to eq('/view/1234-1234')
      expect(response).to redirect_to('/login?referer_redirect=1')
    end

    it 'should redirect to the 404 page if the page is not found' do
      allow_any_instance_of(PageMetadataManager).to receive(:show).and_raise(DataLensManager::ViewNotFound)

      get :data_lens, :id => '1234-1234', :app => 'dataCards'

      expect(response).to have_http_status(404)
    end

    it 'should redirect to the 404 page if the dataset is not found' do
      allow_any_instance_of(DataLensManager).to receive(:fetch).and_raise(DataLensManager::ViewNotFound)

      get :data_lens, :id => '1234-1234', :app => 'dataCards'

      expect(response).to have_http_status(404)
    end

    it 'should redirect to the 500 page if it encounters an upstream error' do
      allow_any_instance_of(DataLensManager).to receive(:fetch).and_raise(RuntimeError)

      get :data_lens, :id => '1234-1234', :app => 'dataCards'

      expect(response).to have_http_status(500)
    end

    it 'should redirect to 403 for permission denied error on migration endpoint' do
      stub_basic_data_lens
      allow(View).to receive(:migrations).and_raise(
        CoreServer::CoreServerError.new(
          'GET http://hostname/migrations/cant-hazz',
          'permission_denied',
          "The current user doesn't have access to this view"
        )
      )

      get :data_lens, :id => 'cant-hazz', :app => 'dataCards'

      expect(response).to have_http_status(403)
    end

    it 'should return success for CoreServer::ResourceNotFound' do
      stub_basic_data_lens
      allow(View).to receive(:migrations).and_raise(
        CoreServer::ResourceNotFound.new(Net::HTTPNotFound.new(nil, nil, nil))
      )

      get :data_lens, :id => 'aint-here', :app => 'dataCards'

      assert_response(200)
    end
  end

  describe 'when authenticated' do
    it 'should redirect to the 403 page if the page is private' do
      allow_any_instance_of(PageMetadataManager).to receive(:show).and_raise(DataLensManager::ViewAccessDenied)

      get :data_lens, :id => '1234-1234', :app => 'dataCards'

      expect(response).to have_http_status(403)
    end

    it 'should redirect to the 404 page if the page is not found' do
      allow_any_instance_of(PageMetadataManager).to receive(:show).and_raise(DataLensManager::ViewNotFound)

      get :data_lens, :id => '1234-1234', :app => 'dataCards'

      expect(response).to have_http_status(404)
    end

    it 'should redirect to the 403 page if the dataset is private' do
      stub_basic_data_lens
      allow(controller).to receive(:fetch_dataset_metadata).and_raise(CommonMetadataMethods::UnauthorizedDatasetMetadataRequest)

      get :data_lens, :id => '1234-1234', :app => 'dataCards'
      expect(response).to have_http_status(403)

      get :visualization_add, :datasetId => 'test-data', :app => 'dataCards'
      expect(response).to have_http_status(403)
    end

    it 'should redirect to the 403 page if the dataset is private case two' do
      stub_basic_data_lens
      allow(controller).to receive(:fetch_dataset_metadata).and_raise(CommonMetadataMethods::UnauthorizedPageMetadataRequest)

      get :data_lens, :id => '1234-1234', :app => 'dataCards'
      expect(response).to have_http_status(403)

      get :visualization_add, :datasetId => 'test-data', :app => 'dataCards'
      expect(response).to have_http_status(403)
    end

    it 'should redirect to the 404 page if the dataset is not found' do
      stub_basic_data_lens
      allow(controller).to receive(:fetch_dataset_metadata).and_raise(CommonMetadataMethods::DatasetMetadataNotFound)

      get :data_lens, :id => '1234-1234', :app => 'dataCards'
      expect(response).to have_http_status(404)

      get :visualization_add, :datasetId => 'test-data', :app => 'dataCards'
      expect(response).to have_http_status(404)
    end

    it 'should redirect to the 500 page if it encounters an upstream error' do
      allow_any_instance_of(DataLensManager).to receive(:fetch).and_raise(RuntimeError)

      get :data_lens, :id => '1234-1234', :app => 'dataCards'
      expect(response).to have_http_status(500)
    end
  end

  describe 'visualization_add' do
    before do
      test_view = View.new(json_fixture('sample-data.json'))

      allow(View).to receive(:migrations).and_return(migration_metadata)
      allow(View).to receive(:find).and_return(test_view)

      allow(controller).to receive(:fetch_dataset_metadata).and_return(v1_dataset_metadata.with_indifferent_access)
    end

    it 'should successfully get' do
      get :visualization_add, :datasetId => 'test-data', :app => 'dataCards'
      expect(response).to have_http_status(:ok)
    end

    it 'should assign dataset_metadata' do
      get :visualization_add, :datasetId => 'test-data', :app => 'dataCards'
      expect(assigns[:dataset_id]).to eq('obev-rson')
    end
  end

  describe 'google analytics' do
    render_views

    before do
      stub_basic_data_lens
      allow(Configuration).to receive(:find_by_type).and_return(Configuration.parse('[{}]'))
    end

    it 'should not render google analytics JS if feature flag is not set' do
      stub_feature_flags_with(
        enable_opendata_ga_tracking: false,
        site_chrome_header_and_footer_for_data_lens: false
      )
      get :data_lens, :id => '1234-1234', :app => 'dataCards'
      expect(response.body).not_to match(/_gaSocrata\('create', 'UA-.+'/)
    end

    it 'should render google analytics JS using the app config token if feature flag is set to true' do
      APP_CONFIG.opendata_ga_tracking_code = 'UA-default-fake'
      stub_feature_flags_with(
        enable_opendata_ga_tracking: true,
        site_chrome_header_and_footer_for_data_lens: false
      )
      get :data_lens, :id => '1234-1234', :app => 'dataCards'
      expect(response.body).to match(/_gaSocrata\('create', 'UA-default-fake', 'auto', 'socrata'\);/)
    end

    it 'should render google analytics JS using the app config token if feature flag is an empty string' do
      APP_CONFIG.opendata_ga_tracking_code = 'UA-default-fake'
      stub_feature_flags_with(
        enable_opendata_ga_tracking: '',
        site_chrome_header_and_footer_for_data_lens: false
      )
      get :data_lens, :id => '1234-1234', :app => 'dataCards'
      expect(response.body).to match(/_gaSocrata\('create', 'UA-default-fake', 'auto', 'socrata'\);/)
    end

    it 'should render google analytics JS with explicit ga code if specified' do
      stub_feature_flags_with(
        enable_opendata_ga_tracking: 'UA-specific-fake',
        site_chrome_header_and_footer_for_data_lens: false
      )
      get :data_lens, :id => '1234-1234', :app => 'dataCards'
      expect(response.body).to match(/_gaSocrata\('create', 'UA-specific-fake', 'auto', 'socrata'\);/)
    end
  end

  describe 'mobile' do
    let(:params) do
      { :controller => 'data_lens', :action => 'show_mobile', :id => '1234-five' }.with_indifferent_access
    end

    before do
      allow_any_instance_of(View).to receive(:data_lens?).and_return(true)
      allow_any_instance_of(ActionDispatch::Request).to receive(:path_parameters).and_return(params)
    end

    it 'should redirect to mobile when appending /mobile to the URL' do
      expect(get: '/view/1234-five/mobile').to route_to(params)
    end

    it 'should redirect to mobile when appending /mobile to the SEO friendly URL' do
      expect(get: '/incredibly/friendly/view/1234-five/mobile').to route_to(params)
    end

    # This test description does not match its assertion!
    xit 'should not show the mobile page when is_mobile is true' do
      allow(controller).to receive(:is_mobile?).and_return(true)
      expect(get: '/incredibly/friendly/view/1234-five').to route_to(params)
    end
  end

  private

  def migration_metadata
    { :nbeId => 'test-data', :obeId => 'obev-rson' }
  end

  def data_lens_page_metadata
    json_fixture('v2-page-metadata.json')['displayFormat']['data_lens_page_metadata']
  end

  def v1_dataset_metadata
    json_fixture('v1-dataset-metadata.json')
  end

  def stub_basic_data_lens
    test_view = View.new(json_fixture('sample-data.json'))

    allow(View).to receive(:migrations).and_return(migration_metadata)
    allow(View).to receive(:find).and_return(test_view)
    allow_any_instance_of(View).to receive(:find_related).and_return([test_view])

    allow_any_instance_of(DataLensManager).to receive(:fetch).and_return({})
    allow_any_instance_of(PageMetadataManager).to receive(:show).and_return(data_lens_page_metadata)
    allow(controller).to receive(:fetch_dataset_metadata).and_return(v1_dataset_metadata)
  end
end
