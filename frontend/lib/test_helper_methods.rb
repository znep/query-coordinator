require 'signaller/test/helpers'

# Add more helper methods to be used by all tests here...
module TestHelperMethods
  include Signaller::Test::Helpers
  include SocrataSiteChrome::Test::Helpers

  # TODO Change this method name in feature flag signaller gem
  def init_feature_flag_signaller(args = {})
    init_signaller(args)
  end

  def init_current_domain
    # For some reason, Domain and Configuration aren't autoloaded at this point,
    # so force them to load before we read test/fixtures/domain.yml
    Domain && Configuration
    @domain = YAML::load(File.open('spec/fixtures/domain.yml'))
    CurrentDomain.set_domain(@domain)
  end

  def init_current_user(controller, id = 'test-test', session_token = '123456')
    user = User.new('id' => id)
    UserSessionProvider.klass.controller = controller
    UserSessionProvider.klass.update_current_user(user, session_token)
    user_session = UserSessionProvider.klass.new
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

  def login(user = default_user)
    UserSessionProvider.klass.controller = @controller
    @controller.current_user_session = UserSessionProvider.klass.new(:login => user.login, :password => user.password)
    user
  end

  def logout
    @controller.current_user_session = nil
  end

  ANONYMOUS = 'anonymous'
  ADMIN = 'admin'
  NO_USER = 'no user'
  NON_ROLED = 'non roled'

  def init_environment(test_user: TestHelperMethods::ADMIN, site_chrome: true, feature_flags: {})
    init_current_domain
    init_feature_flag_signaller(:with => feature_flags)
    UserSessionProvider.klass.controller = @controller

    if site_chrome
      stub_site_chrome
    end

    case test_user
      when TestHelperMethods::ADMIN
        stub_current_user
        stub_authenticate_success
        user_session = UserSessionProvider.klass.new
        controller.try(:current_user_session=, user_session)
      when TestHelperMethods::ANONYMOUS
        stub_anonymous_user
      when TestHelperMethods::NON_ROLED
        stub_non_roled_user
        stub_authenticate_success
        user_session = UserSessionProvider.klass.new
        controller.try(:current_user_session=, user_session)
    end
  end

  def init_anonymous_environment
    init_environment(test_user: TestHelperMethods::ANONYMOUS, site_chrome: false)
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

  def stub_site_chrome(body = SocrataSiteChrome::DomainConfig.default_configuration.first)
    stub_site_chrome_instance # SocrataSiteChrome::Test::Helpers

    if Object.respond_to?(:stubs)
      # Minitest
      SiteAppearance.stubs(
        :find => Hashie::Mash.new(
          :activation_state => {
            :open_data => false,
            :homepage => false,
            :data_lens => false
          }
        )
      )
      SocrataSiteChrome::DomainConfig.any_instance.stubs(:config =>
        HashWithIndifferentAccess.new(body)
      )
    else
      # RSpec
      allow(SiteAppearance).to receive(:find).and_return(
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
    activated = content.present?

    default_content = {
      :header => { :html => nil, :css => nil, :js => nil },
      :footer => { :html => nil, :css => nil, :js => nil }
    }

    if Object.respond_to?(:stubs)
      SocrataSiteChrome::CustomContent.any_instance.stubs(
        :activated? => activated,
        :fetch => default_content.deep_merge(content)
      )
    else
      allow_any_instance_of(SocrataSiteChrome::CustomContent).to receive(:activated?).and_return(
        activated
      )
      allow_any_instance_of(SocrataSiteChrome::CustomContent).to receive(:fetch).and_return(
        default_content.deep_merge(content)
      )
    end
  end

  def core_cookie
    '_core_session_id=4294725782bf5d463f5eff2d3808451bc005c110a5c07ca4d9db2f3e7c1d3755'
  end

  def remember_cookie
    'remember_token=5KI4OwGkG1vrPiNgBgA9lBFbduVUgbNx'
  end

  def cookie_path
    'Path=/'
  end

  def cookie_string
    [core_cookie, remember_cookie, cookie_path].join(';')
  end

  def empty_cookie_string
    '_core_session_id=;remember_token=;Path=/'
  end

  def stub_current_user
    stub_request(:get, 'http://localhost:8080/users/current.json')
      .with(:headers => { 'Accept'=>'*/*',
                          'Accept-Encoding'=>'gzip;q=1.0,deflate;q=0.6,identity;q=0.3',
                          'User-Agent'=>'Ruby',
                          'X-Socrata-Host'=>'localhost',
                          'X-User-Agent'=>'Rails Testing'})
      .to_return(status: 200,
                 body: authentication_body.to_json,
                 headers: { 'Set-Cookie' => cookie_string })
  end

  def stub_non_roled_user
    stub_request(:get, 'http://localhost:8080/users/current.json')
      .with(:headers => { 'Accept'=>'*/*',
                          'Accept-Encoding'=>'gzip;q=1.0,deflate;q=0.6,identity;q=0.3',
                          'User-Agent'=>'Ruby',
                          'X-Socrata-Host'=>'localhost',
                          'X-User-Agent'=>'Rails Testing'})
      .to_return(status: 200,
                 body: authentication_body.except('roleName').to_json,
                 headers: { 'Set-Cookie' => cookie_string })
  end

  def stub_anonymous_user
    stub_request(:get, 'http://localhost:8080/users/current.json')
      .with(:headers => { 'Accept'=>'*/*',
                          'Accept-Encoding'=>'gzip;q=1.0,deflate;q=0.6,identity;q=0.3',
                          'User-Agent'=>'Ruby',
                          'X-Socrata-Host'=>'localhost',
                          'X-User-Agent'=>'Rails Testing'})
      .to_return(status: 403,
                 headers: { 'Set-Cookie' => empty_cookie_string })
  end

  def stub_logout
    stub_request(:post, 'http://localhost:8080/authenticate?method=logout')
      .with(headers: { 'Accept' => '*/*',
                       'Cookie' => "#{core_cookie}; #{remember_cookie}",
                       'User-Agent' => 'Ruby',
                       'X-Socrata-Host' => 'localhost',
                       'X-User-Agent' => 'Rails Testing' })
      .to_return(status: 200,
                 body: authentication_body.to_json,
                 headers: { 'Set-Cookie' => empty_cookie_string })
  end

  def stub_authenticate_success
    stub_request(:post, 'http://localhost:8080/authenticate')
      .with(headers: { 'Accept' => '*/*',
                       'Content-Type' => 'application/x-www-form-urlencoded',
                       'User-Agent' => 'Ruby',
                       'X-Socrata-Host' => 'localhost' })
      .to_return(status: 200,
                 body: authentication_body.to_json,
                 headers: { 'Set-Cookie' => cookie_string })
  end

  def stub_authenticate_federated_success
    stub_request(:post, 'http://localhost:8080/authenticate?method=authenticateFederatedAuth0User')
      .with(headers: { 'Accept' => '*/*',
                       'Content-Type' => 'application/x-www-form-urlencoded',
                       'User-Agent' => 'Ruby',
                       'X-Socrata-Host' => 'localhost' })
      .to_return(status: 200,
                 body: authentication_body.to_json,
                 headers: { 'Set-Cookie' => cookie_string })
  end

  def stub_authenticate_federated_failure
    stub_request(:post, 'http://localhost:8080/authenticate?method=authenticateFederatedAuth0User')
      .with(headers: { 'Accept' => '*/*',
                       'Content-Type' => 'application/x-www-form-urlencoded',
                       'User-Agent' => 'Ruby',
                       'X-Socrata-Host' => 'localhost' })
      .to_return(status: 404,
                 headers: { 'Set-Cookie' => empty_cookie_string })
  end

  def stub_auth0_identifiers
    stub_request(:post, 'http://localhost:8080/auth0_identifiers/')
      .with(body: { 'identifier' => 1 }.to_json,
            headers: { 'Accept' => '*/*',
                       'Accept-Encoding' => 'gzip;q=1.0,deflate;q=0.6,identity;q=0.3',
                       'Content-Type' => 'application/json',
                       'User-Agent' => 'Ruby',
                       'X-Socrata-Host' => 'localhost'})
      .to_return(status: 200,
                 headers: {})
  end

  def stub_recaptcha_valid_success
    stub_request(:post, 'https://www.google.com/recaptcha/api/siteverify')
      .with(body: 'secret=&response=true',
            headers: { 'Accept' => '*/*',
                       'Accept-Encoding' => 'gzip;q=1.0,deflate;q=0.6,identity;q=0.3',
                       'User-Agent' => 'Ruby' })
      .to_return(status: 200,
                 headers: { 'Content-Type' => 'application/json' },
                 body: { 'success': true,
                         'hostname': 'localhost'
                       }.to_json)
  end

  def authentication_body
    {
      id: 'tugg-ikce',
      createdAt: 1389374842,
      displayName: 'Random Deciduous-Horn',
      email: 'random.deciduous-horn@socrata.com',
      emailUnsubscribed: false,
      lastLogin: 1440456297,
      numberOfFollowers: 0,
      numberOfFriends: 0,
      oid: 2,
      profileImageUrlLarge: '/images/profile/4351/0767/random.deciduous-horn_large.jpeg',
      profileImageUrlMedium: '/images/profile/4351/0767/random.deciduous-horn_thumb.jpeg',
      profileImageUrlSmall: '/images/profile/4351/0767/random.deciduous-horn_tiny.jpeg',
      profileLastModified: 1426550777,
      publicTables: 0,
      publicViews: 0,
      roleName: 'administrator',
      screenName: 'random deciduous-horn',
      rights: ['create_datasets', 'edit_others_datasets', 'edit_sdp', 'edit_site_theme', 'moderate_comments', 'manage_users', 'chown_datasets', 'edit_nominations', 'approve_nominations', 'feature_items', 'federations', 'manage_stories', 'manage_approval', 'change_configurations', 'view_domain', 'view_others_datasets', 'edit_pages', 'create_pages', 'view_goals', 'view_dashboards', 'edit_goals', 'edit_dashboards', 'create_dashboards'],
      flags: ['admin']
    }
  end

  def stub_user_session
    UserSessionProvider.klass.any_instance.stubs(:save).with(true).returns(Net::HTTPSuccess.new(1.1, 200, 'Success'))
    User.stubs(current_user: User.new(some_user))
    CoreManagedUserSession.any_instance.stubs(:auth_cookie_string).returns('Have a cookie')
  end

  def some_user
    {
      accept_terms: true,
      email: 'foo@bar.com',
      id: '1234-abcd',
      password: 'asdf',
      passwordConfirm: 'asdf'
    }
  end

  def stub_administrator_user(subject)
    stub_user(subject,
      %w[
        approve_nominations
        change_configurations
        chown_datasets
        create_dashboards
        create_datasets
        create_pages
        create_story
        create_story_copy
        delete_story
        edit_dashboards
        edit_goals
        edit_nominations
        edit_others_datasets
        edit_pages
        edit_sdp
        edit_site_theme
        edit_story
        edit_story_title_desc
        feature_items
        federations
        manage_approval
        manage_stories
        manage_story_collaborators
        manage_story_public_version
        manage_story_visibility
        manage_provenance
        manage_users
        moderate_comments
        use_data_connectors
        view_all_dataset_status_logs
        view_dashboards
        view_domain
        view_goals
        view_others_datasets
        view_story
        view_unpublished_story
      ]
    )
  end

  def stub_superadmin_user(subject)
    stub_user(subject, UserRights::ALL_RIGHTS, true)
  end

  def stub_designer_user(subject)
    stub_user(subject,
      %w[
        change_configurations
        create_datasets
        create_pages
        edit_sdp
        edit_site_theme
        feature_items
        view_domain
        view_others_datasets
        view_story
        view_unpublished_story
      ]
    )
  end

  def stub_viewer_user(subject)
    stub_user(subject,
      %w[
        view_dashboards
        view_goals
        view_others_datasets
        view_story
        view_unpublished_story
      ]
    )
  end

  def stub_spatial_lens_admin(subject)
    stub_user(subject, [UserRights::MANAGE_SPATIAL_LENS])
  end

  def stub_user(subject, rights = [], superadmin = false)
    user = User.new
    allow(user).to receive(:is_superadmin?).and_return(superadmin)
    user.rights = rights
    allow(subject).to receive(:current_user).and_return(user)
  end
end
