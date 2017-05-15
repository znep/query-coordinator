require 'rails_helper'

describe DataLensHelper do
  include TestHelperMethods

  before do
    init_current_domain
    init_signaller
    allow(Configuration).to receive(:find_by_type).and_return([])
    allow(helper).to receive(:asset_revision_key).and_return('asset_revision_key_value')
    allow(helper).to receive(:enable_site_chrome?).and_return(false)
    allow(helper).to receive(:request).and_return(OpenStruct.new(:query_parameters => {}))
  end

  context 'asset_revision_key' do
    it 'is included in the angular_config' do
      config = helper.angular_config
      expect(config.has_key?('assetRevisionKey')).to be(true)
      expect(config['assetRevisionKey']).to eq('asset_revision_key_value')
    end

    it 'should returns the same value over multiple calls' do
      result = helper.angular_config['assetRevisionKey']
      assert(result, 'result should not be nil')
      assert_equal(helper.angular_config['assetRevisionKey'], result, 'result be the same assetRevisionKey')
    end
  end

  context 'configuration by type' do
    # TODO: Replace with a test that stubs at a lower level, using webmock
    it 'should honor staging api lockdown' do
      configuration = Configuration.new(
        'properties' => [
          {
            'name' => 'staging_api_lockdown',
            'value' => true
          }
        ]
      )
      allow(CurrentDomain).to receive(:configuration).and_return(configuration)
      expect(helper.configuration_by_type('feature_set')['staging_api_lockdown']).to_not be_nil
    end
  end

  context 'tileserver hosts application config' do
    context 'when tileserver_hosts is nil' do
      it 'translates into an empty array' do
        allow(APP_CONFIG).to receive(:tileserver_hosts).and_return(nil)
        expect(helper.tileserver_hosts).to eq([])
      end
    end
    context 'when tileserver_hosts is an empty string' do
      it 'translates into an empty array' do
        allow(APP_CONFIG).to receive(:tileserver_hosts).and_return('')
        expect(helper.tileserver_hosts).to eq([])
      end
    end
    context 'when tileserver_hosts is an comma-separated list' do
      it 'translates to an array of host names' do
        allow(APP_CONFIG).to receive(:tileserver_hosts).and_return('tile1.example.com, tile2.example.com')
        expect(helper.tileserver_hosts).to eq(%w(tile1.example.com tile2.example.com))
      end
    end
  end
end
