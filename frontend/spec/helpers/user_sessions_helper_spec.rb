require 'rails_helper'

describe UserSessionsHelper, :type => :helper do

  describe '#login_redirect_url' do
    let(:properties_mock) { double }
    let(:on_login_path_override) { nil }
    let(:govstat_enabled) { false }
    let(:current_user_is_member) { false }

    before(:each) do
      allow(CurrentDomain).to receive(:properties).and_return(properties_mock)
      allow(properties_mock).to receive(:on_login_path_override).and_return(on_login_path_override)
      allow(CurrentDomain).to receive(:module_enabled?).with(:govStat).and_return(govstat_enabled)
      allow(CurrentDomain).to receive(:member?).and_return(current_user_is_member)
      allow(helper).to receive(:current_user).and_return(double('current_user'))
    end

    it 'returns profile path by default' do
      expect(helper.login_redirect_url).to eq(profile_index_path)
    end

    context 'when on_login_path_override is set' do
      let(:on_login_path_override) { :login_path_override_path }

      it 'returns on_login_path_override value' do
        expect(helper.login_redirect_url).to eq(:login_path_override_path)
      end
    end

    context 'when session[:return_to] is set' do
      before(:each) do
        @request.session[:return_to] = 'return_to_path'
      end

      it 'returns return_to path' do
        expect(helper.login_redirect_url).to eq('return_to_path')
      end
    end

    context 'when govStat enabled' do
      let(:govstat_enabled) { true }

      it 'returns profile path' do
        expect(helper.login_redirect_url).to eq(profile_index_path)
      end

      context 'when user is member of domain' do
        let(:current_user_is_member) { true }

        context 'when session[:return_to] is set' do
          before(:each) do
            @request.session[:return_to] = 'return_to_path'
          end

          it 'returns return_to path' do
            expect(helper.login_redirect_url).to eq('return_to_path')
          end
        end
      end
    end
  end

  describe '#password_validation_error' do
    it 'matches "Your password must satisfy three of the following four criteria"' do
      expect(helper.password_validation_error?('Your password must satisfy three of the following four criteria')).to eq(true)
    end

    it 'does not match random error message' do
      expect(helper.password_validation_error?('things')).to eq(false)
    end
  end
end
