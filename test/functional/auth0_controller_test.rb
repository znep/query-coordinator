require 'test_helper'

class Auth0ControllerTest < ActionController::TestCase
  include UserSessionsHelper
  def setup
    init_core_session
    init_current_domain
    OmniAuth.config.test_mode = true
    @request.env['HTTPS'] = 'on'
    @user = login
  end

  def get_mock_token(provider,uid,socrata_user_id)
    token = OmniAuth::AuthHash.new(
    {
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
    }
                           )
    token
  end
  
  test 'a valid uid should create a valid cookie' do
    OmniAuth.config.mock_auth[:auth0] = get_mock_token('auth0','auth0|abcd-efgh','auth0|abcd-edfg|username-password-staging')

    @request.env['omniauth.auth'] = OmniAuth.config.mock_auth[:auth0]
    get :callback, :protocol => 'https'
    assert_redirected_to('/profile')
    assert_not_nil(@response.cookies['_core_session_id'])
    assert(@response.cookies['logged_in'])
  end

  test 'an invalid uid should not create a cookie' do
    OmniAuth.config.mock_auth[:auth0] = get_mock_token('auth0','auth0|thisisgarbage','auth0|thisisgarbage|username-password-staging')

    @request.env['omniauth.auth'] = OmniAuth.config.mock_auth[:auth0]
    get :callback, :protocol => 'https'
    assert_response(:error)
    assert_nil(@response.cookies['_core_session_id'])
    assert_nil(@response.cookies['logged_in'])
  end

  test 'Auth0 username and password token is not valid' do
    OmniAuth.config.mock_auth[:auth0] = get_mock_token('auth0','auth0|thisisgarbage','auth0|thisisgarbage|username-password-staging')

    @request.env['omniauth.auth'] = OmniAuth.config.mock_auth[:auth0]
    get :callback, :protocol => 'https'
    assert_nil(@response.cookies['_core_session_id'])
    assert_nil(@response.cookies['logged_in'])
    assert_response(500)
  end

  test 'Auth0 federated token is not valid' do
    OmniAuth.config.mock_auth[:auth0] = get_mock_token('samlp','samlp|thisisgarbage','samlp|thisisgarbage|')

    @request.env['omniauth.auth'] = OmniAuth.config.mock_auth[:auth0]
    Auth0Controller.any_instance.expects(:valid_token?).returns ( false )
    get :callback, :protocol => 'https'
    assert_nil(@response.cookies['_core_session_id'])
    assert_nil(@response.cookies['logged_in'])
    assert_response(404)
  end

  test 'Federated Auth failure should return 500' do
    OmniAuth.config.mock_auth[:auth0] = get_mock_token('samlp','samlp|someidentifier','samlp|someidentifier|socrata.com')
    @request.env['omniauth.auth'] = OmniAuth.config.mock_auth[:auth0]
    Auth0Controller.any_instance.expects(:authentication_provider_class).returns (NotAuthenticatedStub)
    get :callback, :protocol => 'https'
    assert_nil(@response.cookies['_core_session_id'])
    assert_nil(@response.cookies['logged_in'])
    assert_response(500)
  end

  test 'Auth0 federated token should result in a user_session' do
    OmniAuth.config.mock_auth[:auth0] = get_mock_token('samlp','samlp|someidentifier','samlp|someidentifier|socrata.com')
    @request.env['omniauth.auth'] = OmniAuth.config.mock_auth[:auth0]
    Auth0Controller.any_instance.expects(:authentication_provider_class).returns (AuthenticatedStub)
    get :callback, :protocol => 'https'
    assert_not_nil(@response.cookies['logged_in'])
    assert_redirected_to(login_redirect_url)
  end

  class StubAuth0Authentication < ActionController::TestCase
    def initialize(token)
    end

    def user
      stub(:session_token= => nil,
           :oid => 'abcd-efgh',
           :id => 'abcd-efgh',
           :data => {:id=>'abcd-efgh'},
           :is_owner? => false,
           :is_admin? => false,
           :roleName => 'viewer')
    end

    def authenticated?
      raise "This class should be considered abstract.  Please use the provided concrete instances"
    end
  end

  class NotAuthenticatedStub < StubAuth0Authentication
    def authenticated?
      false
    end
  end

  class AuthenticatedStub < StubAuth0Authentication
    def authenticated?
      true
    end
  end

end
