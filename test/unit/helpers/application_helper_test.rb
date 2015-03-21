require 'test_helper'

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

  private

  def asset_revision_key_regex
    # NOTE REVISION_NUMBER is not set in dev and test mode unless you have REVISION in Rails.root
    # Format: "REVISION_NUMBER.default_config_id.default_config_updated_at"
    /\?[\w\d]+\.\d+\.\d+/
  end
end
