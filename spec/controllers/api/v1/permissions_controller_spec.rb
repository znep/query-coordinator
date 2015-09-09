require 'rails_helper'

RSpec.describe Api::V1::PermissionsController, type: :controller do

  describe '#update' do

    let(:mock_permissions_updater) { double('PermissionsUpdater') }
    let(:story_uid) { 'dink-donk' }
    let(:is_public) { true }
    let(:params) do
      {
        uid: story_uid,
        isPublic: is_public
      }
    end

    context 'when not authenticated' do
      before do
        stub_invalid_session
      end

      it 'redirects' do
        put :update, params
        expect(response).to be_redirect
      end
    end

    context 'when authenticated' do
      let(:core_request_headers) do
        {
          'X-Socrata-Host' => 'test-domain.com',
          'X-CSRF-Token' => 'a-token-of-our-appreciation',
          'Cookie' => 'cookies are sometimes food'
        }
      end

      before do
        allow(PermissionsUpdater).to receive(:new).and_return(mock_permissions_updater)
        allow(mock_permissions_updater).to receive(:update_permissions).and_return(true)
        allow(CoreServer).to receive(:headers_from_request).with(request).and_return(core_request_headers)
        stub_valid_session
      end

      it 'initializes PermissionsUpdater with params' do
        expect(PermissionsUpdater).to receive(:new).with(
          mock_valid_user,
          story_uid,
          core_request_headers
        )
        put :update, params
      end

      it 'calls update_permissions on PermissionsUpdater' do
        expect(mock_permissions_updater).to receive(:update_permissions).with(is_public: is_public)
        put :update, params
      end

      it 'renders success' do
        put :update, params
        expect(response).to be_success
      end

      it 'renders json' do
        put :update, params
        json_response = JSON.parse(response.body)
        expect(json_response['isPublic']).to eq(is_public)
      end

      context 'when setting to private' do
        let(:is_public) { false }

        it 'calls update_permissions with is_public: false' do
          expect(mock_permissions_updater).to receive(:update_permissions).with(is_public: is_public)
          put :update, params
        end
      end

      context 'when update_permissions raises' do
        before do
          allow(mock_permissions_updater).to receive(:update_permissions).and_raise
        end

        it 'airbrakes' do
          expect(AirbrakeNotifier).to receive(:report_error)
          put :update, params
        end

        it 'renders Internal Server Error' do
          put :update, params
          expect(response).to be_error
        end
      end
    end
  end

end
