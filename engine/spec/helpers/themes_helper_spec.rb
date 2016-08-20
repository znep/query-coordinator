require 'rails_helper'

describe SocrataSiteChrome::ThemesHelper do

  let(:site_chrome_config) do
    JSON.parse(File.read('spec/fixtures/site_chrome_config.json')).with_indifferent_access
  end
  let(:site_chrome_content) do
    site_chrome_config['properties'].first.dig('value', 'versions', SiteChrome::LATEST_VERSION, 'published')
  end

  describe '#cache_key_for_site_chrome' do

    context 'with the request parameters' do
      let(:mock_request) { OpenStruct.new(:params => {'1462907761' => ''}) }

      it 'returns SocrataSiteChrome::VERSION if site_chrome is nil' do
        expect(helper.cache_key_for_site_chrome(nil, mock_request)).to eq("/config/custom-#{SocrataSiteChrome::VERSION}-1462907761")
      end

      it 'returns a cache key with the site_chrome updated_at timestamp' do
        allow_any_instance_of(SocrataSiteChrome::DomainConfig).to receive(:get_domain_config).and_return(site_chrome_config)
        domain_site_chrome_config = SocrataSiteChrome::SiteChrome.new(SocrataSiteChrome::DomainConfig.new('data.seattle.gov').site_chrome_config)
        expect(helper.cache_key_for_site_chrome(domain_site_chrome_config, mock_request)).to eq('/config/custom-1462907760-1462907761')
      end
    end

    context 'without request parameters' do
      let(:mock_request) { OpenStruct.new }

      it 'returns SocrataSiteChrome::VERSION if site_chrome is nil' do
        expect(helper.cache_key_for_site_chrome(nil, mock_request)).to eq("/config/custom-#{SocrataSiteChrome::VERSION}")
      end

      it 'returns a cache key with the site_chrome updated_at timestamp' do
        allow_any_instance_of(SocrataSiteChrome::DomainConfig).to receive(:get_domain_config).and_return(site_chrome_config)
        domain_site_chrome_config = SocrataSiteChrome::SiteChrome.new(SocrataSiteChrome::DomainConfig.new('data.seattle.gov').site_chrome_config)
        expect(helper.cache_key_for_site_chrome(domain_site_chrome_config, mock_request)).to eq('/config/custom-1462907760')
      end
    end

  end

  describe '#theme_variable_key' do
    it 'prefixes the theme section to non-general sections' do
      result = helper.theme_variable_key('header', 'fg_color')
      expect(result).to eq('header_fg_color')
    end

    it 'does not prefix the theme section to general sections' do
      result = helper.theme_variable_key('general', 'bg_color')
      expect(result).to eq('bg_color')
    end
  end

  describe '#theme_value' do
    it 'returns the theme value' do
      result = helper.theme_value('fg_color', 'red')
      expect(result).to eq('red')
    end

    it 'wraps font_family theme value in strings' do
      result = helper.theme_value('font_family', 'Comic Sans')
      expect(result).to eq('"Comic Sans"')
    end

  end

end
