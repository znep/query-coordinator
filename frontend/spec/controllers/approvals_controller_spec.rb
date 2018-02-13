require 'rails_helper'

describe Administration::ApprovalsController do
  include TestHelperMethods

  before do
    init_environment # stubs superadmin by default
    allow(subject).to receive(:user_can_review_approvals?).and_return(true)
  end

  let(:some_user) do
    {
      accept_terms: true,
      email: 'foo@bar.com',
      id: '1234-abcd',
      password: 'asdf',
      passwordConfirm: 'asdf'
    }
  end
  let(:workflow) { Fontana::Approval::Workflow.new.tap { |workflow| workflow.id = 1 } }
  let(:approver) { User.new(some_user) }

  describe 'get /settings/:id', :verify_stubs => false do

    it 'renders the settings page with a list of approvers' do
      VCR.use_cassette('get_approvals_settings') do
        allow(User).to receive(:find).and_return(approver)
        allow(User).to receive(:find_with_right).and_return([approver])
        allow(Fontana::Approval::Workflow).to receive(:find).and_return(workflow)
        expect(workflow).not_to receive(:update)
        get :settings, :id => workflow.id
        expect(response).to have_http_status(:success)
        expect(assigns(:approvers)).not_to be_empty
      end
    end
  end

  describe 'put /settings/:id', :verify_stubs => false do
    let(:params) do
      {
        'id' => workflow.id,
        'official_approval_strategy' => 'manual'
      }
    end

    it 'updates the settings' do
      VCR.use_cassette('put_approvals_settings') do
        allow(User).to receive(:find).and_return(approver)
        allow(User).to receive(:find_with_right).and_return([approver])
        allow(Fontana::Approval::Workflow).to receive(:find).and_return(workflow)
        expect(workflow).to receive(:update)
        step_double = double(Fontana::Approval::Step)
        official_task_double = double(Fontana::Approval::Task)
        expect(official_task_double).to receive(:manual!)
        expect(step_double).to receive(:official_task).and_return(official_task_double)
        expect(workflow).to receive(:steps).and_return([step_double])
        post :settings, params
        expect(response).to redirect_to(:action => 'settings', :id => params['id'])
      end
    end
  end

end
