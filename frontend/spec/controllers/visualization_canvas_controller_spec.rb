require 'rails_helper'

describe VisualizationCanvasController do
  include TestHelperMethods

  let(:create_payload) do
    {
      :name => 'Test Data',
      :description => 'Consider yourself described',
      :displayFormat => {
        :visualizationCanvasMetadata => {
          :version => 1,
          :vifs => [],
          :filters => []
        }
      },
      :displayType => 'visualization',
      :metadata => {
        :availableDisplayTypes => ['visualization']
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
        :description => 'Consider yourself described'
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
    init_environment
    init_current_user(@controller)
    login
  end

  describe 'POST /visualization_canvas' do
    describe 'as a roled user' do
      before do
        allow(subject).to receive(:current_user).and_return(double({:can_create_or_edit_visualization_canvas? => true}))
      end

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
  end

  describe 'PUT /visualization_canvas/:id' do
    describe 'as a roled user' do
      before do
        allow(subject).to receive(:current_user).and_return(double({:can_create_or_edit_visualization_canvas? => true}))
      end

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

end
