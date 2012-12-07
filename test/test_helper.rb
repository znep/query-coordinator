ENV["RAILS_ENV"] = "test"
require File.expand_path('../../config/environment', __FILE__)
require 'rails/test_help'

class Test::Unit::TestCase
  # Add more helper methods to be used by all tests here...
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
    @deleted_filters.each {|f|
      controller.class._process_action_callbacks << f
    }
  end

  def init_core_session()
    fake_core_session = CoreSession.new(self, @env)
    fake_core_session.pretend_loaded
    @controller.request.core_session = fake_core_session
  end

end
