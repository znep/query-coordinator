require 'test_helper'
require 'base64'

class Auth0HelperTest < ActionView::TestCase
  # Core produces a base64 encoded cookie of the form "uid expiration salt signature"
  test 'legacy cookies can be generated by the frontend' do
    cookie_parts = Base64.strict_decode64(gen_cookie('abcd-efgh')).split(' ')
    assert(cookie_parts.length == 4)
    assert(cookie_parts[0] == 'abcd-efgh')
    expiration = cookie_parts[1].to_i
    # Expiration is within 30 minutes from now
    assert(Time.now.to_i < expiration && expiration < Time.now.to_i + 60 * 30)
  end

  def getMockFederatedUserToken
    authHash = OmniAuth::AuthHash.new({
                                        'provider' => 'samlp',
                                        'uid' => 'samlp|_c3ac275de528ddea41f237a4142a5704',
                                        'socrata_user_id' => 'samlp|_c3ac275de528ddea41f237a4142a5704|contoso.com',
                                        'socrata_role' => 'viewer',
                                        'name' => 'alterego',
                                        'email' => 'alterego@testshib.org',
                                      })
    return authHash
  end

  test 'Token is valid' do 
    authHash = getMockFederatedUserToken()
    assert (isValidToken(authHash))
  end

  test 'Token is rejected when missing a required field' do
    authHash = getMockFederatedUserToken()
    #Remove the required fields
    requiredFields = ['email','name','socrata_user_id']
    for requiredField in requiredFields
      removedValue = authHash.delete(requiredField)
      #A required field is missing this should always be false
      refute (isValidToken(authHash))
      #Put the value back as we continue the iteration
      authHash[requiredField] = removedValue                 
    end
  end

  test 'Token is rejected when the socrata_user_id is a bad format' do
    authHash = getMockFederatedUserToken()
    authHash['socrata_user_id'] = 'samlp|_somestuff|'
    refute(isValidToken(authHash))
  end

end
