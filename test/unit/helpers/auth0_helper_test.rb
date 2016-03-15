require 'test_helper'
require 'base64'

class Auth0HelperTest < ActionView::TestCase

  def setup
    stub_request(:get, 'https://exists/api/v2/connections?fields=name')
      .to_return(:status => 200, :body => '[{"name": "test"}]', :headers => {'Content-Type' => 'application/json'})
  end

  # Core produces a base64 encoded cookie of the form "uid expiration salt signature"
  test 'legacy cookies can be generated by the frontend' do
    cookie_parts = Base64.strict_decode64(gen_cookie('abcd-efgh')).split(' ')
    assert(cookie_parts.length == 4)
    assert(cookie_parts[0] == 'abcd-efgh')
    expiration = cookie_parts[1].to_i
    # Expiration is within 30 minutes from now
    assert(Time.now.to_i < expiration && expiration < Time.now.to_i + 60 * 30)
  end

  def get_mock_federated_user_token
    OmniAuth::AuthHash.new(
                           'provider' => 'samlp',
                           'uid' => 'samlp|_c3ac275de528ddea41f237a4142a5704',
                           'socrata_user_id' => 'samlp|_c3ac275de528ddea41f237a4142a5704|contoso.com',
                           'socrata_role' => 'viewer',
                           'name' => 'alterego',
                           'email' => 'alterego@testshib.org',
                           )
  end

  test 'Token is valid' do
    authHash = get_mock_federated_user_token
    assert(valid_token?(authHash))
  end

  test 'Token is rejected when missing a required field' do
    #Remove the required fields
    requiredFields = ['email','name','socrata_user_id']
    for requiredField in requiredFields
      authHash = get_mock_federated_user_token
      #  Delete a required field
      authHash.delete(requiredField)
      refute(valid_token?(authHash))
    end
  end

  test 'UID correctly extracted' do 
    uid = 'abcd-efgh'
    socrata_user_id = 'auth0|abcd-efgh|socrata.com'
    extracted_uid = extract_uid(socrata_user_id).to_s
    assert_equal(uid,extracted_uid)
  end

  test 'Username and password connection' do
    username_password_id = 'auth0|abcd-efgh|socrata.com'
    saml_id = 'samlp|_c3ac275de528ddea41f237a4142a5704'
    assert(username_password_connection?(username_password_id))
    refute(username_password_connection?(saml_id))
  end

  test 'Token is rejected when the socrata_user_id is a bad format' do
    authHash = get_mock_federated_user_token
    authHash['socrata_user_id'] = 'samlp|_somestuff|'
    refute(valid_token?(authHash))
  end

  test 'Checks to see if a connection exists with a valid response' do
    assert(connection_exists('test'))
    refute(connection_exists('notthere'))
  end

  test 'Generate authorization URI' do
    assert_match(
      'https://exists/authorize?scope=openid%20profile&response_type=code&connection=test&callbackURL=/test/callback&sso=true&client_id=exists&redirect_uri=/test/callback',
      generate_authorize_uri('test', '/test/callback')
    )
  end
end
