require 'rails_helper'
require 'webmock/rspec'

describe SocrataSiteChrome::DomainConfig do

  let(:domain) { 'data.seattle.gov' }
  let(:site_chrome_config) { JSON.parse(File.read('spec/fixtures/site_chrome_config.json')).with_indifferent_access }

  def stub_configurations(response = { status: 200, body: '[{ "stuff": true }]' })
    uri = "https://#{domain}/api/configurations.json?type=site_chrome&defaultOnly=true"
    stub_request(:get, uri).to_return(status: response[:status], body: response[:body])
  end

  describe '#site_chrome_config' do
    it 'raises RuntimeError if domain config is nil' do
      allow_any_instance_of(SocrataSiteChrome::DomainConfig).to receive(:config) { nil }
      expect { SocrataSiteChrome::DomainConfig.new(domain).site_chrome_config }.to raise_error(RuntimeError)
    end
  end

  describe '#get_domain_config' do
    it 'provides default site_chrome_config if cannot GET the domain configuration' do
      stub_configurations(status: 404, body: 'Page not found')
      configuration = SocrataSiteChrome::DomainConfig.new(domain).config
      expect(SocrataSiteChrome::DomainConfig.default_configuration.first).to eq(configuration)
    end

    it 'provides default site_chrome_config if domain configuration is an empty JSON array' do
      stub_configurations(status: 200, body: '[]')
      configuration = SocrataSiteChrome::DomainConfig.new(domain).config
      expect(SocrataSiteChrome::DomainConfig.default_configuration.first).to eq(configuration)
    end

    it 'provides default site_chrome_config if domain configuration is an empty string' do
      stub_configurations(status: 200, body: '')
      configuration = SocrataSiteChrome::DomainConfig.new(domain).config
      expect(SocrataSiteChrome::DomainConfig.default_configuration.first).to eq(configuration)
    end
  end

  describe '#domain_config_uri' do
    it 'returns the uri for a domain name' do
      stub_configurations
      uri = 'https://data.seattle.gov/api/configurations.json?type=site_chrome&defaultOnly=true'
      expect(SocrataSiteChrome::DomainConfig.new(domain).send(:domain_config_uri)).to eq(uri)
    end

    it 'returns a the uri for localhost' do
      localhost_uri = 'https://localhost/api/configurations.json?type=site_chrome&defaultOnly=true'
      stub_request(:get, localhost_uri).to_return(status: 200, body: '[{ "stuff": true }]')
      expect(SocrataSiteChrome::DomainConfig.new('localhost').send(:domain_config_uri)).to eq(localhost_uri)
    end
  end

  describe '#domain_with_scheme' do
    it 'adds "https://" to a uri without a scheme' do
      stub_configurations
      result = SocrataSiteChrome::DomainConfig.new(domain).send(:domain_with_scheme)
      expect(result).to eq('https://data.seattle.gov')
    end

    it 'does not add anything to a uri that already has a scheme' do
      stub_configurations
      result = SocrataSiteChrome::DomainConfig.new("https://#{domain}").send(:domain_with_scheme)
      expect(result).to eq('https://data.seattle.gov')
    end
  end

  describe '#current_published_site_chrome' do
    it 'returns an empty hash if site_chrome_config does not have properties' do
      allow_any_instance_of(SocrataSiteChrome::DomainConfig).to receive(:get_domain_config) { {} }
      domain_config = SocrataSiteChrome::DomainConfig.new(domain)
      result = domain_config.send(:current_published_site_chrome)
      expect(result).to eq({})
    end

    it 'returns the published config of the most recent version of the site chrome' do
      site_chrome_config_with_various_versions = site_chrome_config.clone
      site_chrome_config_with_various_versions['properties'].first['value']['versions'] =
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
      site_chrome_config_with_various_versions['properties'].first['value']['current_version'] = nil
      allow_any_instance_of(SocrataSiteChrome::DomainConfig).to receive(:get_domain_config) { site_chrome_config_with_various_versions }
      result = SocrataSiteChrome::DomainConfig.new(domain).send(:current_published_site_chrome)
      expect(result).to eq({ 'value' => 'b' })
    end

    it 'dispatches an Airbrake notification when invalid site_chrome config is found' do
      site_chrome_config_with_various_versions = site_chrome_config.clone
      site_chrome_config_with_various_versions['properties'].first['value']['versions'] = nil
      allow_any_instance_of(SocrataSiteChrome::DomainConfig).to receive(:get_domain_config) { site_chrome_config_with_various_versions }
      expect(Airbrake).to receive(:notify) do |hash|
        expect(hash[:error_class]).to eq('InvalidSiteChromeConfiguration')
        expect(hash[:error_message]).to match(/invalid site_chrome config/i)
      end
      result = SocrataSiteChrome::DomainConfig.new(domain).send(:current_published_site_chrome)
      expect(result).to eq({})
    end
  end

  describe '#latest_existing_version' do
    it 'returns the latest existing version of data' do
      test_site_chrome_config = site_chrome_config[:properties].first
      test_site_chrome_config[:value][:versions]['99.999'] = { 'test' => true }
      result = SocrataSiteChrome::DomainConfig.new(domain).send(:latest_existing_version, test_site_chrome_config)
      expect(result).to eq('99.999')
    end
  end

end
