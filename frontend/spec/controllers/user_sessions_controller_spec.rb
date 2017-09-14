require 'rails_helper'

describe UserSessionsController do
  include TestHelperMethods

  let(:redirect_path) { '/welcome' }

  let(:user_data) do
    {
      login: 'user@example.com',
      password: 'password'
    }
  end
  let(:user) { User.new(user_data) }

  before do
    init_environment

    allow_any_instance_of(UserSession).to receive(:save).with(true).and_return(Net::HTTPSuccess.new(1.1, 200, 'Success'))
    allow_any_instance_of(UserSession).to receive(:find_token).and_return(true)
  end

  describe 'POST /login' do
    before do
      allow(subject).to receive(:current_user_session).and_return(nil)
      allow(CurrentDomain).to receive(:configuration).with('auth0').and_return(nil)
      allow(CurrentDomain).to receive(:default_locale).and_return('en')
    end

    it 'redirects to profile normally' do
      post(:create)

      expect(response.redirect_url).to include(profile_index_path)
    end

    it 'redirects elsewhere if on_login_path_override is set' do
      allow(CurrentDomain).to receive(:properties).and_return(Hashie::Mash.new(on_login_path_override: redirect_path))

      post(:create)

      expect(response.redirect_url).to include(redirect_path)
    end

    it 'redirects elsewhere if the user session has a redirect' do
      post(:create, nil, { return_to: redirect_path })

      expect(response.redirect_url).to include(redirect_path)
    end

    describe 'on a GovStat site' do
      before do
        allow(CurrentDomain).to receive(:module_enabled?).with(:govStat).and_return(true)
      end

      it 'redirects to the GovStat index page for roled users' do
        allow(CurrentDomain).to receive(:member?).and_return(true)

        post(:create)

        expect(response.redirect_url).to include(govstat_root_path)
      end

      it 'redirects elsewhere if the user session has a redirect' do
        allow(CurrentDomain).to receive(:member?).and_return(false)

        post(:create, nil, { return_to: '/welcome' })

        expect(response.redirect_url).to include('/welcome')
      end
    end

    describe 'with Auth0' do
      it 'disallows Socrata users if fedramp is enabled' do
        allow(subject).to receive(:should_auth0_redirect?).and_return(false)
        allow(CurrentDomain).to receive(:feature?).with('fedramp').and_return(true)
        allow(CurrentDomain).to receive(:feature?).with('username_password_login').and_return(true)
        allow_any_instance_of(UserSession).to receive(:user).and_return(user)
        allow(user).to receive(:is_superadmin?).and_return(true)

        post(:create, { user_session: { login: 'test@socrata.com' } })

        expect(response.redirect_url).to include('/login')
      end
    end
  end

  describe 'GET /login' do
    describe 'with referer' do
      before do
        allow(subject).to receive(:current_user_session).and_return(nil)
        allow(CurrentDomain).to receive(:configuration).with('auth0').and_return(nil)
        allow(CurrentDomain).to receive(:default_locale).and_return('en')
      end

      it 'redirects to follow referer' do
        request.env['HTTP_REFERER'] = redirect_path
        get(:new, { referer_redirect: 1 })
        expect(session[:return_to]).to include(redirect_path)
      end

      it 'does not redirect to follow referer if overridden' do
        request.env['HTTP_REFERER'] = '/unused'
        get(:new, { referer_redirect: 1, return_to: redirect_path })
        expect(session[:return_to]).to include(redirect_path)
      end
    end
  end
end
