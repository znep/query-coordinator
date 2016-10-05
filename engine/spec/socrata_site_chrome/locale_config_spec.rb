require 'rails_helper'
require 'webmock/rspec'

describe SocrataSiteChrome::LocaleConfig do

  let(:domain) { 'data.seattle.gov' }
  let(:coreservice_uri) { Rails.application.config_for(:config)['coreservice_uri'] }
  let(:uri) { "#{coreservice_uri}/configurations.json?type=locales&defaultOnly=true" }
  let(:helper) { SocrataSiteChrome::LocaleConfig }

  def stub_locale_config(response = { :status => 200, :body => '[]' })
    stub_request(:get, uri).to_return(:status => response[:status], :body => response[:body])
    ::RequestStore.store[:site_chrome_locale_config] = nil
  end

  describe '#get_locale_config' do
    it 'returns the default locale config if it cannot GET locale data' do
      stub_locale_config(:status => 404, :body => nil)
      locale_config = helper.new(domain).get_locale_config

      expect(locale_config).to eq(helper.default_configuration)
    end

    it 'returns the default locale config if the response body doesn\'t contain the correct keys' do
      stub_locale_config(:status => 200, :body =>
        '[ {"properties": [ { "name": "blah", "value": "batman" }, { "name": "asdf", "value": ["1234"] } ] } ]'
      )
      locale_config = helper.new(domain).get_locale_config

      expect(locale_config).to eq(helper.default_configuration)
    end

    it 'returns a hash representation of the current and available locales' do
      stub_locale_config(:status => 200, :body =>
        '[ {"properties": [ { "name": "*", "value": "es" }, { "name": "available_locales", "value": ["en", "es"] } ] } ]'
      )
      locale_config = helper.new(domain).get_locale_config

      expect(locale_config).not_to eq(helper.default_configuration)
      expect(locale_config[:default_locale]).to eq('es')
      expect(locale_config[:available_locales]).to match_array(['en', 'es'])
    end
  end

  describe '#get_locale_hash' do
    def locale_config_hash
      { 'properties' => [] }
    end

    def test_default_locale
      { 'name' => '*', 'value' => 'es' }
    end

    def test_available_locales
      { 'name' => 'available_locales', 'value' => ['en', 'es'] }
    end

    it 'returns an empty hash if the config is nil' do
      result = helper.new(domain).send(:get_locale_hash, nil)
      expect(result).to eq({})
    end

    it 'returns an empty hash if the config is an empty hash' do
      result = helper.new(domain).send(:get_locale_hash, {})
      expect(result).to eq({})
    end

    it 'returns a hash with a specific default_locale if the config contains default_locale' do
      config = locale_config_hash.tap { |h| h['properties'].push(test_default_locale) }
      result = helper.new(domain).send(:get_locale_hash, config)
      expect(result).to eq(:default_locale => 'es')
    end

    it 'returns a hash with specific available_locales if the config contains available_locales' do
      config = locale_config_hash.tap { |h| h['properties'].push(test_available_locales) }
      result = helper.new(domain).send(:get_locale_hash, config)
      expect(result).to eq(:available_locales => ['en', 'es'])
    end

    it 'returns a hash with default and available locales if the config contains both' do
      config = locale_config_hash.tap do |h|
        h['properties'].push(test_default_locale, test_available_locales)
      end
      result = helper.new(domain).send(:get_locale_hash, config)
      expect(result).to eq(:default_locale => 'es', :available_locales => ['en', 'es'])
    end
  end
end
