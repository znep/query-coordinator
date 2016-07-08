require 'rails_helper'

describe DatasetLandingPageController do
  include TestHelperMethods

  let(:view_data) do
    {
      :id => 'test-data',
      :name => 'Test-Data'
    }
  end
  let(:view_json) { view_data.to_json }

  let(:views) { [view_data, view_data] }
  let(:views_json) { views.to_json }

  let(:error) { CoreServer::CoreServerError.new(1, 2, 3) }

  before(:each) do
    init_core_session
    init_current_domain
    init_current_user(controller)
    login
  end

  describe 'GET /dataset_landing_page/id/popular_views' do
    it 'returns the popular views as json' do
      allow_any_instance_of(DatasetLandingPage).to receive(:get_popular_views).and_return(views)

      get :popular_views, :id => 'abcd-1234'
      expect(response).to have_http_status(:success)
      expect(response.body).to eq(views_json)
    end

    it 'returns an error message when a core error is thrown' do
      allow_any_instance_of(DatasetLandingPage).to receive(:get_popular_views).and_raise(error)

      get :popular_views, :id => 'abcd-1234'
      expect(response).to have_http_status(:internal_server_error)
      expect(response.body).to match(/Failed/)
    end
  end

  describe 'GET /dataset_landing_page/id/featured_content' do
    it 'returns the featured content as json' do
      allow_any_instance_of(DatasetLandingPage).to receive(:get_featured_content).and_return(views)

      get :get_featured_content, :id => 'abcd-1234'
      expect(response).to have_http_status(:success)
      expect(response.body).to eq(views_json)
    end

    it 'returns an error message when a core error is thrown' do
      allow_any_instance_of(DatasetLandingPage).to receive(:get_featured_content).and_raise(error)

      get :get_featured_content, :id => 'abcd-1234'
      expect(response).to have_http_status(:internal_server_error)
      expect(response.body).to match(/Failed/)
    end
  end

  describe 'POST /dataset_landing_page/id/featured_content' do
    it 'returns the added view as json' do
      allow_any_instance_of(DatasetLandingPage).to receive(:add_featured_content).
        and_return(view_data)

      post :post_featured_content, :id => 'abcd-1234'
      expect(response).to have_http_status(:success)
      expect(response.body).to eq(view_json)
    end

    it 'returns an error message when a core error is thrown' do
      allow_any_instance_of(DatasetLandingPage).to receive(:add_featured_content).and_raise(error)

      post :post_featured_content, :id => 'abcd-1234'
      expect(response).to have_http_status(:internal_server_error)
      expect(response.body).to match(/Failed/)
    end
  end

  describe 'GET /dataset_landing_page/formatted_view/id' do
    it 'returns the fetched view as json' do
      allow_any_instance_of(DatasetLandingPage).to receive(:get_formatted_view_widget_by_id).
        and_return(view_data)

      get :get_formatted_view_by_id, :id => 'abcd-1234'
      expect(response).to have_http_status(:success)
      expect(response.body).to eq(view_json)
    end

    it 'returns an error message when a core error is thrown' do
      allow_any_instance_of(DatasetLandingPage).to receive(:get_formatted_view_widget_by_id).
        and_raise(error)

      get :get_formatted_view_by_id, :id => 'abcd-1234'
      expect(response).to have_http_status(:internal_server_error)
      expect(response.body).to match(/Failed/)
    end
  end
end
