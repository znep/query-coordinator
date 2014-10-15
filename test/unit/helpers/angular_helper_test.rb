require 'test_helper'

class AngularHelperTest < ActionView::TestCase

  def test_render_airbrake_notifier_does_not_render
    FeatureFlags.stubs(:derive => { enable_airbrake_js: false })
    refute application_helper.render_airbrake_notifier
  end

  def test_render_airbrake_notifier_does_render
    FeatureFlags.stubs(:derive => { enable_airbrake_js: true })
    ActionView::AssetPaths.any_instance.stubs(:config => OpenStruct.new(:assets_dir => '.')) # LOL
    assert(application_helper.render_airbrake_notifier.to_s =~ /exception_notifier/)
  end

end
