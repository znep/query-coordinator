require 'test_helper'
require 'nokogiri'

class ApplicationHelperTest < ActionView::TestCase

  def test_render_fullstory_tacking_does_not_render
    FeatureFlags.stubs(:derive => { enable_fullstory_tracking: false })
    refute application_helper.render_fullstory_tracking
  end

  def test_render_fullstory_tracking_does_render
    FeatureFlags.stubs(:derive => { enable_fullstory_tracking: true })
    assert(application_helper.render_fullstory_tracking =~ /fullstory\.com/)
  end

  def test_render_airbrake_shim_does_not_render
    FeatureFlags.stubs(:derive => { enable_airbrake_js: false })
    refute application_helper.render_airbrake_shim
  end

  def test_render_airbrake_shim_does_render
    FeatureFlags.stubs(:derive => { enable_airbrake_js: true })
    ActionView::AssetPaths.any_instance.stubs(:config => OpenStruct.new(:assets_dir => '.')) # LOL
    assert(application_helper.render_airbrake_shim.to_s =~ /airbrake-shim/)
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
    init_current_domain
    # See comment in #asset_revision_key_regex below about REVISION_NUMBER
    CurrentDomain.stubs(:default_config_id => '1234')
    CurrentDomain.stubs(:default_config_updated_at => '5678')
    assert_match(/^[\w\d]+\.1234\.5678$/, application_helper.asset_revision_key)
  end

  def test_font_tags_outputs_typekit_when_config_present
    init_current_domain
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
    init_current_domain
    application_helper.stubs(:module_enabled?).with(:govStat).returns(true)

    assert_match(
      '<link href="https://fonts.googleapis.com/css?family=PT+Sans:400,700,400italic,700italic" rel="stylesheet" type="text/css">',
      application_helper.font_tags
    )
  end

  def test_font_tags_outputs_typekit_for_govstat_when_config_present
    init_current_domain
    application_helper.stubs(:module_enabled?).with(:govStat).returns(true)
    CurrentDomain.stubs(:properties => OpenStruct.new(typekit_id: 'abcdef'))

    output = application_helper.font_tags
    assert_match(%r{//use.typekit.net/abcdef.js}, output)
  end

  def test_font_tags_does_not_output_google_font_for_govstat_when_typekit
    init_current_domain
    application_helper.stubs(:module_enabled?).with(:govStat).returns(true)
    CurrentDomain.stubs(:properties => OpenStruct.new(typekit_id: 'abcdef'))

    assert_not_match(/fonts.googleapis.com/, application_helper.font_tags)
  end

  def test_font_tags_does_not_output_font_tags
    init_current_domain
    application_helper.stubs(:module_enabled?).with(:govStat).returns(false)
    CurrentDomain.stubs(:properties => OpenStruct.new)

    output = application_helper.font_tags
    assert_not_match(%r{//use.typekit.net/abcdef.js}, output)
    assert_not_match(/fonts.googleapis.com/, output)
  end

  def test_get_alt_dataset_link
    assert(application_helper.get_alt_dataset_link('test-name') =~ /\/d\/test-name\/alt/)
  end

  def test_render_license
    @view = View.new({})
    assert render_license == '(none)'
    @view = View.new({ 'license' => { 'name' => 'license test' } })
    puts render_license
    assert render_license == 'license test'

    @view = View.new({ 'license' => {
      'name' => 'license test',
      'termsLink' => 'http://www.example.com/'
    } })
    html = Nokogiri::HTML(render_license)
    assert html.text == 'license test'
    assert html.css('body').children.first.name == 'a'
    assert html.css('a').attribute('href').value == 'http://www.example.com/'

    @view = View.new({ 'license' => {
      'name' => 'license test',
      'logoUrl' => 'http://www.example.org/logo.jpg',
      'termsLink' => 'http://www.example.com/'
    } })
    html = Nokogiri::HTML(render_license)
    assert html.text == ''
    assert html.css('body').children.first.name == 'a'
    assert html.css('a').attribute('href').value == 'http://www.example.com/'
    assert html.css('a').children.first.name == 'img'
    assert html.css('img').attribute('src').value == 'http://www.example.org/logo.jpg'
    assert html.css('img').attribute('alt').value == 'license test'

    @view = View.new({ 'license' => {
      'name' => 'license test',
      'logoUrl' => 'images/logo.jpg',
      'termsLink' => 'http://www.example.com/'
    } })
    html = Nokogiri::HTML(render_license)
    assert html.text == ''
    assert html.css('body').children.first.name == 'a'
    assert html.css('a').attribute('href').value == 'http://www.example.com/'
    assert html.css('a').children.first.name == 'img'
    assert html.css('img').attribute('src').value == '/images/logo.jpg'
    assert html.css('img').attribute('alt').value == 'license test'
  end

  private

  def asset_revision_key_regex
    # NOTE REVISION_NUMBER is not set in dev and test mode unless you have REVISION in Rails.root
    # Format: "REVISION_NUMBER.default_config_id.default_config_updated_at"
    /\?[\w\d]+\.\d+\.\d+/
  end
end
