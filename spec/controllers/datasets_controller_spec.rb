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

  describe 'SEO friendly datase show page' do

    before(:each) do
      init_core_session
      init_current_domain
      init_current_user(controller)
      login
      allow(subject).to receive(:get_view).and_return(view)
      allow(subject).to receive(:using_canonical_url?).and_return(true)
      subject.instance_variable_set('@meta', {})
      allow(FeatureFlags).to receive(:derive).and_return(OpenStruct.new(:dataset_landing_page_enabled? => true))
    end

    context 'with DSLP fully enabled' do

      before do
        stub_request(:get, 'http://localhost:8080/manifest_version.json?uid=test-data').
          with(request_headers).
          to_return(:status => 200, :body => view_json, :headers => {})
      end

      describe 'GET /category/view_name/id' do

        before do
          stub_request(:get, 'http://localhost:8080/views/test-data.json').
            with(request_headers).
            to_return(:status => 200, :body => '', :headers => {})
        end

        it 'should display the DSLP page' do
          get :show, :category => 'Personal', :view_name => 'Test-Data', :id => 'test-data'
          expect(response).to have_http_status(:success)
        end

      end

      describe 'GET /category/view_name/id/about' do

        before do
          stub_request(:get, 'http://localhost:8080/views/test-data.json').
            with(request_headers).
            to_return(:status => 200, :body => '', :headers => {})
        end

        it 'should display the DSLP page' do
          get :about, :category => 'Personal', :view_name => 'Test-Data', :id => 'test-data'
          expect(response).to have_http_status(:success)
        end

      end

      describe 'GET /category/view_name/id/data' do

        it 'should display the DSLP page' do
          allow(subject).to receive(:using_canonical_url?).and_return(false)
          get :show, :category => 'Personal', :view_name => 'Test-Data', :id => 'test-data'
          expect(response).to have_http_status(:redirect)
        end

      end

    end

  end

end
