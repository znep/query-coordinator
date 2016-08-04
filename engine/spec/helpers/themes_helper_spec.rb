require 'rails_helper'

describe SocrataSiteChrome::ThemesHelper do

  let(:site_chrome_config) do
    JSON.parse(File.read('spec/fixtures/site_chrome_config.json')).with_indifferent_access
  end
  let(:site_chrome_content) do
    site_chrome_config['properties'].first.dig('value', 'versions', SiteChrome::LATEST_VERSION, 'published')
  end

  describe '#cache_key_for_site_chrome' do
    it 'returns nil if site_chrome is nil' do
      expect(helper.cache_key_for_site_chrome(nil)).to eq(nil)
    end

    it 'returns a cache key with the site_chrome updated_at timestamp' do
      allow_any_instance_of(SocrataSiteChrome::DomainConfig).to receive(:get_domain_config).and_return(site_chrome_config)
      domain_site_chrome_config = SocrataSiteChrome::SiteChrome.new(SocrataSiteChrome::DomainConfig.new('data.seattle.gov').site_chrome_config)
      expect(helper.cache_key_for_site_chrome(domain_site_chrome_config)).to eq('/config/custom-1462907760')
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

  describe '#exclude_styleguide?', verify_stubs: false do
    it 'returns true if SocrataSiteChrome::Engine.config.styleguide is false' do
      allow(SocrataSiteChrome::Engine.config).to receive(:styleguide).and_return(false)
      expect(helper.exclude_styleguide?).to eq(true)
    end

    it 'returns false if SocrataSiteChrome::Engine.config.styleguide is true' do
      allow(SocrataSiteChrome::Engine.config).to receive(:styleguide).and_return(true)
      expect(helper.exclude_styleguide?).to eq(false)
    end

    it 'returns false if SocrataSiteChrome::Engine.config.styleguide is not set' do
      allow(SocrataSiteChrome::Engine.config).to receive(:styleguide).and_return(nil)
      expect(helper.exclude_styleguide?).to eq(false)
    end
  end

end
