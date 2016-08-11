require 'rails_helper'

describe CeteraController do
  include TestHelperMethods

  describe 'get /cetera/users' do
    let(:results) { { 'results' => [] } }

    before(:each) do
      init_core_session
      init_current_domain
      allow(CurrentDomain).to receive(:cname).and_return('localhost')
    end

    context 'when query is provided' do
      it 'fetches users by query' do
        expect_any_instance_of(Cetera::UserSearch).to receive(:find_all_by_query).
          with('pink dinosaurs', :limit => 25).
          and_return(results)

        get :users, :q => 'pink dinosaurs'

        expect(response).to have_http_status(:success)
        expect(response.body).to eq(results.to_json)
      end

      it 'handles errors thrown by Cetera' do
        expect_any_instance_of(Cetera::UserSearch).to receive(:find_all_by_query).
          and_raise('Error')

        get :users, :q => 'pink dinosaurs'

        expect(response).to have_http_status(:internal_server_error)
      end
    end

    it 'handles unknown parameters' do
      get :users, :foo => 'green monsters'

      expect(response).to have_http_status(:bad_request)
    end
  end
end

