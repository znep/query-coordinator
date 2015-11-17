require 'rails_helper'

RSpec.describe ApplicationController, :type => :controller do
  controller do
    def test_action
      render :text => 'content text', :status => 200
    end
  end

  before do
    routes.draw { get 'test_action' => 'anonymous#test_action' }
  end

  describe '#current_user' do
    it 'calls authenticate on stored session' do
      mock_session = double()
      expect(controller.env).to receive(:[]).with(SocrataSession::SOCRATA_SESSION_ENV_KEY).and_return(mock_session)
      expect(mock_session).to receive(:authenticate).with(controller.env)

      controller.current_user
    end

    it 'is memoized' do
      expect(controller.env).to receive(:[]).with(SocrataSession::SOCRATA_SESSION_ENV_KEY).once.and_return(double.as_null_object)

      controller.current_user
      controller.current_user
    end
  end

  describe 'require_logged_in_user' do
    context 'with a logged in user' do
      it 'should render the page' do
        stub_valid_session
        get :test_action
        expect(response).to have_http_status(200)
      end
    end

    context 'with no logged in user' do
      it 'should redirect to a login page with the correct return_to query param' do
        stub_invalid_session
        get :test_action
        expect(response).to redirect_to('/login?return_to=/test_action')
      end
    end

  end

end
