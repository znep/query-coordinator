require 'rails_helper'

RSpec.describe ApplicationController, :type => :controller do
  controller do
    prepend_before_filter :require_super_admin, only: [:test_super_action]

    def test_action
      render :text => 'content text', :status => 200
    end

    def test_super_action
      render :text => 'content text', :status => 200
    end
  end

  before do
    routes.draw {
      get 'test_action' => 'anonymous#test_action'
      get 'test_super_action' => 'anonymous#test_super_action'
    }
  end

  after do
    Rails.application.reload_routes!
  end

  describe '#current_user' do
    it 'calls authenticate on stored session' do
      mock_session = double()
      expect(controller.env).to receive(:[]).with(SocrataSession::SOCRATA_SESSION_ENV_KEY).and_return(mock_session)
      expect(mock_session).to receive(:authenticate).with(controller.env)

      controller.current_user
    end
  end
end
