require 'rails_helper'

describe DatasetsController do
  include TestHelperMethods

  let(:view_data) do
    {
      :id => 'test-data',
      :createdAt => 1456530636244,
      :columns => [],
      :name => 'Test-Data',
      :viewType => 'tabular',
      :meta_description => 'Test-Test-Data',
      :flags => ['default']
    }.with_indifferent_access
  end

  let(:derived_view_data) do
    {
      :id => 'data-lens',
      :createdAt => 1456530636244,
      :columns => [],
      :name => 'Data-Lens',
      :viewType => 'tabular',
      :displayType => 'data_lens',
      :displayFormat => {
        :data_lens_page_metadata => {
          :name => 'test name',
          :description => 'test description'
        }
      }
    }.with_indifferent_access
  end

  let(:story_view_data) do
    {
      :id => 'test-stry',
      :createdAt => 1456530636244,
      :columns => [],
      :name => 'My Test Story',
      :viewType => 'story'
    }.with_indifferent_access
  end

  let(:view_json) { view_data.to_json }
  let(:view) { View.new(view_data) }
  let(:derived_view) { View.new(derived_view_data) }
  let(:story_view) { View.new(story_view_data) }

  before do
    stub_request(:get, 'http://localhost:8080/manifest_version.json?uid=test-data').
      with(:headers => request_headers).
      to_return(:status => 200, :body => view_json, :headers => {})
  end

  describe 'Accessing public forms on private datasets' do
    before(:each) do
      init_environment
      allow(subject).to receive(:enable_site_chrome?).and_return(false)
    end

    context 'when logged out' do
      it 'loads the page without error' do
        expect(View).to receive(:find).and_return(view)
        expect(subject).to receive(:using_canonical_url?).and_return(true)
        view.stub(
          :op_measure? => false,
          :is_form? => true,
          :can_add? => true,
          :can_read? => false
        )
        logout
        get :show, :id => 'dont-matr'
        expect(response).to have_http_status(:success)
      end
    end

    context 'when logged in' do

      it 'loads the page without error' do
        init_current_user(controller)
        login
        expect(View).to receive(:find).and_return(view)
        expect(subject).to receive(:using_canonical_url?).and_return(true)
        view.stub(
          :op_measure? => false,
          :is_form? => true,
          :can_add? => true,
          :can_read? => false
        )
        get :show, :id => 'dont-matr'
        expect(response).to have_http_status(:success)
      end

    end

  end

  describe 'SEO friendly dataset show page' do

    before(:each) do
      init_environment
      init_current_user(controller)
      login
      allow(subject).to receive(:get_view).and_return(view)
      allow(subject).to receive(:using_canonical_url?).and_return(true)
      subject.instance_variable_set('@meta', {})
      allow(subject).to receive(:enable_site_chrome?).and_return(false)
      stub_site_chrome
    end

    context 'with DSLP fully enabled' do
      before(:each) do
        allow(subject).to receive(:dataset_landing_page_enabled?).and_return(true)
        allow(view).to receive(:has_landing_page?).and_return(true)
        allow(DatasetLandingPage).to receive(:fetch_all).and_return({})
      end

      describe 'GET /category/view_name/id' do

        before do
          stub_request(:get, 'http://localhost:8080/views/test-data.json').
            with(:headers => request_headers).
            to_return(:status => 200, :body => '', :headers => {})
        end

        it 'should display the DSLP page' do
          get :show, :category => 'Personal', :view_name => 'Test-Data', :id => 'test-data'
          expect(response).to have_http_status(:success)
          expect(response).to render_template(:dataset_landing_page)
        end

      end

      describe 'GET /category/view_name/id/about' do

        before do
          stub_request(:get, 'http://localhost:8080/views/test-data.json').
            with(:headers => request_headers).
            to_return(:status => 200, :body => '', :headers => {})
        end

        it 'should display the DSLP page' do
          get :about, :category => 'Personal', :view_name => 'Test-Data', :id => 'test-data'
          expect(response).to have_http_status(:success)
          expect(response).to render_template(:dataset_landing_page)
        end

      end

      describe 'GET /category/view_name/id' do

        it 'should display the DSLP page' do
          allow(subject).to receive(:using_canonical_url?).and_return(false)
          get :show, :category => 'Personal', :view_name => 'Test-Data', :id => 'test-data'
          expect(response).to have_http_status(:redirect)
        end

      end

    end

    context 'saved visualization canvas' do

      before(:each) do
        allow(view).to receive(:visualization_canvas?).and_return(true)
        allow(view).to receive(:parent_view).and_return(double)
      end

      it 'should render the visualization canvas page if the feature flag is enabled' do
        allow(subject).to receive(:visualization_canvas_enabled?).and_return(true)
        get :show, :category => 'Personal', :view_name => 'Test-Data', :id => 'test-data'

        expect(response).to have_http_status(:success)
        expect(response).to render_template(:visualization_canvas)
      end

      it 'should render a 404 if the feature flag is disabled' do
        allow(subject).to receive(:visualization_canvas_enabled?).and_return(false)
        get :show, :category => 'Personal', :view_name => 'Test-Data', :id => 'test-data'

        expect(response).to have_http_status(:not_found)
      end

    end

    context 'for a published story' do
      before(:each) do
        allow(subject).to receive(:get_view).and_return(story_view)
        CurrentDomain.stub(:default_locale => 'the_default_locale', :cname => 'example.com')
      end

      it 'redirects to the stories#show page' do
        get :show, :id => 'test-stry'

        expect(response).to have_http_status(302)
        expect(response).to redirect_to('//example.com/stories/s/My-Test-Story/test-stry')
      end
    end

    context 'for a published OP measure' do
      before(:each) do
        allow(view).to receive(:op_measure?).and_return(true)
      end

      it 'renders the OP measure if the module/feature flag combo is enabled' do
        allow(subject).to receive(:op_standalone_measures_enabled?).and_return(true)
        get :show, :category => 'Personal', :view_name => 'Test-Data', :id => 'test-data'

        expect(response).to have_http_status(:success)
        expect(response).to render_template(:op_measure)
      end

      xit 'does not render the OP measure if the module/feature flag combo is disabled' do
        allow(subject).to receive(:op_standalone_measures_enabled?).and_return(false)
        get :show, :category => 'Personal', :view_name => 'Test-Data', :id => 'test-data'

        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe 'create visualization canvas' do

    before(:each) do
      init_environment
      init_current_user(controller)
      login
      allow(subject).to receive(:get_view).and_return(view)
      allow(subject).to receive(:using_canonical_url?).and_return(true)
      subject.instance_variable_set('@meta', {})
      allow(subject).to receive(:enable_site_chrome?).and_return(false)
      stub_site_chrome
    end

    describe 'GET /category/view_name/id/visualization' do

      it 'should render the visualization canvas page if the feature flag is enabled' do
        allow(subject).to receive(:current_user).and_return(double({:can_create_or_edit_visualization_canvas? => true}))
        allow(subject).to receive(:visualization_canvas_enabled?).and_return(true)
        allow(view).to receive(:new_backend?).and_return(true)
        get :create_visualization_canvas, :category => 'Personal', :view_name => 'Test-Data', :id => 'test-data'

        expect(response).to have_http_status(:success)
        expect(response).to render_template(:visualization_canvas)
      end

      it 'should return a 404 if accessed anonymously' do
        allow(subject).to receive(:current_user).and_return(double({:is_roled_user? => false, :is_superadmin? => false}))
        allow(subject).to receive(:visualization_canvas_enabled?).and_return(true)
        get :create_visualization_canvas, :category => 'Personal', :view_name => 'Test-Data', :id => 'test-data'

        expect(response).to have_http_status(:not_found)
      end

      it 'should return a 404 if the feature flag is disabled' do
        allow(subject).to receive(:current_user).and_return(double({:can_create_or_edit_visualization_canvas? => true}))
        allow(subject).to receive(:visualization_canvas_enabled?).and_return(false)
        get :create_visualization_canvas, :category => 'Personal', :view_name => 'Test-Data', :id => 'test-data'

        expect(response).to have_http_status(:not_found)
      end

      it 'should return a 404 if the view is not a dataset' do
        allow(subject).to receive(:current_user).and_return(double({:can_create_or_edit_visualization_canvas? => true}))
        allow(subject).to receive(:visualization_canvas_enabled?).and_return(true)
        allow(subject).to receive(:get_view).and_return(derived_view)
        get :create_visualization_canvas, :category => 'Personal', :view_name => 'Test-Data', :id => 'test-data'

        expect(response).to have_http_status(:not_found)
      end

      it 'should return reroute to the NBE 4x4 if the page is accessed with an OBE 4x4' do
        allow(subject).to receive(:current_user).and_return(double({:can_create_or_edit_visualization_canvas? => true}))
        allow(subject).to receive(:visualization_canvas_enabled?).and_return(true)
        allow(view).to receive(:new_backend?).and_return(false)
        allow(view).to receive(:nbe_view).and_return(View.new({ 'id' => '1234-abcd' }))
        get :create_visualization_canvas, :category => 'Personal', :view_name => 'Test-Data', :id => 'test-data'

        expect(response).to have_http_status(:redirect)
        expect(response).to redirect_to('http://test.host/d/1234-abcd/visualization')
      end

      it 'should throw a 500 error if the page is accessed with an OBE 4x4 without OBE-NBE migrations' do
        allow(subject).to receive(:current_user).and_return(double({:can_create_or_edit_visualization_canvas? => true}))
        allow(subject).to receive(:visualization_canvas_enabled?).and_return(true)
        allow(view).to receive(:new_backend?).and_return(false)
        allow(view).to receive(:nbe_view).and_return(nil)
        get :create_visualization_canvas, :category => 'Personal', :view_name => 'Test-Data', :id => 'test-data'

        expect(response).to have_http_status(:internal_server_error)
      end
    end

    describe 'GET /category/view_name/id/edit' do
      it 'should render the edit visualization canvas page' do
        allow(subject).to receive(:current_user).and_return(double({:can_create_or_edit_visualization_canvas? => true}))
        allow(subject).to receive(:visualization_canvas_enabled?).and_return(true)
        allow(subject).to receive(:using_canonical_url?).and_return(false)
        allow(view).to receive(:new_backend?).and_return(true)
        allow(view).to receive(:visualization_canvas?).and_return(true)
        get :edit, :category => 'Personal', :view_name => 'Test-Data', :id => 'test-data'

        expect(subject.instance_variable_get('@site_chrome_admin_header_options')).to eq({size: 'small'})
        expect(subject.instance_variable_get('@body_classes')).to eq('hide-site-chrome')
        expect(response).to redirect_to('http://test.host/dataset/Test-Data/test-data/edit')
      end
    end

  end

  describe 'email dataset' do

    before do
      init_environment
      init_current_user(controller)
      login
      stub_site_chrome
    end

    it 'bails early if there are no email recipients' do
      expect(View).to receive(:find).never
      get :email, :emails => '', :category => 'Personal', :view_name => 'Test-Data', :id => 'test-data'
      expect(response).to have_http_status(:success)
    end

    it 'invokes the email method for each recipient when recipients is an array' do
      view_double = double(View)
      expect(View).to receive(:find).once.and_return(view_double)
      expect(view_double).to receive(:email).twice
      get :email, :emails => ['foo@bar.com', 'bar@foo.com'], :category => 'Personal', :view_name => 'Test-Data', :id => 'test-data'
      expect(response).to have_http_status(:success)
    end

    it 'invokes the email method for each recipient when recipients is an string' do
      view_double = double(View)
      expect(View).to receive(:find).once.and_return(view_double)
      expect(view_double).to receive(:email).twice
      get :email, :emails => 'foo@bar.com, bar@foo.com', :category => 'Personal', :view_name => 'Test-Data', :id => 'test-data'
      expect(response).to have_http_status(:success)
    end

    it 'does not raise when an email recipient is blank' do
      expect(View).to receive(:find).once.and_return(View.new('id' => 'test-test'))
      expect_any_instance_of(View).to receive(:email).twice.and_call_original
      get :email, :emails => 'foo@bar.com, ', :category => 'Personal', :view_name => 'Test-Data', :id => 'test-data'
      expect(response).to have_http_status(:success)
    end

  end

  describe 'edit_metadata' do
    before(:each) do
      init_environment
      init_current_user(controller)
      login
      allow(subject).to receive(:get_view).and_return(derived_view)
      allow(subject).to receive(:using_canonical_url?).and_return(true)
      subject.instance_variable_set('@meta', {})
      allow(subject).to receive(:enable_site_chrome?).and_return(false)
      stub_site_chrome
    end

    context 'when saving a data lens' do
      let(:payload) do
        {
          :name => 'new name',
          :description => 'new description'
        }
      end

      let(:save_payload) do
        {
          :name => 'new name',
          :description => 'new description',
          :displayFormat => {
            :data_lens_page_metadata => {
              :name => 'new name',
              :description => 'new description'
            }
          }
        }
      end

      it 'should write the view name and description through to the display format metadata' do
        stub_request(:put, 'http://localhost:8080/views/data-lens.json').
          with(:body => payload).
          to_return(:status => 200, :body => JSON.dump(payload), :headers => {})

        stub_request(:put, 'http://localhost:8080/views/data-lens.json').
          with(:body => hash_including(save_payload)).
          to_return(:status => 200, :body => '')

        get :edit_metadata, :category => 'Personal', :view_name => 'Problems', :id => 'data-lens', :view => payload
      end
    end
  end

  describe 'entering DSMP' do
    before(:each) do
      stub_site_chrome
      allow(subject).to receive(:dataset_management_page_enabled?).and_return(true)
    end

    context 'GET /:category/:view_name/:id/revisions/manage' do
      before do
        stub_request(:get, 'http://localhost:8080/views/test-data.json').
          with(:headers => request_headers).
          to_return(:status => 200, :body => '', :headers => {})
      end

      before(:each) do
        init_environment
        allow(subject).to receive(:using_canonical_url?).and_return(true)
      end

      # 4x4 is valid and has revision, directly to path with sequence number
      it 'loads the page without error' do
        allow(DatasetManagementAPI).to receive(:get_revision).and_return({'id' => 1})
        allow(DatasetManagementAPI).to receive(:get_sources_index).and_return([{'resource' => {'id' => 2}}])
        allow(DatasetManagementAPI).to receive(:get_source).and_return([])
        allow(DatasetManagementAPI).to receive(:get_websocket_token).and_return('a token')
        init_current_user(controller)
        login
        expect(View).to receive(:find).and_return(view)
        view.stub(:can_read? => true)
        get :dsmui, :view_name => 'Test-Data', :id => 'test-data'
        expect(response).to have_http_status(:success)
      end

      # 4x4 is not found should 404
      it '404s for not found views' do
        init_current_user(controller)
        login
        expect(View).to receive(:find).and_raise(CoreServer::ResourceNotFound.new('response'))
        get :dsmui, :view_name => 'Test-Data', :id => 'test-data'
        expect(response).to have_http_status(:not_found)
      end

      # no permissions for 4x4 should 404
      it '404s if user does not have permission' do
        init_current_user(controller)
        login
        expect(View).to receive(:find).and_return(view)
        view.stub(:can_read? => false)
        get :dsmui, :view_name => 'Test-Data', :id => 'test-data'
        expect(response).to have_http_status(:forbidden)
      end
    end

    context 'GET /d/:id/revisions/:revision_seq' do
      before do
        init_environment
        init_current_user(controller)
        login
        stub_request(:get, 'http://localhost:8080/views/test-data.json').
          with(:headers => request_headers).
          to_return(:status => 200, :body => '', :headers => {})
      end

      # 4x4 is valid and has revision, directly to path with sequence number
      it 'redirects to the canonical address' do
        init_current_user(controller)
        login
        expect(View).to receive(:find).and_return(view)
        view.stub(:can_read? => true)
        expect(subject).to receive(:using_canonical_url?).and_return(false)
        get :dsmui, :view_name => 'Test-Data', :id => 'test-data', :rest_of_path => '/revisions/0'
        expect(response).to have_http_status(:redirect)
        expect(response['Location']).to end_with('/manage/revisions/0')
      end

      it 'redirects to the canonical address, preserving the full path' do
        expect(View).to receive(:find).and_return(view)
        view.stub(:can_read? => true)
        expect(subject).to receive(:using_canonical_url?).and_return(false)
        get :dsmui, :view_name => 'Test-Data', :id => 'test-data', :rest_of_path => '/revisions/0/metadata/columns'
        expect(response).to have_http_status(:redirect)
        expect(response['Location']).to end_with('/manage/revisions/0/metadata/columns')
      end
    end

    context 'GET /:category/:view_name/:id/revisions/current' do
      before do
        init_environment
        init_current_user(controller)
        login
      end

      # 4x4 is valid and has revision, redirected from 'current'
      it 'redirects without error' do
        expect(DatasetManagementAPI)
          .to receive(:get_open_revisions)
          .and_return([{'revision_seq' => 1}, {'revision_seq' => 0}])
        get :current_revision, :id => 'test-data'
        expect(response).to have_http_status(:redirect)
        expect(response['Location']).to end_with('/revisions/1')
      end

      it 'redirects without error, preserving the full path' do
        expect(DatasetManagementAPI)
          .to receive(:get_open_revisions)
          .and_return([{'revision_seq' => 1}, {'revision_seq' => 0}])
        get :current_revision, :id => 'test-data', :rest_of_path => '/metadata/columns'
        expect(response).to have_http_status(:redirect)
        expect(response['Location']).to end_with('/revisions/1/metadata/columns')
      end

      # 4x4 does not have any open revisions should 404 at 'current'
      it '404s when there are no open revisions' do
        expect(DatasetManagementAPI)
          .to receive(:get_open_revisions)
          .and_return([])
        get :current_revision, :id => 'test-data'
        expect(response).to have_http_status(:not_found)
      end
    end

    context 'GET /d/id/revisions/current' do

      before do
        init_environment
      end

      # 4x4 is valid and has revision, directly to path with sequence number
      it 'redirects to a path with the revision sequence' do
        init_current_user(controller)
        login
        expect(DatasetManagementAPI)
          .to receive(:get_open_revisions)
          .and_return([{'revision_seq' => 1}, {'revision_seq' => 0}])

        get :current_revision, :id => 'test-data'
        expect(response).to have_http_status(:redirect)
        expect(response['Location']).to end_with('/revisions/1')
      end

      # 4x4 is valid and has revision, directly to path with sequence number
      it 'redirects to a path with the revision sequence, preserving the full path' do
        init_current_user(controller)
        login
        expect(DatasetManagementAPI)
          .to receive(:get_open_revisions)
          .and_return([{'revision_seq' => 1}, {'revision_seq' => 0}])

        get :current_revision, :id => 'test-data', :rest_of_path => '/metadata/columns'
        expect(response).to have_http_status(:redirect)
        expect(response['Location']).to end_with('/revisions/1/metadata/columns')
      end
    end
  end
end
