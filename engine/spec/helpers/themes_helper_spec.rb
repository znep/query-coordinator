require 'rails_helper'

describe Chrome::ThemesHelper do

  let(:site_chrome_config_vars) do
    JSON.parse(File.read('spec/fixtures/site_chrome_config_vars.json')).with_indifferent_access
  end

  let(:core_config) do
    JSON.parse(File.read('spec/fixtures/core_config.json')).with_indifferent_access.tap do |config|
      config['properties'].first['value']['versions']['0.1']['published'] = site_chrome_config_vars
    end
  end

  describe '#cache_key_for_site_chrome' do
    it 'returns nil if site_chrome is nil' do
      expect(helper.cache_key_for_site_chrome(nil)).to eq(nil)
    end

    it 'returns a cache key with the site_chrome updated_at timestamp' do
      allow_any_instance_of(Chrome::DomainConfig).to receive(:get_domain_config).and_return(core_config)
      site_chrome_config = Chrome::SiteChrome.new(Chrome::DomainConfig.new('data.seattle.gov').site_chrome_config)
      expect(helper.cache_key_for_site_chrome(site_chrome_config)).to eq('/config/custom-123546789')
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
