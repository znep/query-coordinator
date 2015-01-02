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
end
