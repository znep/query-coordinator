require 'rails_helper'

describe VisualizationCanvasController do
  include TestHelperMethods

  let(:create_payload) do
    {
      :name => 'Test Data',
      :description => 'Consider yourself described',
      :columns => [],
      :displayFormat => {
        :visualizationCanvasMetadata => {
          :version => 1,
          :vifs => [],
          :filters => []
        }
      },
      :displayType => 'data_lens',
      :metadata => {
        :availableDisplayTypes => ['data_lens']
      },
      :originalViewId => 'mama-dada'
    }
  end

  let(:update_payload) do
    {
      :name => 'Test Data',
      :description => 'Consider yourself described',
      :displayFormat => {
        :visualizationCanvasMetadata => {
          :version => 1,
          :vifs => [],
          :filters => []
        }
      }
    }
  end

  let(:store) do
    {
      :view => {
        :name => 'Test Data',
        :description => 'Consider yourself described',
        :columns => []
      },
      :parentView => {
        :id => 'mama-dada'
      },
      :vifs => [],
      :filters => []
    }
  end

  let(:store_with_id) do
    store.deep_merge({
      :view => {
        :id => 'test-view'
      }
    })
  end

  let(:error) { CoreServer::CoreServerError.new(1, 2, 3) }

  before(:each) do
    allow(subject).to receive(:enable_site_chrome?).and_return(false)
    init_core_session
    init_current_user(@controller)
    init_current_domain
    init_feature_flag_signaller
    login
  end

  describe 'POST /visualization_canvas' do
    it 'makes a post request to core with the expected payload' do
      stub_request(:post, 'http://localhost:8080/views.json?accessType=WEBSITE').
        with(:body => JSON.dump(create_payload)).
        to_return(:status => 200, :body => JSON.dump(store), :headers => {})

      post :create, JSON.dump(store)
      expect(response).to have_http_status(:success)
    end

    it 'returns an error message when core throws an error' do
      stub_request(:post, 'http://localhost:8080/views.json?accessType=WEBSITE').
        to_return(:status => 500, :body => '{}', :headers => {})

      post :create, JSON.dump(store)
      expect(response).to have_http_status(:error)
    end
  end

  describe 'PUT /visualization_canvas/:id' do
    it 'makes a put request to core with the expected payload' do
      stub_request(:put, 'http://localhost:8080/views/test-view.json?accessType=WEBSITE').
        with(:body => JSON.dump(update_payload)).
        to_return(:status => 200, :body => JSON.dump(store_with_id), :headers => {})

      put :update, JSON.dump(store_with_id), { :format => 'json', :id => 'test-view' }
      expect(response).to have_http_status(:success)
    end

    it 'returns an error message when core throws an error' do
      stub_request(:put, 'http://localhost:8080/views/test-view.json?accessType=WEBSITE').
        to_return(:status => 500, :body => '{}', :headers => {})

      put :update, JSON.dump(store_with_id), { :format => 'json', :id => 'test-view' }
      expect(response).to have_http_status(:error)
    end
  end

end