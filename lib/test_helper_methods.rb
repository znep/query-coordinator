# Add more helper methods to be used by all tests here...
module TestHelperMethods

  def init_current_domain
    # For some reason, Domain and Configuration aren't autoloaded at this point,
    # so force them to load before we read test/fixtures/domain.yml
    Domain && Configuration
    @domain = YAML::load(File.open('test/fixtures/domain.yml'))
    CurrentDomain.set_domain(@domain)
  end

  def init_current_user(controller, name = 'test-test', session_token = '123456')
    user = User.new('id' => name)
    UserSession.controller=controller
    UserSession.update_current_user(user, session_token)
    user_session = UserSession.new
    controller.current_user_session = user_session
    user
  end

  def login(user = nil)
    unless user
      user = User.new(
        'login' => 'user',
        'email' => 'user@socrata.com',
        'first_name' => 'first',
        'last_name' => 'last',
        'password' => 'password',
        'uid' => 'four-four',
        'screen_name' => 'first-last',
        'id' => '123'
      )
    end
    UserSession.controller = @controller
    @controller.current_user_session = UserSession.new(
      :login => user.login, :password => user.password
    )
    user
  end

  def logout
    @controller.current_user_session = nil
  end

  def init_core_session
    fake_core_session = CoreSession.new(self, @env)
    fake_core_session.pretend_loaded
    @controller.request.core_session = fake_core_session
  end

  def load_sample_data(file)
    sample_data = JSON::parse(File.open(file).read)
    sample_data.each do |k, v|
      CoreServer::Connection.any_instance.stubs(k).returns(v.to_json)
    end
  end

  def application_helper
    @application_helper ||= Object.new.tap do |object|
      object.extend(ApplicationHelper)
      object.extend(ActionView::Helpers::JavaScriptHelper)
      object.extend(ActionView::Helpers::TagHelper)
      object.extend(Jammit::Helper)
      object.stubs(:request => stub(:query_parameters => {}))
    end
  end

  def stub_module_enabled_on_current_domain(module_name)
    CurrentDomain.stubs(module_names: [ module_name.to_s ])
    CurrentDomain.domain.stubs(features: Hashie::Mash.new.tap { |h| h.send(:"#{module_name}=", true) })
  end

  def stub_feature_flags_with(key, value)
    stub_multiple_feature_flags_with(key => value)
  end

  def stub_multiple_feature_flags_with(options)
    if @feature_flags != CurrentDomain.feature_flags
      @feature_flags = Hashie::Mash.new
      CurrentDomain.stubs(feature_flags: @feature_flags)
    end
    options.each do |key, value|
      @feature_flags[key] = value
    end
  end

  def request_headers
    {
      'Accept' => '*/*',
      'Accept-Encoding' => 'gzip;q=1.0,deflate;q=0.6,identity;q=0.3',
      'User-Agent' => 'Ruby',
      'X-Socrata-Host' => 'localhost'
    }
  end

  def cetera_request_headers
    {
      'Content-Type'=>'application/json',
      'X-Socrata-Host' => 'localhost',
      'X-Socrata-Requestid'=>'Unavailable'
    }
  end

end
