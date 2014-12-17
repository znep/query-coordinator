require 'test_helper'

class Auth0ControllerTest < ActionController::TestCase

  def setup
    init_core_session
    init_current_domain
    OmniAuth.config.test_mode = true
  end

  test 'a valid uid should create a valid cookie' do
    OmniAuth.config.mock_auth[:auth0] = OmniAuth::AuthHash.new({
      'provider' => 'auth0',
      'uid' => 'auth0|abcd-efgh'
    })
    @request.env['omniauth.auth'] = OmniAuth.config.mock_auth[:auth0]
    get :callback, :protocol => 'https'
    assert_redirected_to('/profile')
    assert_not_nil(@response.cookies['_core_session_id'])
    assert(@response.cookies['logged_in'])
  end

  test 'an invalid uid should not create a cookie' do
    OmniAuth.config.mock_auth[:auth0] = OmniAuth::AuthHash.new({
      :provider => 'auth0',
      :uid => 'auth0|thisisgarbage'
    })
    @request.env['omniauth.auth'] = OmniAuth.config.mock_auth[:auth0]
    get :callback, :protocol => 'https'
    assert_redirected_to('/500')
    assert_nil(@response.cookies['_core_session_id'])
    assert_nil(@response.cookies['logged_in'])
  end

  test 'a uid not prefixed with "auth0|" should be rejected' do
    OmniAuth.config.mock_auth[:auth0] = OmniAuth::AuthHash.new({
      :provider => 'auth0',
      :uid => 'anotherprovider|abcd-efgh'
    })
    @request.env['omniauth.auth'] = OmniAuth.config.mock_auth[:auth0]
    get :callback, :protocol => 'https'
    assert_redirected_to('/500')
    assert_nil(@response.cookies['_core_session_id'])
    assert_nil(@response.cookies['logged_in'])
  end
end
