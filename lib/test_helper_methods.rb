require 'signaller/test/helpers'

# Add more helper methods to be used by all tests here...
module TestHelperMethods
  include Signaller::Test::Helpers

  def init_current_domain
    # For some reason, Domain and Configuration aren't autoloaded at this point,
    # so force them to load before we read test/fixtures/domain.yml
    Domain && Configuration
    @domain = YAML::load(File.open('test/fixtures/domain.yml'))
    CurrentDomain.set_domain(@domain)
  end

  def init_current_user(controller, name = 'test-test', session_token = '123456')
    user = User.new('id' => name)
    UserSession.controller = controller
    UserSession.update_current_user(user, session_token)
    user_session = UserSession.new
    controller.current_user_session = user_session
    user
  end

  def default_user
    User.new(
      'login' => 'user',
      'email' => 'user@socrata.com',
      'first_name' => 'Randy',
      'last_name' => 'Antler',
      'displayName' => 'Randy Antler',
      # This isn't a real password. If you need to re-record VCR cassettes, you'll need to use a real
      # password here to auth with Core.
      'password' => 'OpenData!',
      'uid' => 'four-four',
      'screen_name' => 'first-last',
      'id' => '3hpa-tfzy'
    )
  end

  def login(user = nil)
    user ||= default_user
    UserSession.controller = @controller
    @controller.current_user_session = UserSession.new(:login => user.login, :password => user.password)
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
      object.stubs(:request => stub(:query_parameters => {}))
    end
  end

  def stub_module_enabled_on_current_domain(module_name)
    CurrentDomain.stubs(module_names: [ module_name.to_s ])
    CurrentDomain.domain.stubs(features: Hashie::Mash.new.tap { |h| h.send(:"#{module_name}=", true) })
  end

  def stub_feature_flags_with(options)
    @feature_flags ||= Hashie::Mash.new(options)
    @feature_flags.merge!(options)
    CurrentDomain.stubs(:feature_flags => @feature_flags)
    FeatureFlags.stubs(:derive => @feature_flags)
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

  def stub_site_chrome(body = SocrataSiteChrome::DomainConfig.default_configuration.first)
    if Object.respond_to?(:stubs)
      # Minitest
      SiteChrome.stubs(:find => Hashie::Mash.new(
        :activation_state => {
          :open_data => false,
          :homepage => false,
          :data_lens => false
        }
      ))
      SocrataSiteChrome::DomainConfig.any_instance.stubs(:config =>
        HashWithIndifferentAccess.new(body)
      )
    else
      # RSpec
      allow(SiteChrome).to receive(:find).and_return(
        Hashie::Mash.new(
          :activation_state => {
            :open_data => false,
            :homepage => false,
            :data_lens => false
          }
        )
      )
      allow_any_instance_of(SocrataSiteChrome::DomainConfig).to receive(:config).and_return(
        HashWithIndifferentAccess.new(body)
      )
    end
  end

  def stub_site_chrome_custom_content(content = {})
    default_content = {
      :header => { :html => nil, :css => nil, :js => nil },
      :footer => { :html => nil, :css => nil, :js => nil }
    }

    if Object.respond_to?(:stubs)
      SocrataSiteChrome::CustomContent.any_instance.stubs(:fetch => default_content.deep_merge(content))
    else
      allow_any_instance_of(SocrataSiteChrome::CustomContent).to receive(:fetch).and_return(
        default_content.deep_merge(content)
      )
    end
  end
end
