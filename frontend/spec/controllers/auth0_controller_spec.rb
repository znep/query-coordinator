require 'rails_helper'

describe Auth0Controller do
  include TestHelperMethods

  before do
    init_environment

    allow(Frontend).to receive(:auth0_configured?).and_return(true)

    OmniAuth.config.test_mode = true
  end

  after do
    OmniAuth.config.test_mode = false
  end

  def get_mock_token(provider, uid, socrata_user_id)
    OmniAuth::AuthHash.new({
      :provider => provider,
      :uid => uid,
      :info => {
        :name => 'John Foo',
        :email => 'johnfoo@example.org',
        :nickname => 'john',
        :first_name => 'John',
        :last_name => 'Foo',
        :location => 'en',
        :image => 'https://example.org/john.jpg'
      },
      :credentials => {
        :token => 'XdDadllcas2134rdfdsI',
        :expires => 'false',
        :id_token => 'eyJhbGciOiJIUzI1NiIsImN0eSI6IkpXVCJ9.eyJuYW1lIjoiSm9obiBGb28ifQ.lxAiy1rqve8ZHQEQVehUlP1sommPHVJDhgPgFPnDosg',
        :token_type => 'bearer',
      },
      :extra => {
        :raw_info => {
          :email => 'johnfoo@example.org',
          :email_verified => 'true',
          :name => 'John Foo',
          :given_name => 'John',
          :family_name => 'Foo',
          :picture => 'https://example.org/john.jpg',
          :gender => 'male',
          :locale => 'en',
          :clientID => 'nUBkskdaYdsaxK2n9',
          :user_id => uid,
          :nickname => 'john',
          :socrata_user_id => socrata_user_id,
          :identities => [{
            :access_token => 'this-is-the-mock-access-token',
            :provider => provider,
            :expires_in => '3599',
            :user_id => uid,
            :connection => 'username-password-staging',
            :isSocial => 'true',
          }],
          :created_at => '2014-07-15T17:19:50.387Z'
        }
      }
    })
  end

  describe 'authentication successful' do
    before do
      stub_authenticate_federated_success
    end

    it 'a valid uid should create a valid cookie' do
      request.env['omniauth.auth'] = get_mock_token('auth0', 'auth0|abcd-efgh', 'auth0|abcd-edfg|username-password-staging')

      get :callback, :protocol => 'https'

      expect(response).to redirect_to('/profile')
      expect(response.cookies).to include({ 'logged_in' => 'true' })
      expect(response.cookies).not_to include('_core_session_id')
    end

    it 'an invalid uid should not create a cookie' do
      request.env['omniauth.auth'] = get_mock_token('auth0', 'auth0|thisisgarbage', 'auth0|thisisgarbage|username-password-staging')

      get :callback, :protocol => 'https'

      expect(response).to have_http_status(500)
      expect(response.cookies).not_to include('_core_session_id', 'logged_in')
    end

    it 'Auth0 federated token is not valid' do
      request.env['omniauth.auth'] = get_mock_token('samlp', 'samlp|thisisgarbage', 'samlp|thisisgarbage|')

      expect(controller).to receive(:valid_token?).and_return(false)

      get :callback, :protocol => 'https'

      expect(response).to have_http_status(404)
      expect(response.cookies).not_to include('_core_session_id', 'logged_in')
    end

    it 'Social Auth not-found should redirect to linking page' do
      request.env['omniauth.auth'] = get_mock_token('samlp', 'samlp|someidentifier', 'samlp|someidentifier|socrata.com')

      allow(controller).to receive(:authentication_provider_class).and_return(NotAuthenticatedStub)

      get :callback, :protocol => 'https'

      expect(response).to have_http_status(302)
      expect(response.cookies).not_to include('_core_session_id', 'logged_in')
    end

    it 'Auth0 federated token should result in a user_session' do
      request.env['omniauth.auth'] = get_mock_token('samlp', 'samlp|someidentifier', 'samlp|someidentifier|socrata.com')

      allow(controller).to receive(:authentication_provider_class).and_return(AuthenticatedStub)
      allow(controller).to receive(:login_redirect_url).and_return('the_redirect_url')

      get :callback, :protocol => 'https'

      expect(response).to redirect_to('the_redirect_url')
      expect(response.cookies).to include({ 'logged_in' => 'true' })
      expect(response.cookies).not_to include('_core_session_id')
    end
  end

  describe 'authentication failed' do
    before do
      stub_authenticate_federated_failure
    end

    it 'Auth0 username and password token is not valid' do
      @request.env['omniauth.auth'] = get_mock_token('auth0', 'auth0|thisisgarbage', 'auth0|thisisgarbage|username-password-staging')

      get :callback, :protocol => 'https'

      expect(response).to have_http_status(500)
      expect(response.cookies).not_to include('_core_session_id', 'logged_in')
    end
  end

  describe 'link' do
    before do
      stub_auth0_identifiers
      stub_recaptcha_valid_success
    end

    it 'get without arguments fails' do
      expect { get :link, :protocol => 'https' }.to raise_error(NoMethodError)
    end

    it 'get successful' do
      auth0_link_token = { :socrata_user_id => 1 }
      auth0_link_token.extend(StubAuthLinkToken)

      request.session[:auth0_link_token] = auth0_link_token

      get :link, :protocol => 'https'

      expect(response).to have_http_status(:ok)
    end

    it 'post sign in successful' do
      auth0_link_token = { :socrata_user_id => 1 }
      auth0_link_token.extend(StubAuthLinkToken)

      request.session[:auth0_link_token] = auth0_link_token

      post :link, :protocol => 'https', :user_session => {}

      expect(response).to have_http_status(302)
    end

    it 'post sign up fail recaptcha' do
      auth0_link_token = { :socrata_user_id => 1 }
      auth0_link_token.extend(StubAuthLinkToken)

      request.session[:auth0_link_token] = auth0_link_token

      post :link, :protocol => 'https'

      expect(response).to redirect_to('/auth/auth0/link')
      expect(response).to have_http_status(302)
      expect(controller.flash[:error]).to eq('We were unable to confirm your response, please try again.')
    end
  end

  # Helpers

  class StubAuth0Authentication
    def initialize(token) ; end
    def error ; false ; end

    def user
      User.new({
        :session_token => nil,
        :oid => 'abcd-efgh',
        :id => 'abcd-efgh',
        :data => { :id => 'abcd-efgh' },
        :roleName => 'viewer'
      })
    end

    def authenticated?
      raise 'This class should be considered abstract. Please use the provided concrete instances'
    end
  end

  class NotAuthenticatedStub < StubAuth0Authentication
    def authenticated? ; false ; end
    def user ; nil ; end
  end

  class AuthenticatedStub < StubAuth0Authentication
    include TestHelperMethods
    def authenticated? ; true ; end
    def response ; { 'Set-Cookie' => cookie_string } ; end
  end

  module StubAuthLinkToken
    def name ; "John Foo" ; end
    def email ; "johnfoo@example.org" ; end
  end

end
