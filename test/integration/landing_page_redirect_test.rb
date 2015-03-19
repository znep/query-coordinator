# This is how we WOULD write an integration test if it were necessary



# require 'test_helper'

# class LandingPageRedirectTest < ActionDispatch::IntegrationTest

#   def setup
#     init_current_domain
#     https!
#     host! CurrentDomain.cname
#   end

#   test 'should redirect landing page to bootstrapped data lens page' do
#     get '/ux/dataset/abcd-efgh'
#     assert_redirected_to('/view/bootstrap/abcd-efgh')
#   end
# end
