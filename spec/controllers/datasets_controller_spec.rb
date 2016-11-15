require 'rails_helper'

describe DatasetsController do
  include TestHelperMethods

  let(:view_data) do
    {
      :id => 'test-data',
      :createdAt => 1456530636244,
      :columns => [],
      :name => 'Test-Data',
      :meta_description => 'Test-Test-Data'
    }.with_indifferent_access
  end

  let(:view_json) { view_data.to_json }
  let(:view) { View.new(view_data) }

  before do
    stub_request(:get, 'http://localhost:8080/manifest_version.json?uid=test-data').
      with(:headers => request_headers).
      to_return(:status => 200, :body => view_json, :headers => {})
  end

  describe 'Accessing public forms on private datasets' do

    before(:each) do
      init_current_domain
      init_core_session
      init_signaller
      stub_site_chrome
      allow(subject).to receive(:enable_site_chrome?).and_return(false)
    end

    context 'when logged out' do

      it 'loads the page without error' do
        expect(View).to receive(:find).and_return(view)
        expect(subject).to receive(:using_canonical_url?).and_return(true)
        view.stub(
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
      init_core_session
      init_current_domain
      init_current_user(controller)
      init_signaller
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

  end

  describe 'create visualization canvas' do

    before(:each) do
      init_core_session
      init_current_domain
      init_signaller
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
        allow(subject).to receive(:visualization_canvas_enabled?).and_return(true)
        get :create_visualization_canvas, :category => 'Personal', :view_name => 'Test-Data', :id => 'test-data'

        expect(response).to have_http_status(:success)
        expect(response).to render_template(:visualization_canvas)
      end

      it 'should return a 404 if the feature flag is disabled' do
        allow(subject).to receive(:visualization_canvas_enabled?).and_return(false)
        get :create_visualization_canvas, :category => 'Personal', :view_name => 'Test-Data', :id => 'test-data'

        expect(response).to have_http_status(:not_found)
      end

    end

  end

end
