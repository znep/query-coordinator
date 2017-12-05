require 'rails_helper'

describe ApprovalsController do
  include TestHelperMethods

  before do
    init_environment # stubs superadmin by default
    allow(subject).to receive(:user_can_review_approvals?).and_return(true)
  end

  describe 'get /settings', :verify_stubs => false do
   let(:approver) { User.new(some_user) }

    it 'renders the settings page with a list of approvers' do
      VCR.use_cassette('get_approvals_settings', :record => :new_episodes) do
        allow(User).to receive(:find).and_return(approver)
        allow(User).to receive(:find_with_right).and_return([approver])
        get :settings
        expect(response).to have_http_status(:success)
        expect(assigns(:approvers)).not_to be_empty
      end
    end
  end

  describe 'put /settings', :verify_stubs => false do
    let(:params) do
      {
        'official_approval_strategy' => 'manual',
        'community_approval_strategy' => 'automatic',
        'reapproval_strategy' => 'manual'
      }
    end

    it 'updates the settings' do
      VCR.use_cassette('put_approvals_settings', :record => :new_episodes) do
        put :settings, params
        expect(response).to have_http_status(:success)
      end
    end
  end

end
