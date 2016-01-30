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

    before do
      stub_sufficient_rights
      allow(AirbrakeNotifier).to receive(:report_error)
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
      before do
        allow(PermissionsUpdater).to receive(:new).and_return(mock_permissions_updater)
        allow(mock_permissions_updater).to receive(:update_permissions).and_return(true)
        stub_valid_session
      end

      it 'initializes PermissionsUpdater with params' do
        expect(PermissionsUpdater).to receive(:new).with(
          mock_valid_user,
          mock_user_authorization,
          story_uid
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

        it 'receives an error' do
          put :update, params
          expect(response).to be_error
        end
      end
    end
  end

  describe 'require_sufficient_rights' do
    let(:action) { :nothing }
    let(:get_request) { get action, uid: 'test-test' }

    before do
      stub_core_view('test-test')
      stub_valid_session
    end

    describe 'when updating the story\'s permissions' do
      let(:admin) { false }
      let(:owner) { false }
      let(:action) { :update }

      before do
        permissions_updater = instance_double('PermissionsUpdater', :update_permissions => true)
        allow(PermissionsUpdater).to receive(:new).and_return(permissions_updater)
        allow(controller).to receive(:admin?).and_return(admin)
        allow(controller).to receive(:owner?).and_return(owner)
      end

      describe 'when user is admin' do
        let(:admin) { true }

        it 'does not 403' do
          get_request
          expect(response.status).to_not be(403)
        end
      end

      describe 'when user is owner' do
        let(:owner) { true }

        it 'does not 403' do
          get_request
          expect(response.status).to_not be(403)
        end
      end

      describe 'when user is neither admin nor owner' do
        it '403s' do
          get_request
          expect(response.status).to be(403)
        end
      end
    end
  end

end
