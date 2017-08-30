require 'rails_helper'

describe PageMetadataController do
  include TestHelperMethods

  let(:user) { User.new({ 'roleName' => 'publisher' }) }
  let(:page_metadata) do
    json_fixture('v2-page-metadata.ported-from-minitest.json')['displayFormat']['data_lens_page_metadata']
  end
  let(:page_metadata_with_parent) { page_metadata.merge({ 'parentLensId' => 'pare-ntid' }) }
  let(:page_id) { page_metadata['pageId'] }
  let(:parent_id) { page_metadata_with_parent['parentLensId'] }

  before do
    init_environment
    init_current_user(subject)

    allow(subject).to receive(:current_user).and_return(user)

    @request.headers['Content-Type'] = 'application/json'
  end

  describe 'POST /metadata/v1/page' do
    let(:phiddy_response) do
      {
        body: %Q( {"pageId": "#{page_id}"} ),
        status: 200
      }
    end

    it 'creates data lens page metadata' do
      payload = page_metadata.except('pageId')

      allow_any_instance_of(PageMetadataManager).to receive(:create).
        with(payload, anything).
        and_return(phiddy_response)

      post :create, payload.to_json, format: :json

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)).to eq({ 'pageId' => page_id })
    end

    describe 'for derived data lenses' do
      it 'creates data lens page metadata if the parent view is accessible' do
        payload = page_metadata_with_parent.except('pageId')

        allow(View).to receive(:find).with(parent_id).
          and_return(instance_double(View, :can_read? => true, :data_lens? => true))

        allow_any_instance_of(PageMetadataManager).to receive(:create).
          with(payload, anything).
          and_return(phiddy_response)

        post :create, payload.to_json, format: :json

        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)).to eq({ 'pageId' => page_id })
      end

      it 'responds 401 if the parent view is not readable' do
        payload = page_metadata_with_parent.except('pageId')

        allow(View).to receive(:find).with(parent_id).
          and_return(instance_double(View, :can_read? => false, :data_lens? => true))

        post :create, payload.to_json, format: :json

        expect(response).to have_http_status(:unauthorized)
      end

      it 'responds 401 if the parent view is not a data lens' do
        payload = page_metadata_with_parent.except('pageId')

        allow(View).to receive(:find).with(parent_id).
          and_return(instance_double(View, :can_read? => true, :data_lens? => false))

        post :create, payload.to_json, format: :json

        expect(response).to have_http_status(:unauthorized)
      end

      it 'responds 401 if the parent view is deleted' do
        payload = page_metadata_with_parent.except('pageId')

        allow(View).to receive(:find).with(parent_id).
          and_raise(CoreServer::ResourceNotFound.new(@response))

        post :create, payload.to_json, format: :json

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'PUT /metadata/v1/page/:id' do
    let(:phiddy_response) do
      {
        body: %Q( {"pageId": "#{page_id}"} ),
        status: 200
      }
    end

    it 'updates data lens page metadata' do
      payload = page_metadata

      allow(View).to receive(:find).with(page_id).
        and_return(instance_double(View, :can_edit? => true))

      allow_any_instance_of(PageMetadataManager).to receive(:update).
        with(payload, anything).
        and_return(phiddy_response)

      put :update, payload.to_json, format: :json, id: page_id

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)).to eq({ 'pageId' => page_id })
    end

    it 'responds 401 if the user cannot edit the view' do
      payload = page_metadata

      allow(View).to receive(:find).with(page_id).
        and_return(instance_double(View, :can_edit? => false))

      put :update, payload.to_json, format: :json, id: page_id

      expect(response).to have_http_status(:unauthorized)
    end

    it 'responds 406 if the page ids are mismatched' do
      payload = page_metadata.merge({ 'pageId' => 'evil-haxx' })

      allow(View).to receive(:find).with(page_id).
        and_return(instance_double(View, :can_edit? => true))

      put :update, payload.to_json, format: :json, id: page_id

      expect(response).to have_http_status(:not_acceptable)
    end
  end

  describe 'DELETE /metadata/v1/page/:id' do
    let(:phiddy_response) do
      {
        body: '',
        status: 200
      }
    end

    it 'deletes data lens page metadata' do
      allow(View).to receive(:find).with(page_id).
        and_return(instance_double(View, :can_edit? => true))

      allow_any_instance_of(PageMetadataManager).to receive(:delete).
        with(page_id, anything).
        and_return(phiddy_response)

      delete :destroy, format: :json, id: page_id

      expect(response).to have_http_status(:ok)
    end

    it 'responds 401 if the user cannot edit the view' do
      allow(View).to receive(:find).with(page_id).
        and_return(instance_double(View, :can_edit? => false))

      delete :destroy, format: :json, id: page_id

      expect(response).to have_http_status(:unauthorized)
    end

    it 'allows metadata deletion if the view cannot be found' do
      allow(View).to receive(:find).with(page_id).
        and_raise(CoreServer::ResourceNotFound.new(@request))

      allow_any_instance_of(PageMetadataManager).to receive(:delete).
        with(page_id, anything).
        and_return(phiddy_response)

      delete :destroy, format: :json, id: page_id

      expect(response).to have_http_status(:ok)
    end
  end
end
