require 'rails_helper'

describe SocrataSiteChrome::ThemesHelper do

  let(:domain) { 'data.seattle.gov' }
  let(:domains_uri) { "#{coreservice_uri}/domains/#{domain}.json" }
  let(:coreservice_uri) { Rails.application.config_for(:config)['coreservice_uri'] }

  describe '#cache_key_for_site_chrome' do

    let(:domain) { 'test.host' }

    before do
      allow(Time).to receive(:now).and_return(1477415059)
      stub_domains
    end

    it 'returns a cache key with the cache_key_prefix and site_chrome updated_at timestamp' do
      expect(helper.cache_key_for_site_chrome).to eq("frontend:deadbeef:domain:#{domain}:1477415059:configurations:site_chrome:custom.css")
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
