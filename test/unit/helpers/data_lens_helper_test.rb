require 'test_helper'
require 'data_lens_helper'

class DataLensHelperTest < ActionView::TestCase

  def setup
    init_current_domain
    Configuration.stubs(:find_by_type => [])
    data_lens_helper.stubs(:asset_revision_key => 'asset_revision_key_value')
  end

  def teardown
    data_lens_helper.unstub(:asset_revision_key)
    Configuration.unstub(:find_by_type)
    FeatureFlags.unstub(:derive)
  end

  def data_lens_helper
    @data_lens_helper ||= Object.new.tap do |object|
      object.extend(DataLensHelper)
      object.stubs(:request => stub(:query_parameters => {}))
    end
  end

  def test_render_airbrake_notifier_does_not_render
    FeatureFlags.stubs(:derive => { :enable_airbrake_js => false })
    data_lens_helper.expects(:include_javascripts_unminified).with('exception_notifier').never
    data_lens_helper.render_airbrake_notifier
  end

  def test_render_airbrake_notifier_does_render
    FeatureFlags.stubs(:derive => { :enable_airbrake_js => true })
    data_lens_helper.expects(:include_javascripts_unminified).with('exception_notifier').once
    data_lens_helper.render_airbrake_notifier
  end

  def test_data_lens_config_contains_asset_revision_key
    result = data_lens_helper.angular_config
    assert(result.has_key?('assetRevisionKey'), 'angular_config has cache buster key')
    assert_match('asset_revision_key_value', result['assetRevisionKey'])
  end

  def test_data_lens_config_multiple_calls_has_same_result
    result = data_lens_helper.angular_config['assetRevisionKey']
    assert(result, 'result should not be nil')
    assert_equal(data_lens_helper.angular_config['assetRevisionKey'], result, 'result be the same assetRevisionKey')
  end

  # TODO: Replace with a test that stubs at a lower level, using webmock
  def test_configuration_by_type
    configuration_model = Configuration.new(
      'properties' => [
        {
          'name' => 'staging_api_lockdown',
          'value' => true
        }
      ]
    )
    CurrentDomain.stubs(:configuration => configuration_model)
    result = data_lens_helper.configuration_by_type 'feature_set'
    assert(result['staging_api_lockdown'] != nil, 'result has value')
    CurrentDomain.unstub(:configuration)
  end

  def test_tileserver_hosts_app_config_translated_to_array
    APP_CONFIG.tileserver_hosts = nil
    result = data_lens_helper.tileserver_hosts
    assert(result == [], 'result for nil is not []')
    APP_CONFIG.tileserver_hosts = ''
    result = data_lens_helper.tileserver_hosts
    assert(result == [], 'result for '' is not []')
    APP_CONFIG.tileserver_hosts = 'tile1.example.com, tile2.example.com'
    result = data_lens_helper.tileserver_hosts
    assert(result == %w(tile1.example.com tile2.example.com), 'result is not correct list')
  end

end
