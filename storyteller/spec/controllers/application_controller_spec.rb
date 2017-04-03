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
    let(:mock_session) { double('session').as_null_object }
    let(:mock_user) { double('current_user') }

    before do
      allow(controller.env).to receive(:[]).with(SocrataSession::SOCRATA_SESSION_ENV_KEY).and_return(mock_session)
      allow(mock_session).to receive(:authenticate).with(controller.env).and_return(mock_user)
    end

    it 'returns current_user' do
      expect(controller.current_user).to eq(mock_user)
    end

    it 'memoizes result' do
      expect(mock_session).to receive(:authenticate).once.and_return(mock_user)
      controller.current_user
      controller.current_user
    end
  end

  describe '#current_domain' do
    let(:mock_domain) { double('current_domain') }

    before do
      allow(CoreServer).to receive(:current_domain).and_return(mock_domain)
    end

    it 'returns current_domain from core' do
      expect(controller.current_domain).to eq(mock_domain)
    end

    it 'memoizes result' do
      expect(CoreServer).to receive(:current_domain).once.and_return(mock_domain)
      controller.current_domain
      controller.current_domain
    end
  end
end
