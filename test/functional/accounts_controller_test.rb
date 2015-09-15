require 'test_helper'

class AccountsControllerTest < ActionController::TestCase

  def setup
    init_core_session
    User.stubs(create: User.new(some_user))
    init_current_domain
  end

  def test_create_with_no_special_things
    post(:create, signup: some_user)
    assert(@response.redirect_url.include?(profile_index_path), 'should redirect to profile')
  end

  def test_create_with_login_path_override
    CurrentDomain.properties.stubs(on_login_path_override: '/goats-are-sexy')
    post(:create, signup: some_user)
    assert(@response.redirect_url.include?('/goats-are-sexy'), 'should redirect to arbitrary path')
  end

  def test_create_on_govstat_site
    stub_module_enabled_on_current_domain(:govStat)
    post(:create, signup: some_user)
    assert(@response.redirect_url.include?(profile_index_path), 'should redirect to profile if no session')
  end

  def test_create_on_govstat_site_after_nav_from
    stub_module_enabled_on_current_domain(:govStat)
    @controller.session[:return_to] = '/some-other-page'
    post(:create, signup: some_user)
    assert(@response.redirect_url.include?('/some-other-page'), 'should redirect to stored location')
  end

  # Leaving CSRF token validation disabled for signups is not a viable long-term solution. Although
  # the scope of this exposure is limited somewhat by the fact that we special-case only the JSON
  # signup route and there is a captcha involved.
  def test_create_signup_with_no_csrf_token_succeeds_as_json
    UserSession.controller = @controller
    @controller.stubs(
      :protect_against_forgery? => true,
      :verify_recaptcha => true,
      :current_user => OpenStruct.new(:id => 1)
    )
    @controller.expects(:handle_unverified_request).never
    post(:create, :signup => some_user, :format => :json)
    assert_equal('200', @response.code, 'should be a success response')
    assert_equal({:user_id => 1}.to_json, @response.body, 'should include a mock user in the JSON response')
  end

  def test_create_signup_with_no_csrf_token_succeeds_as_data
    UserSession.controller = @controller
    @controller.stubs(
      :protect_against_forgery? => true,
      :verify_recaptcha => true,
      :current_user => OpenStruct.new(:id => 1)
    )
    @controller.expects(:handle_unverified_request).never
    post(:create, :signup => some_user, :format => :data)
    assert_equal('200', @response.code, 'should be a success response')
    assert_equal({:user_id => 1}.to_json, @response.body, 'should include a mock user in the JSON response')
  end

  private

  def some_user
    { email: 'foo@bar.com',
      password: 'asdf',
      passwordConfirm: 'asdf',
      accept_terms: true
    }
  end

end
