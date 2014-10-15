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

end
