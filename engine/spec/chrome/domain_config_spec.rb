require 'rails_helper'
require 'webmock/rspec'

describe Chrome::DomainConfig do
  let(:domain) { 'data.seattle.gov' }
  let(:site_chrome_config_vars) { JSON.parse(File.read('spec/fixtures/site_chrome_config_vars.json')).with_indifferent_access }
  let(:core_config) do
    JSON.parse(File.read('spec/fixtures/core_config.json')).with_indifferent_access.
      tap do |config|
        config['properties'].first['value']['versions']['0.1']['published'] = site_chrome_config_vars
      end
  end

  def stub_configurations(response = { status: 200, body: '[{ "stuff": true }]' })
    uri = "https://#{domain}/api/configurations.json?type=site_chrome&defaultOnly=true"
    stub_request(:get, uri).to_return(status: response[:status], body: response[:body])
  end

  describe '#site_chrome_config' do
    it 'raises RuntimeError if domain config is nil' do
      allow_any_instance_of(Chrome::DomainConfig).to receive(:config) { nil }
      expect { Chrome::DomainConfig.new(domain).site_chrome_config }.to raise_error(RuntimeError)
    end
  end

  describe '#get_domain_config' do
    it 'provides default site_chrome_config if cannot GET the domain configuration' do
      stub_configurations(status: 404, body: 'Page not found')
      configuration = Chrome::DomainConfig.new(domain).config
      expect(JSON.parse(Chrome::DomainConfig.new(nil).send(:default_configuration)).first).to eq(configuration)
    end

    it 'provides default site_chrome_config if domain configuration is an empty JSON array' do
      stub_configurations(status: 200, body: '[]')
      configuration = Chrome::DomainConfig.new(domain).config
      expect(JSON.parse(Chrome::DomainConfig.new(nil).send(:default_configuration)).first).to eq(configuration)
    end

    it 'provides default site_chrome_config if domain configuration is an empty string' do
      stub_configurations(status: 200, body: '')
      configuration = Chrome::DomainConfig.new(domain).config
      expect(JSON.parse(Chrome::DomainConfig.new(nil).send(:default_configuration)).first).to eq(configuration)
    end
  end

  describe '#domain_config_uri' do
    it 'returns the uri for a domain name' do
      stub_configurations
      uri = 'https://data.seattle.gov/api/configurations.json?type=site_chrome&defaultOnly=true'
      expect(Chrome::DomainConfig.new(domain).send(:domain_config_uri)).to eq(uri)
    end

    it 'returns a the uri for localhost' do
      localhost_uri = 'https://localhost/api/configurations.json?type=site_chrome&defaultOnly=true'
      stub_request(:get, localhost_uri).to_return(status: 200, body: '[{ "stuff": true }]')
      expect(Chrome::DomainConfig.new('localhost').send(:domain_config_uri)).to eq(localhost_uri)
    end
  end

  describe '#domain_with_scheme' do
    it 'adds "https://" to a uri without a scheme' do
      stub_configurations
      result = Chrome::DomainConfig.new(domain).send(:domain_with_scheme)
      expect(result).to eq('https://data.seattle.gov')
    end

    it 'does not add anything to a uri that already has a scheme' do
      stub_configurations
      result = Chrome::DomainConfig.new("https://#{domain}").send(:domain_with_scheme)
      expect(result).to eq('https://data.seattle.gov')
    end
  end

  describe '#newest_published_site_chrome' do
    it 'returns an empty hash if core_config does not have properties' do
      allow_any_instance_of(Chrome::DomainConfig).to receive(:get_domain_config) { {} }
      domain_config = Chrome::DomainConfig.new(domain)
      result = domain_config.send(:newest_published_site_chrome)
      expect(result).to eq({})
    end

    it 'returns the published config of the most recent version of the site chrome' do
      core_config_with_various_versions = core_config.clone
      core_config_with_various_versions['properties'].first['value']['versions'] =
        {
          '0.1' => {
            'draft' => { 'value' => 'x' },
            'published' => { 'value' => 'a' }
          },
          '23.8' => { # Ensure we are sorting by largest number, and not alpha
            'draft' => { 'value' => 'y' },
            'published' => { 'value' => 'b' }
          },
          '8.1' => {
            'draft' => { 'value' => 'z' },
            'published' => { 'value' => 'c' }
          }
        }
      allow_any_instance_of(Chrome::DomainConfig).to receive(:get_domain_config) { core_config_with_various_versions }
      result = Chrome::DomainConfig.new(domain).send(:newest_published_site_chrome)
      expect(result).to eq({ 'value' => 'b' })
    end
  end
end
