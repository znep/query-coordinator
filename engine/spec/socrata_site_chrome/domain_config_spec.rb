require 'rails_helper'

describe SocrataSiteChrome::DomainConfig do

  let(:domain) { 'data.seattle.gov' }
  let(:site_chrome_config) do
    JSON.parse(File.read('spec/fixtures/site_chrome_config.json')).with_indifferent_access
  end
  let(:helper) { SocrataSiteChrome::DomainConfig }
  let(:coreservice_uri) { Rails.application.config_for(:config)['coreservice_uri'] }
  let(:configurations_uri) do
    "#{coreservice_uri}/configurations.json?type=#{SocrataSiteChrome::DomainConfig::CONFIGURATION_TYPE}&defaultOnly=true"
  end
  let(:domains_uri) { "#{coreservice_uri}/domains/#{domain}.json" }

  describe '#site_chrome_config' do
    it 'raises RuntimeError if domain config is nil' do
      allow_any_instance_of(helper).to receive(:config) { nil }
      stub_domains
      expect { helper.new(domain).site_chrome_config }.to raise_error(RuntimeError)
    end
  end

  describe '#get_domain_config' do
    it 'provides default site_chrome_config if cannot GET the domain configuration' do
      stub_domains
      stub_configurations(status: 404, body: 'Page not found')
      configuration = helper.new(domain).config
      expect(helper.default_configuration.first).to eq(configuration)
    end

    it 'provides default site_chrome_config if domain configuration is an empty JSON array' do
      stub_domains
      stub_configurations(status: 200, body: '[]')
      configuration = helper.new(domain).config
      expect(helper.default_configuration.first).to eq(configuration)
    end

    it 'provides default site_chrome_config if domain configuration is an empty string' do
      stub_domains
      stub_configurations(status: 200, body: '')
      configuration = helper.new(domain).config
      expect(helper.default_configuration.first).to eq(configuration)
    end
  end

  describe '#domain_config_uri' do
    it 'returns the configurations_uri for a domain name' do
      stub_domains
      stub_configurations
      expect(helper.new(domain).send(:domain_config_uri)).to eq(configurations_uri)
    end

    context 'as localhost' do
      let(:domain) { 'localhost' }

      it 'returns the expected configurations_uri' do
        stub_domains
        stub_request(:get, configurations_uri).to_return(status: 200, body: '[{ "stuff": true }]')
        expect(helper.new(domain).send(:domain_config_uri)).to eq(configurations_uri)
      end
    end
  end

  describe 'config_updated_at' do
    it 'returns the expected timestamp' do
      allow(Time).to receive(:now).and_return(Time.at(1477332900))
      stub_domains
      subject = helper.new(domain)
      expect(subject.config_updated_at).to eq(1477332900)
    end

    it 'returns a quantized time instead of nil' do
      allow(Time).to receive(:now).and_return(Time.at(1477332900))
      stub_domains(status: 200, body: %Q({ "cname": "#{domain}" }))
      subject = helper.new(domain)
      expect(subject.config_updated_at).to eq(1477333200)
    end
  end

  describe '#current_site_chrome' do
    it 'returns an empty hash if site_chrome_config does not have properties' do
      allow_any_instance_of(helper).to receive(:get_domain_config) { {} }
      stub_domains
      domain_config = helper.new(domain)
      result = domain_config.send(:current_site_chrome)
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
      allow_any_instance_of(helper).to receive(:get_domain_config) { site_chrome_config_with_various_versions }
      stub_domains
      result = helper.new(domain).send(:current_site_chrome)
      expect(result).to eq({ 'value' => 'b' })
    end

    it 'dispatches an Airbrake notification when invalid site_chrome config is found' do
      site_chrome_config_with_various_versions = site_chrome_config.clone
      site_chrome_config_with_various_versions['properties'].first['value']['versions'] = nil
      allow_any_instance_of(helper).to receive(:get_domain_config) { site_chrome_config_with_various_versions }
      expect(Airbrake).to receive(:notify) do |hash|
        expect(hash[:error_class]).to eq('InvalidSiteChromeConfiguration')
        expect(hash[:error_message]).to match(/invalid site_chrome config/i)
      end
      stub_domains
      result = helper.new(domain).send(:current_site_chrome)
      expect(result).to eq({})
    end
  end

  describe '#latest_existing_version' do
    it 'returns the latest existing version of data' do
      test_site_chrome_config = site_chrome_config[:properties].first
      test_site_chrome_config[:value][:versions]['99.999'] = { 'test' => true }
      stub_domains
      result = helper.new(domain).send(:latest_existing_version, test_site_chrome_config)
      expect(result).to eq('99.999')
    end

    it 'returns nil if the config is an empty hash' do
      test_site_chrome_config = {}
      stub_domains
      result = helper.new(domain).send(:latest_existing_version, test_site_chrome_config)
      expect(result).to be_nil
    end

    it 'returns nil if the config is nil' do
      test_site_chrome_config = nil
      stub_domains
      result = helper.new(domain).send(:latest_existing_version, test_site_chrome_config)
      expect(result).to be_nil
    end
  end

  describe '#header_logo' do
    let(:site_chrome_config) do
      JSON.parse(File.read('spec/fixtures/site_chrome_config.json')).with_indifferent_access
    end

    describe 'Configuration Version 0.1' do
      it 'returns a logo from version 0.1' do
        dupped = site_chrome_config.deep_dup
        dupped[:properties][0][:value].merge!(:current_version => '0.1')
        config_with_changed_version = dupped.to_json

        stub_domains
        stub_configurations(status:200, body: "[#{config_with_changed_version}]")

        result = helper.new(domain).send(:header_logo)

        expect(result).to eql("src" => 'http://i.imgur.com/version0.1.png')
      end
    end

    describe 'Configuration Version 0.2' do
      it 'returns a logo from version 0.2' do
        dupped = site_chrome_config.deep_dup
        dupped[:properties][0][:value].merge!(:current_version => '0.2')
        config_with_changed_version = dupped.to_json

        stub_domains
        stub_configurations(status:200, body: "[#{config_with_changed_version}]")

        result = helper.new(domain).send(:header_logo)

        expect(result).to eql({ "src" => 'http://i.imgur.com/version0.2.png' })
      end
    end

    describe 'Configuration Version 0.3' do
      describe 'no header logo present in config' do
        let(:site_chrome_config) do
          File.read('spec/fixtures/site_chrome_config_no_header_logo.json')
        end

        it 'returns nil if no header logo is present' do
          stub_domains
          stub_configurations(status:200, body: "[#{site_chrome_config}]")

          result = helper.new(domain).send(:header_logo)

          expect(result).to be_nil
        end
      end

      describe 'just header logo src' do
        let(:site_chrome_config) do
          File.read('spec/fixtures/site_chrome_config.json')
        end

        it 'returns the url for the logo header if it is present' do
          stub_domains
          stub_configurations(status:200, body: "[#{site_chrome_config}]")

          result = helper.new(domain).send(:header_logo)

          expect(result).to eql(
            "src" => 'http://i.imgur.com/E8wtc6d.png'
          )
        end
      end

      describe 'header logo src and dimensions' do
        let(:site_chrome_config) do
          File.read('spec/fixtures/site_chrome_config_header_logo_height_width.json')
        end

        it 'returns the url and the height and width info for the header logo if it is present' do
          stub_domains
          stub_configurations(status:200, body: "[#{site_chrome_config}]")

          result = helper.new(domain).send(:header_logo)

          expect(result).to eql(
            "src" => 'http://i.imgur.com/E8wtc6d.png',
            "logo_height" => '50px',
            "logo_width" => '60px'
          )
        end
      end
    end
  end
end
