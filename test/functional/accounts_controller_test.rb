require 'test_helper'

class AccountsControllerTest < ActionController::TestCase

  def setup
    init_core_session
    User.stubs(create: User.new(some_user))
    init_current_domain
    init_signaller
    stub_feature_flags_with(:enable_new_account_verification_email => true)
    stub_site_chrome
  end

  def teardown
    @controller.request.core_session = nil
    User.unstub(:create)
  end

  def test_create_with_no_special_things
    post(:create, signup: some_user)
    assert(@response.redirect_url.include?(login_path), 'should redirect to login page')
    assert_equal(@controller.flash[:notice], t('screens.sign_up.email_verification.sent',
      :email =>'foo@bar.com' ))
  end

  def test_create_with_login_path_override
    CurrentDomain.properties.stubs(on_login_path_override: '/goats-are-sexy')
    post(:create, signup: some_user)
    assert(@response.redirect_url.include?(login_path), 'should redirect to login page')
  end

  def test_create_on_govstat_site
    stub_module_enabled_on_current_domain(:govStat)
    post(:create, signup: some_user)
    assert(@response.redirect_url.include?(login_path), 'should redirect to login page')
  end

  def test_create_on_govstat_site_after_nav_from
    stub_module_enabled_on_current_domain(:govStat)
    @controller.session[:return_to] = '/some-other-page'
    post(:create, signup: some_user)
    assert(@response.redirect_url.include?(login_path), 'should redirect to login page')
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
    assert_equal({
      :notice => 'We sent a verification email to foo@bar.com, please follow the instructions in the email to complete the registration process.',
      :promptLogin => false
    }.to_json, @response.body, 'should notify of email verification in the JSON response')
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
    assert_equal({
      :notice => 'We sent a verification email to foo@bar.com, please follow the instructions in the email to complete the registration process.',
      :promptLogin => false
    }.to_json, @response.body, 'should notify of email verification in the JSON response')
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
