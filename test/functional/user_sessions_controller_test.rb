require 'test_helper'

class UserSessionsControllerTest < ActionController::TestCase

  def setup
    init_core_session
    init_current_domain
    UserSession.any_instance.stubs(save: Net::HTTPSuccess.new(1.1, 200, 'Success'),
                                   find_token: true)
    User.stubs(current_user: User.new(some_user))
    stub_request(:get, "http://localhost:8080/configurations.json?defaultOnly=true&merge=true&type=auth0").
      with(:headers => {'Accept'=>'*/*', 'User-Agent'=>'Ruby', 'X-Socrata-Host'=>'localhost'}).
      to_return(:status => 200, :body => "[]", :headers => {})
  end

  def test_login
    post(:create)
    assert(@response.redirect_url.include?(profile_index_path), 'should redirect to profile')
  end

  def test_set_return_to_with_return_to_param
    # No user session, so we land on the /login page successfully
    @controller.stubs(:current_user_session).returns(nil)
    expected_return_to = 'testpath/page2'
    get :new, {'return_to' => expected_return_to}
    actual_return_to = @controller.session[:return_to]
    assert_equal(expected_return_to, actual_return_to)
  end

  def test_return_to_param_overrides_request_referrer
    # No user session, so we land on the /login page successfully
    @controller.stubs(:current_user_session).returns(nil)
    expected_return_to = 'testpath/page2'
    # Set HTTP_REFERER, to confirm that return_to overrides it
    @request.env['HTTP_REFERER'] = 'http://test.com/steps/1'
    get :new, {'referer_redirect' => 1, 'return_to' => expected_return_to}
    actual_return_to = @controller.session[:return_to]
    assert_equal(expected_return_to, actual_return_to)
  end

  def test_login_with_login_path_override
    CurrentDomain.properties.stubs(on_login_path_override: '/goats-are-sexy')
    post(:create)
    assert(@response.redirect_url.include?('/goats-are-sexy'), 'should redirect to arbitrary path')
  end

  def test_login_on_govstat_site
    stub_module_enabled_on_current_domain(:govStat)
    post(:create)
    assert(@response.redirect_url.include?(profile_index_path), 'should redirect to profile if no session')
  end

  def test_login_on_govstat_site_after_nav_from
    stub_module_enabled_on_current_domain(:govStat)
    @controller.session[:return_to] = '/some-other-page'
    post(:create)
    assert(@response.redirect_url.include?('/some-other-page'), 'should redirect to stored location')
  end

  def test_login_on_govstat_site_with_user_role
    stub_module_enabled_on_current_domain(:govStat)
    User.stubs(current_user: User.new(some_user).tap {|usr| usr.stubs(rights: [ 'someRight' ]) })
    post(:create)
    assert(@response.redirect_url.include?(govstat_root_path), 'should redirect to govstat root')
  end

  context 'auth0 workflow' do
    setup do
      UserSessionsController.any_instance.stubs(:use_auth0? => true, :should_auth0_redirect? => false)
    end

    should 'initialize auth0_connections to an array.' do
      mock_properties = OpenStruct.new(:auth0_connections => [{:connection => 'test-connection', :name => 'Test Connection'}])
      mock_configuration = OpenStruct.new(:properties => mock_properties)
      CurrentDomain.stubs(:configuration => mock_configuration)

      @controller.send(:auth0)
      assert(@controller.instance_variable_get(:@auth0_connections).present?)
    end

    should 'not initialize auth0_connections when encountering strings.' do
      mock_properties = OpenStruct.new(:auth0_connections => 'bad')
      mock_configuration = OpenStruct.new(:properties => mock_properties)
      CurrentDomain.stubs(:configuration => mock_configuration)

      @controller.send(:auth0)
      assert_nil(@controller.instance_variable_get(:@auth0_connections))
    end

    should 'not initialize auth0_connections when encountering malformed hashes.' do
      mock_properties = OpenStruct.new(:auth0_connections => [{}])
      mock_configuration = OpenStruct.new(:properties => mock_properties)
      CurrentDomain.stubs(:configuration => mock_configuration)

      @controller.send(:auth0)
      assert_nil(@controller.instance_variable_get(:@auth0_connections))
    end

    should 'not initialize auth0_connections when encountering an empty array.' do
      mock_properties = OpenStruct.new(:auth0_connections => [])
      mock_configuration = OpenStruct.new(:properties => mock_properties)
      CurrentDomain.stubs(:configuration => mock_configuration)

      @controller.send(:auth0)
      assert_nil(@controller.instance_variable_get(:@auth0_connections))
    end
  end

  private
  def some_user
    { login: 'foo@bar.com',
      password: 'asdf'
    }
  end

end
