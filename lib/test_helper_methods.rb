# Add more helper methods to be used by all tests here...
module TestHelperMethods

  def init_current_domain
    @domain = YAML::load(File.open("test/fixtures/domain.yml"))
    CurrentDomain.set_domain(@domain)
  end

  def init_current_user(controller, name = "test-test", session_token = "123456")
    user = User.new({'id' => name})
    UserSession.controller=controller
    UserSession.update_current_user(user, session_token)
    user_session = UserSession.new
    controller.current_user_session = user_session
    # Remove filters that wreck havoc with custom users
    remove_filters(controller, ['hook_auth_controller',  'sync_logged_in_cookie', 'require_user'])
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

  def remove_filters(controller, filters)
    @deleted_filters ||= []
    regex = Regexp.new(filters.join("|"))
    controller.class._process_action_callbacks.each do |f|
      if f.raw_filter.to_s.match(regex)
        @deleted_filters << f
        controller.class._process_action_callbacks.delete(f)
      end
    end
  end

  def return_filters(controller)
    return if @deleted_filters.nil?
    @deleted_filters.each do |f|
      controller.class._process_action_callbacks << f
    end
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
    @application_helper ||= begin
      klass = ActionView::Base
      Dir.foreach("#{Rails.root}/app/helpers").each do |file|
        next if file =~ /^\./

        klass.send(:include, File.basename(file, '.rb').classify.constantize)
      end
      klass.new
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

end
