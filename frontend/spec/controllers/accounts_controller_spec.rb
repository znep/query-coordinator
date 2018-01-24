require 'rails_helper'

describe AccountsController do
  include TestHelperMethods

  let(:user_data) do
    {
      email: 'user@example.com',
      password: 'password',
      passwordConfirm: 'password',
      accept_terms: true
    }
  end
  let(:user) { User.new(user_data) }

  before do
    init_environment
    stub_authenticate_success
    stub_logout

    allow(subject).to receive(:enable_site_chrome?).and_return(false)
  end

  describe 'POST /signup' do
    before do
      allow(SocrataRecaptcha).to receive(:valid).and_return(true)
      allow(User).to receive(:create).and_return(user)
    end

    describe 'with email verifications' do
      before do
        stub_feature_flags_with(:enable_new_account_verification_email => true)
      end

      # TODO: For JSON/data, the confirmation prompt displays in the output.
      it 'redirects to the login page with a flash' do
        post(:create, signup: user_data)

        expect(response.redirect_url).to include(login_path)
        expect(subject.flash[:notice]).to eq(I18n.t('screens.sign_up.email_verification.sent', email: 'user@example.com' ))
      end
    end

    describe 'without email verifications' do
      it 'redirects to the profile page normally' do
        post(:create, signup: user_data)

        expect(response.redirect_url).to include(profile_index_path)
      end

      it 'redirects elsewhere if on_login_path_override is set' do
        allow(CurrentDomain).to receive(:properties).and_return(Hashie::Mash.new(on_login_path_override: '/welcome'))

        post(:create, signup: user_data)

        expect(response.redirect_url).to include('/welcome')
      end

      # From old Minitest cases:
      #
      # Leaving CSRF token validation disabled for signups is not a viable long-term solution. Although
      # the scope of this exposure is limited somewhat by the fact that we special-case only the JSON
      # signup route and there is a captcha involved.
      describe 'without CSRF token' do
        let(:user_with_id) { User.new({ id: 1 }) }

        before do
          allow(subject).to receive(:protect_against_forgery?).and_return(true)
        end

        it 'succeeds when JSON' do
          allow(subject).to receive(:current_user).and_return(user_with_id)

          post(:create, signup: user_data, format: :json)

          expect(response.code.to_i).to eq(200)
        end

        it 'succeeds when data' do
          allow(subject).to receive(:current_user).and_return(user_with_id)

          post(:create, signup: user_data, format: :data)

          expect(response.code.to_i).to eq(200)
        end

        it 'does not succeed when HTML' do
          allow(subject).to receive(:current_user).and_return(user_with_id)

          post(:create, signup: user_data, format: :html)

          expect(response.code.to_i).to eq(401)
        end
      end

      describe 'on a GovStat site' do
        before do
          allow(CurrentDomain).to receive(:module_enabled?).with(:govStat).and_return(true)
        end

        it 'redirects elsewhere if the user session has a redirect' do
          allow(CurrentDomain).to receive(:member?).and_return(false)

          post(:create, { signup: user_data }, { return_to: '/welcome' })

          expect(response.redirect_url).to include('/welcome')
        end
      end
    end
  end
end
