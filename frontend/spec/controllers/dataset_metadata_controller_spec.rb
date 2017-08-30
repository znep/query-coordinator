require 'rails_helper'

describe DatasetMetadataController do
  include TestHelperMethods

  let(:user) { User.new({ 'roleName' => 'publisher' }) }
  let(:v1_dataset_metadata) { json_fixture('v1-dataset-metadata.ported-from-minitest.json') }
  let(:dataset_id) { v1_dataset_metadata['id'] }
  let(:feature_flags) { {} }

  before do
    init_environment(feature_flags: feature_flags)
    init_current_user(subject)

    allow(subject).to receive(:current_user).and_return(user)

    @request.headers['Content-Type'] = 'application/json'
  end

  describe 'GET /metadata/v1/dataset/:id' do
    let(:nbe_view) { instance_double(View, data: {}) }
    let(:owner_double) { double('owner', id: 'owne-ruid') }

    it 'retrieves dataset metadata' do
      allow_any_instance_of(CoreServer::Connection).to receive(:get_request).
        and_return('[{"_0": "0"}]')
      allow(View).to receive(:find).
        with(dataset_id, anything).
        and_return(double(View, id: dataset_id, nbe_view: nbe_view, name: 'obe view', owner: owner_double, time_metadata_last_updated_at: Time.now.to_i))
      allow_any_instance_of(Phidippides).to receive(:fetch_dataset_metadata).
        with(dataset_id, anything).
        and_return({ 'body' => v1_dataset_metadata }.with_indifferent_access)
      allow_any_instance_of(DataLensManager).to receive(:fetch).
        and_return(v1_dataset_metadata)

      get :show, format: :json, id: dataset_id

      expect(response).to have_http_status(:ok)
    end

    it 'responds 403 if the user cannot read the dataset data' do
      allow_any_instance_of(CoreServer::Connection).to receive(:get_request).
        and_return('{"error": true}')

      get :show, format: :json, id: dataset_id

      expect(response).to have_http_status(:forbidden)
    end

    it 'fails in a variety of ways when trying to fetch permissions' do
      allow_any_instance_of(CoreServer::Connection).to receive(:get_request).
        and_return('[{"_0": "0"}]')

      allow_any_instance_of(DataLensManager).to receive(:fetch).
        and_raise(DataLensManager::ViewNotFound.new)

      get :show, format: :json, id: dataset_id

      expect(response).to have_http_status(:not_found)

      allow_any_instance_of(DataLensManager).to receive(:fetch).
        and_raise(DataLensManager::ViewAuthenticationRequired.new)

      get :show, format: :json, id: dataset_id

      expect(response).to have_http_status(:unauthorized)

      allow_any_instance_of(DataLensManager).to receive(:fetch).
        and_raise(DataLensManager::ViewAccessDenied.new)

      get :show, format: :json, id: dataset_id

      expect(response).to have_http_status(:forbidden)
    end

    context 'when disable_metadata_v1_endpoint is true' do
      let(:feature_flags) { { disable_metadata_v1_endpoint: true } }

      it 'responds 404' do
        get :show, format: :json, id: dataset_id
        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe 'GET /metadata/v1/dataset/:id/pages' do
    let(:phiddy_response) do
      {
        body: {
          publisher: [{
            datasetId: 'four-four',
            pageId: 'neww-page',
            version: '1'
          }]
        },
        status: 200
      }
    end

    context 'when disable_metadata_v1_endpoint is true' do
      let(:feature_flags) { { disable_metadata_v1_endpoint: true } }

      it 'responds 404' do
        get :index, format: :json, id: dataset_id
        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe 'PUT /metadata/v1/dataset/:id' do
    let(:payload) { v1_dataset_metadata }

    it 'responds 401 if the user cannot edit the view' do
      allow(View).to receive(:find).with(dataset_id).
        and_return(instance_double(View, :can_edit? => false))

      put :update, payload.to_json, format: :json, id: dataset_id

      expect(response).to have_http_status(:unauthorized)
    end

    context 'when dataset ids are mismatched' do
      let(:payload) { v1_dataset_metadata.merge({ 'id' => 'evil-haxx' }) }

      it 'responds 406' do
        allow(View).to receive(:find).with(dataset_id).
          and_return(instance_double(View, :can_edit? => true))

        put :update, payload.to_json, format: :json, id: dataset_id

        expect(response).to have_http_status(:not_acceptable)
      end
    end

    context 'when disable_metadata_v1_endpoint is true' do
      let(:feature_flags) { { disable_metadata_v1_endpoint: true } }

      it 'responds 404' do
        put :update, payload.to_json, format: :json, id: dataset_id
        expect(response).to have_http_status(:not_found)
      end
    end
  end
end
