require 'test_helper'

class AngularHelperTest < ActionView::TestCase

  def setup
    init_current_domain
    application_helper.stubs(:asset_revision_key => 'asset_revision_key_value')
  end

  def test_render_airbrake_notifier_does_not_render
    FeatureFlags.stubs(:derive => { enable_airbrake_js: false })
    refute application_helper.render_airbrake_notifier
  end

  def test_render_airbrake_notifier_does_render
    FeatureFlags.stubs(:derive => { enable_airbrake_js: true })
    ActionView::AssetPaths.any_instance.stubs(:config => OpenStruct.new(:assets_dir => '.')) # LOL
    assert(application_helper.render_airbrake_notifier.to_s =~ /exception_notifier/)
  end

  def test_angular_config_contains_asset_revision_key
    result = application_helper.angular_config
    assert(result.has_key?('assetRevisionKey'), 'angular_config has cache buster key')
    assert_match('asset_revision_key_value', result['assetRevisionKey'])
  end

  def test_angular_config_multiple_calls_has_same_result
    result = application_helper.angular_config['assetRevisionKey']
    assert(result != nil, 'result is not nil')
    assert(result == application_helper.angular_config['assetRevisionKey'], 'result is the same')
  end
end
