require 'test_helper'
require 'nokogiri'

class ApplicationHelperTest < ActionView::TestCase

  include ERB::Util

  def setup
    init_current_domain
    init_signaller
    application_helper.stubs(:cookies => {})
  end

  def test_custom_ga_tracking_code
    FeatureFlags.stubs(:derive => { enable_standard_ga_tracking: false })
    FeatureFlags.stubs(:derive => { enable_opendata_ga_tracking: true })
    assert(application_helper.use_ga_tracking_code? == true)

    FeatureFlags.stubs(:derive => { enable_opendata_ga_tracking: '' })
    assert(application_helper.use_ga_tracking_code? == true)

    FeatureFlags.stubs(:derive => { enable_opendata_ga_tracking: 'UA-123456' })
    assert(application_helper.use_ga_tracking_code? == true)

    FeatureFlags.stubs(:derive => { enable_opendata_ga_tracking: false })
    assert(application_helper.use_ga_tracking_code? == false)
  end

  def test_get_ga_tracking_code
    FeatureFlags.stubs(:derive => { enable_standard_ga_tracking: false })

    FeatureFlags.stubs(:derive => { enable_opendata_ga_tracking: true })
    APP_CONFIG.opendata_ga_tracking_code = 'UA-9999999'
    assert(application_helper.get_ga_tracking_code =~ /UA-9999999/)

    FeatureFlags.stubs(:derive => { enable_opendata_ga_tracking: '' })
    APP_CONFIG.opendata_ga_tracking_code = 'UA-9999999'
    assert(application_helper.get_ga_tracking_code =~ /UA-9999999/)

    FeatureFlags.stubs(:derive => { enable_opendata_ga_tracking: 'UA-123456' })
    assert(application_helper.get_ga_tracking_code =~ /UA-123456/)

    FeatureFlags.stubs(:derive => { enable_opendata_ga_tracking: false })
    assert(application_helper.get_ga_tracking_code == false)

    # Test (if set to true) standard ga tracking code overrides custom
    FeatureFlags.stubs(:derive => { enable_opendata_ga_tracking: 'UA-123456' })
    FeatureFlags.stubs(:derive => { enable_standard_ga_tracking: true })
    APP_CONFIG.standard_ga_tracking_code = 'UA-51039907-4'
    assert(application_helper.get_ga_tracking_code =~ /UA-51039907-4/)
  end

  def stub_user(user_id, role)
    user = User.new('roleName' => role, 'id' => user_id)
    application_helper.stubs(:current_user => user)
  end

  def test_find_user_id_and_role
    stub_user('tugg-ikce', 'admin')
    assert_match(application_helper.find_user_id, 'tugg-ikce')
    assert_match(application_helper.find_user_role, 'admin')

    stub_user(nil, 'publisher')
    assert_match(application_helper.find_user_id, 'none')
    assert_match(application_helper.find_user_role, 'publisher')

    stub_user('abcd-efgh', nil)
    assert_match(application_helper.find_user_id, 'abcd-efgh')
    assert_match(application_helper.find_user_role, 'none')

    application_helper.stubs(:current_user => nil)
    assert_match(application_helper.find_user_id, 'none')
    assert_match(application_helper.find_user_role, 'none')
  end

  def test_render_ga_tracking
    application_helper.stubs(:current_user => nil)
    FeatureFlags.stubs(:derive => { enable_opendata_ga_tracking: true })
    APP_CONFIG.opendata_ga_tracking_code = 'UA-9999999'
    assert(application_helper.render_ga_tracking =~ /_gaSocrata\('create', 'UA-9999999', 'auto', 'socrata'\);/)

    FeatureFlags.stubs(:derive => { enable_opendata_ga_tracking: '' })
    APP_CONFIG.opendata_ga_tracking_code = 'UA-9999999'
    assert(application_helper.render_ga_tracking =~ /_gaSocrata\('create', 'UA-9999999', 'auto', 'socrata'\);/)

    FeatureFlags.stubs(:derive => { enable_opendata_ga_tracking: 'UA-123456' })
    assert(application_helper.render_ga_tracking =~ /_gaSocrata\('create', 'UA-123456', 'auto', 'socrata'\);/)

    FeatureFlags.stubs(:derive => { enable_opendata_ga_tracking: false })
    assert(application_helper.render_ga_tracking !~ /_gaSocrata\('create'/)
  end

  def test_render_ga_tracking_extra_dimensions
    # Tests output of render_ga_tracking. Be careful of tiny formatting
    # differences that may cause tests to fail
    FeatureFlags.stubs(:derive => { enable_opendata_ga_tracking: true})
    application_helper.stubs(:current_user => nil)
    general_extra_dimension_regex = /_gaSocrata\('socrata\.send', 'pageview', extraDimensions\);/
    assert(application_helper.render_ga_tracking =~ general_extra_dimension_regex)

    stub_user('abcd-efgh', 'admin')
    generated_admin_present = application_helper.render_ga_tracking
    assert(generated_admin_present =~ /"dimension3":"admin"/)
    assert(generated_admin_present =~ /"dimension5":"abcd-efgh"/)

    application_helper.stubs(:current_user => nil)
    generated_no_user = application_helper.render_ga_tracking
    assert(generated_no_user =~ /"dimension3":"none"/)
    assert(generated_no_user =~ /"dimension5":"none"/)
  end

  def test_stylesheet_assets_has_assets
    result = application_helper.stylesheet_assets
    assert(result.is_a?(Hash))
    refute(result.empty?)
  end

  def test_stylesheet_assets_has_assets_with_asset_revision_key
    package, asset = application_helper.stylesheet_assets.first
    assert_match(/#{asset_revision_key_regex}$/, asset)
  end

  def test_rendered_stylesheet_tag_rendered
    package, asset = STYLE_PACKAGES.first
    asset_name = asset.first
    result = application_helper.rendered_stylesheet_tag(asset_name)
    assert_match(%r{<link type="text/css" rel="stylesheet" media="all" href="/styles/merged/#{asset_name}.css#{asset_revision_key_regex}"/>}, result)
  end

  def test_asset_revision_key_string
    # See comment in #asset_revision_key_regex below about REVISION_NUMBER
    CurrentDomain.stubs(:default_config_id => '1234')
    CurrentDomain.stubs(:default_config_updated_at => '5678')
    assert_match(/^[\w\d]+\.1234\.5678$/, application_helper.asset_revision_key)
  end

  def test_json_escape_produces_sanitized_json
    # sourced from https://github.com/rails/rails/blob/3e36db4406beea32772b1db1e9a16cc1e8aea14c/actionview/test/template/erb_util_test.rb
    #
    # we can get rid of this test case and the json_escape helper once we upgrade
    # to Rails 4, since all we're doing is patching our Rails 3 code
    input_to_output = [
      ['1', '1'],
      ['null', 'null'],
      ['"&"', '"\u0026"'],
      ['"</script>"', '"\u003c/script\u003e"'],
      ['["</script>"]', '["\u003c/script\u003e"]'],
      ['{"name":"</script>"}', '{"name":"\u003c/script\u003e"}'],
      [%({"name":"d\u2028h\u2029h"}), '{"name":"d\u2028h\u2029h"}']
    ]
    input_to_output.each do |(raw, expected)|
      assert_equal expected, json_escape(raw)
    end
  end

  def test_font_tags_outputs_typekit_when_config_present
    CurrentDomain.stubs(:properties => OpenStruct.new(typekit_id: 'abcdef'))

    assert_match(
      %r{<script type="text/javascript" src="//use.typekit.net/abcdef.js"></script>},
      application_helper.font_tags
    )
    assert_match(
      %r{<script type="text/javascript">try{Typekit.load\(\);}catch\(e\)\{\}</script>},
      application_helper.font_tags
    )
  end

  def test_font_tags_outputs_google_font_for_govstat
    application_helper.stubs(:module_enabled?).with(:govStat).returns(true)

    assert_match(
      '<link href="https://fonts.googleapis.com/css?family=PT+Sans:400,700,400italic,700italic" rel="stylesheet" type="text/css">',
      application_helper.font_tags
    )
  end

  def test_font_tags_outputs_typekit_for_govstat_when_config_present
    application_helper.stubs(:module_enabled?).with(:govStat).returns(true)
    CurrentDomain.stubs(:properties => OpenStruct.new(typekit_id: 'abcdef'))

    output = application_helper.font_tags
    assert_match(%r{//use.typekit.net/abcdef.js}, output)
  end

  def test_font_tags_does_not_output_google_font_for_govstat_when_typekit
    application_helper.stubs(:module_enabled?).with(:govStat).returns(true)
    CurrentDomain.stubs(:properties => OpenStruct.new(typekit_id: 'abcdef'))

    assert_no_match(/fonts.googleapis.com/, application_helper.font_tags)
  end

  def test_font_tags_does_not_output_font_tags
    application_helper.stubs(:module_enabled?).with(:govStat).returns(false)
    CurrentDomain.stubs(:properties => OpenStruct.new)

    output = application_helper.font_tags
    assert_no_match(%r{//use.typekit.net/abcdef.js}, output)
    assert_no_match(/fonts.googleapis.com/, output)
  end

  def setup_current_user_can_create_story(booleans)
    CurrentDomain.
      stubs(
        :feature_flags => {
          'stories_enabled' => booleans[:stories_enabled]
        }
      )

    user = stub
    user.stubs(:has_right? => booleans[:has_create_story])

    application_helper.
      stubs(:current_user => user)
  end

  def test_current_user_can_create_story_returns_true_when_stories_are_enabled_and_user_can_create_stories_foo
    setup_current_user_can_create_story(:stories_enabled => true, :has_create_story => true)
    assert(application_helper.current_user_can_create_story?, 'Expected current_user_can_create_story? to be true')
  end

  def test_current_user_can_create_story_returns_false_when_stories_are_enabled_and_user_cannot_create_stories
    setup_current_user_can_create_story(:stories_enabled => true, :has_create_story => false)
    assert(application_helper.current_user_can_create_story? == false, 'Expected current_user_can_create_story? to be false')
  end

  def test_current_user_can_create_story_returns_false_when_stories_are_disabled_and_user_can_create_stories
    setup_current_user_can_create_story(:stories_enabled => false, :has_create_story => true)
    assert(application_helper.current_user_can_create_story? == false, 'Expected current_user_can_create_story? to be false')
  end

  def test_current_user_can_create_story_returns_false_when_stories_are_disabled_and_user_cannot_create_stories
    setup_current_user_can_create_story(:stories_enabled => false, :has_create_story => false)
    assert(application_helper.current_user_can_create_story? == false, 'Expected current_user_can_create_story? to be false')
  end

  def test_is_mobile_http_user_agent_on_mobile_device_returns_true_without_overriding_params
    init_current_domain_mobile_device
    application_helper.stubs(:params => {})
    assert(application_helper.is_mobile?, 'Expected is_mobile? to be true')
  end

  def test_is_mobile_http_user_agent_on_mobile_device_returns_true_with_mobile_paramter_set_to_true
    init_current_domain_mobile_device
    application_helper.stubs(:params => { 'mobile' => 'trUE' }.with_indifferent_access)
    assert(application_helper.is_mobile?, 'Expected is_mobile? to be true')
  end

  def test_is_mobile_http_user_agent_on_mobile_device_returns_false_with_mobile_paramter_set_to_false
    init_current_domain_mobile_device
    application_helper.stubs(:params => { 'mobile' => 'FALse' }.with_indifferent_access)
    refute(application_helper.is_mobile?, 'Expected is_mobile? to be false')
  end

  def test_is_mobile_http_user_agent_on_mobile_device_returns_true_with_no_mobile_paramter_set_to_false
    init_current_domain_mobile_device
    application_helper.stubs(:params => { 'no_mobile' => 'FALse' }.with_indifferent_access)
    assert(application_helper.is_mobile?, 'Expected is_mobile? to be true')
  end

  def test_is_mobile_http_user_agent_on_mobile_device_returns_false_with_no_mobile_paramter_set_to_true
    init_current_domain_mobile_device
    application_helper.stubs(:params => { 'no_mobile' => 'trUE' }.with_indifferent_access)
    refute(application_helper.is_mobile?, 'Expected is_mobile? to be false')
  end

  def test_is_mobile_http_user_agent_on_non_mobile_device_returns_false_without_overriding_parameter
    init_current_domain_non_mobile_device
    application_helper.stubs(:params => {})
    refute(application_helper.is_mobile?, 'Expected is_mobile? to be false')
  end

  def test_is_mobile_http_user_agent_on_non_mobile_device_returns_true_when_mobile_parameter_is_true
    init_current_domain_non_mobile_device
    application_helper.stubs(:params => { 'mobile' => 'tRUe' }.with_indifferent_access)
    assert(application_helper.is_mobile?, 'Expected is_mobile? to be true')
  end

  def test_is_mobile_http_user_agent_on_non_mobile_device_returns_false_when_mobile_parameter_is_false
    init_current_domain_non_mobile_device
    application_helper.stubs(:params => { 'mobile' => 'falSE' }.with_indifferent_access)
    refute(application_helper.is_mobile?, 'Expected is_mobile? to be false')
  end

  def test_get_alt_dataset_link
    assert(application_helper.get_alt_dataset_link('test-name') =~ /\/d\/test-name\/alt/)
  end

  def test_render_license
    @view = View.new({})
    assert render_license == '(none)'

    LicenseConfig.any_instance.stubs(find_by_id: { :name => 'license test' })
    @view = View.new({ 'licenseId' => 'test' })
    assert render_license == 'license test'

    LicenseConfig.any_instance.stubs(find_by_id: {
      name: 'license test',
      terms_link: 'http://www.example.com/'
    })
    html = Nokogiri::HTML(render_license)
    assert html.text == 'license test'
    assert html.css('body').children.first.name == 'a'
    assert html.css('a').attribute('href').value == 'http://www.example.com/'

    LicenseConfig.any_instance.stubs(find_by_id: {
      name: 'license test',
      logo: 'http://www.example.org/logo.jpg',
      terms_link: 'http://www.example.com/'
    })
    html = Nokogiri::HTML(render_license)
    assert html.text == ''
    assert html.css('body').children.first.name == 'a'
    assert html.css('a').attribute('href').value == 'http://www.example.com/'
    assert html.css('a').children.first.name == 'img'
    assert html.css('img').attribute('src').value == 'http://www.example.org/logo.jpg'
    assert html.css('img').attribute('alt').value == 'license test'

    LicenseConfig.any_instance.stubs(find_by_id: {
      name: 'license test',
      logo: 'images/logo.jpg',
      terms_link: 'http://www.example.com/'
    })
    html = Nokogiri::HTML(render_license)
    assert html.text == ''
    assert html.css('body').children.first.name == 'a'
    assert html.css('a').attribute('href').value == 'http://www.example.com/'
    assert html.css('a').children.first.name == 'img'
    assert html.css('img').attribute('src').value == '/images/logo.jpg'
    assert html.css('img').attribute('alt').value == 'license test'
  end

  def test_get_publish_embed_code_for_view
    view = View.new({'id' => 'blah-blah', 'domainCName' => 'local', 'federated' => false, 'name' => 'Templates'})
    options = {:dimensions => { :width => 600, :height => 400}}
    html = Nokogiri::HTML(get_publish_embed_code_for_view(view, options))
    assert_match(/Templates/, html.text)
    assert_match(/Powered by Socrata/, html.text)
    assert html.css('iframe').attribute('width').value == '600px'
    assert html.css('iframe').attribute('height').value == '400px'
    assert html.css('a').attribute('href').value == 'http://local/dataset/Templates/blah-blah'
  end

  def test_user_has_domain_role_or_unauthenticated_share_by_email_enabled_when_view_has_grant_right
    setup_user_has_domain_role_or_unauthenticated_share_by_email_enabled_test

    # Mock a view with the 'grant' right (by responding true to any rights query)
    # This should override any other checks
    @view.stubs(:has_right? => true)
    assert @object.user_has_domain_role_or_unauthenticated_share_by_email_enabled?(@view)
  end

  def test_user_has_domain_role_or_unauthenticated_share_by_email_enabled_when_view_does_not_have_grant_right_and_user_is_present_and_is_member_of_current_domain_and_has_create_datasets_right
    setup_user_has_domain_role_or_unauthenticated_share_by_email_enabled_test

    # Mock a view without the 'grant' right (by responding true to any rights query)
    @view.stubs(:has_right? => false)
    # Mock CurrentDomain to report that all users are a member
    CurrentDomain.stubs(:member? => true)
    # Mock a current_user that exists and has the 'create_datasets' right (by responding true to any rights query)
    @object.current_user.stubs(:has_right? => true)
    assert @object.user_has_domain_role_or_unauthenticated_share_by_email_enabled?(@view)
  end

  def test_user_has_domain_role_or_unauthenticated_share_by_email_enabled_when_view_does_not_have_grant_right_and_user_is_present_and_is_member_of_current_domain_and_does_not_have_create_datasets_right
    setup_user_has_domain_role_or_unauthenticated_share_by_email_enabled_test

    # Mock a view without the 'grant' right (by responding true to any rights query)
    @view.stubs(:has_right? => false)
    # Mock CurrentDomain to report that all users are a member
    CurrentDomain.stubs(:member? => true)
    # Mock a current_user that exists and does not have the 'create_datasets' right (by responding true to any rights query)
    @object.current_user.stubs(:has_right? => false)
    refute @object.user_has_domain_role_or_unauthenticated_share_by_email_enabled?(@view)
  end

  def test_user_has_domain_role_or_unauthenticated_share_by_email_enabled_when_view_does_not_have_grant_right_and_user_is_present_and_is_not_member_of_current_domain_and_user_has_create_datasets_right
    setup_user_has_domain_role_or_unauthenticated_share_by_email_enabled_test

    # Mock a view without the 'grant' right (by responding false to any rights query)
    @view.stubs(:has_right? => false)
    # Mock CurrentDomain to report that no users are a member
    CurrentDomain.stubs(:member? => false)
    # Mock a current_user that exists and has the 'create_datasets' right (by responding true to any rights query)
    @object.current_user.stubs(:has_right? => true)
    refute @object.user_has_domain_role_or_unauthenticated_share_by_email_enabled?(@view)
  end

  def test_user_has_domain_role_or_unauthenticated_share_by_email_enabled_when_view_does_not_have_grant_right_and_user_is_present_and_is_not_member_of_current_domain_and_user_does_not_have_create_datasets_right
    setup_user_has_domain_role_or_unauthenticated_share_by_email_enabled_test

    # Mock a view without the 'grant' right (by responding false to any rights query)
    @view.stubs(:has_right? => false)
    # Mock CurrentDomain to report that no users are a member
    CurrentDomain.stubs(:member? => false)
    # Mock a current_user that exists and does not have the 'create_datasets' right (by responding true to any rights query)
    @object.current_user.stubs(:has_right? => false)
    refute @object.user_has_domain_role_or_unauthenticated_share_by_email_enabled?(@view)
  end

  def test_user_has_domain_role_or_unauthenticated_share_by_email_enabled_when_view_does_not_have_grant_right_and_user_is_not_present_and_is_member_of_the_current_domain
    setup_user_has_domain_role_or_unauthenticated_share_by_email_enabled_test

    # Mock a view without the 'grant' right (by responding false to any rights query)
    @view.stubs(:has_right? => false)
    # Mock no current user
    @object.stubs(:current_user => nil)
    # Mock CurrentDomain to report that all users are a member
    CurrentDomain.stubs(:member? => true)
    refute @object.user_has_domain_role_or_unauthenticated_share_by_email_enabled?(@view)
  end

  def test_user_has_domain_role_or_unauthenticated_share_by_email_enabled_when_view_does_not_have_grant_right_and_user_is_not_present_and_is_not_member_of_the_current_domain
    setup_user_has_domain_role_or_unauthenticated_share_by_email_enabled_test

    # Mock a view without the 'grant' right (by responding false to any rights query)
    @view.stubs(:has_right? => false)
    # Mock no current user
    @object.stubs(:current_user => nil)
    # Mock CurrentDomain to report that no users are a member
    CurrentDomain.stubs(:member? => false)
    refute @object.user_has_domain_role_or_unauthenticated_share_by_email_enabled?(@view)
  end

  def test_user_has_domain_role_or_unauthenticated_share_by_email_enabled_when_view_does_not_have_grant_right_and_user_is_not_present_and_view_is_public
    setup_user_has_domain_role_or_unauthenticated_share_by_email_enabled_test

    # Mock a view without the 'grant' right (by responding false to any rights query)
    @view.stubs(:has_right? => false)
    # Mock no current user
    @object.stubs(:current_user => nil)
    # Mock CurrentDomain to report that no users are a member
    CurrentDomain.stubs(:member? => false)
    # Mock view to always report it is public
    @view.stubs(:is_public? => true)
    assert @object.user_has_domain_role_or_unauthenticated_share_by_email_enabled?(@view)
  end

  def test_user_has_domain_role_or_unauthenticated_share_by_email_enabled_when_view_does_not_have_grant_right_and_user_is_not_present_and_view_is_not_public
    setup_user_has_domain_role_or_unauthenticated_share_by_email_enabled_test

    # Mock a view without the 'grant' right (by responding false to any rights query)
    @view.stubs(:has_right? => false)
    # Mock no current user
    @object.stubs(:current_user => nil)
    # Mock CurrentDomain to report that no users are a member
    CurrentDomain.stubs(:member? => false)
    # Mock view to always report it is public
    @view.stubs(:is_public? => false)
    refute @object.user_has_domain_role_or_unauthenticated_share_by_email_enabled?(@view)
  end

  def test_enable_site_chrome_is_false_if_no_site_chrome_activation_states_are_true
    SiteChrome.stubs(:find => SiteChrome.new)
    SiteChrome.any_instance.stubs(:is_activated_on?).with('open_data').returns(false)
    SiteChrome.any_instance.stubs(:is_activated_on?).with('homepage').returns(false)
    SiteChrome.any_instance.stubs(:is_activated_on?).with('data_lens').returns(false)
    refute application_helper.enable_site_chrome?
  end

  def test_enable_site_chrome_is_false_on_homepage_and_dataset_if_the_states_are_true_but_the_other_conditions_are_not_met
    SiteChrome.stubs(:find => SiteChrome.new)
    SiteChrome.any_instance.stubs(:is_activated_on?).with('open_data').returns(false)
    SiteChrome.any_instance.stubs(:is_activated_on?).with('homepage').returns(true)
    SiteChrome.any_instance.stubs(:is_activated_on?).with('data_lens').returns(true)
    refute application_helper.enable_site_chrome?
  end

  def test_enable_site_chrome_is_true_for_homepage
    SiteChrome.stubs(:find => SiteChrome.new)
    SiteChrome.any_instance.stubs(:is_activated_on?).with('open_data').returns(false)
    SiteChrome.any_instance.stubs(:is_activated_on?).with('homepage').returns(true)
    SiteChrome.any_instance.stubs(:is_activated_on?).with('data_lens').returns(false)
    application_helper.stubs(:on_homepage => false)
    application_helper.stubs(:using_dataslate => false)
    refute application_helper.enable_site_chrome?
    application_helper.stubs(:on_homepage => true)
    application_helper.stubs(:using_dataslate => false)
    assert application_helper.enable_site_chrome?
  end

  def test_enable_site_chrome_is_false_for_dataslate_when_site_chrome_is_not_activated
    SiteChrome.stubs(:find => SiteChrome.new)
    SiteChrome.any_instance.stubs(:activation_state).returns('open_data' => false)
    application_helper.stubs(:on_homepage => false)
    application_helper.stubs(:using_dataslate => true)
    refute application_helper.enable_site_chrome?
  end

  def test_enable_site_chrome_is_false_for_dataslate_when_site_chrome_is_activated_but_the_disable_flag_is_true
    SiteChrome.stubs(:find => SiteChrome.new)
    SiteChrome.any_instance.stubs(:activation_state).returns('open_data' => true)
    application_helper.stubs(:on_homepage => false)
    application_helper.stubs(:using_dataslate => true)
    FeatureFlags.stubs(:derive => Hashie::Mash.new(
      :disable_site_chrome_header_footer_on_dataslate_pages => true
    ))
    refute application_helper.enable_site_chrome?
  end

  def test_enable_site_chrome_is_true_for_dataslate_when_site_chrome_is_activated
    SiteChrome.stubs(:find => SiteChrome.new)
    SiteChrome.any_instance.stubs(:activation_state).returns('open_data' => true)
    application_helper.stubs(:on_homepage => false)
    application_helper.stubs(:using_dataslate => true)
    assert application_helper.enable_site_chrome?
  end

  def test_enable_site_chrome_doesnt_error_if_site_chrome_is_nil
    SiteChrome.stubs(:find => nil)
    refute application_helper.enable_site_chrome?
  end

  def test_enable_site_chrome_doesnt_error_if_site_chrome_is_false
    SiteChrome.stubs(:find => false)
    refute application_helper.enable_site_chrome?
  end

  def test_on_view_page_is_false_if_view_is_nil
    refute application_helper.on_view_page?(nil)
  end

  def test_on_view_page_is_false_if_view_does_not_have_id
    view = View.new('id' => nil)
    refute application_helper.on_view_page?(view)
  end

  def test_on_view_page_is_true_if_view_exists_and_has_id
    view = View.new('id' => 'blah-blah')
    assert application_helper.on_view_page?(view)
  end

  def test_using_govstat_header_is_true_when_govstat_module_enabled_and_not_suppressing_govstat
    application_helper.stubs(:module_enabled? => true)
    application_helper.stubs(:suppress_govstat? => false)
    assert application_helper.using_govstat_header?
  end

  def test_using_govstat_header_is_false_when_govstat_module_disabled
    application_helper.stubs(:module_enabled? => false)
    application_helper.stubs(:suppress_govstat? => false)
    refute application_helper.using_govstat_header?
  end

  def test_using_govstat_header_is_false_when_suppressing_govstat
    application_helper.stubs(:module_enabled? => true)
    application_helper.stubs(:suppress_govstat? => true)
    refute application_helper.using_govstat_header?
  end

  def test_meta_keywords
    assert application_helper.meta_keywords(nil) == nil

    view = Hashie::Mash.new.tap { |hashie| hashie.tags = nil }
    keywords = application_helper.meta_keywords(view)
    assert keywords.length == 4
    assert (keywords - ApplicationHelper.class_variable_get(:@@default_meta_tags)) == []

    view = Hashie::Mash.new.tap { |hashie| hashie.tags = %w(a b c d) }
    keywords = application_helper.meta_keywords(view)
    assert keywords.length == 8
    assert (keywords - ApplicationHelper.class_variable_get(:@@default_meta_tags)).sort == %w(a b c d)
  end

  private

  def asset_revision_key_regex
    # NOTE REVISION_NUMBER is not set in dev and test mode unless you have REVISION in Rails.root
    # Format: "REVISION_NUMBER.default_config_id.default_config_updated_at"
    /\?[\w\d]+\.\d+\.\d+/
  end

  def default_view_state
    {
      :is_alt_view? => false,
      :is_tabular? => true,
      :is_unpublished? => false,
      :is_geo? => false,
      :is_blobby? => false,
      :is_href? => false,
      :flag? => true,
      :has_rights? => true
    }
  end

  def setup_user_has_domain_role_or_unauthenticated_share_by_email_enabled_test
    @object = Object.new.tap { |object| object.extend(ApplicationHelper) }
    @view = View.new.tap { |view| view.stubs(default_view_state) }
    @object.stubs(:view => @view, :request => nil, :current_user => Object.new)
  end

  def init_current_domain_mobile_device
    application_helper.stubs(:controller_name => 'test')
    CurrentDomain.stubs(:configuration => OpenStruct.new(:properties => OpenStruct.new(:view_type => 'table')))
    application_helper.stubs(:request => OpenStruct.new(:env => { 'HTTP_USER_AGENT' => 'IPHone'}))
    application_helper.stubs(:current_user => nil)
  end

  def init_current_domain_non_mobile_device
    init_current_domain_mobile_device
    application_helper.stubs(:request => OpenStruct.new(:env => { 'HTTP_USER_AGENT' => 'MaCiNtOsH'}))
  end

  def teardown
    application_helper.unstub(:cookies)
    application_helper.unstub(:controller_name)
    application_helper.unstub(:request)
    CurrentDomain.unstub(:configuration)
    CurrentDomain.unstub(:feature_flags)
    CurrentDomain.unstub(:default_locale)
    FeatureFlags.unstub(:derive)
  end

end
