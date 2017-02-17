require 'rails_helper'

describe SocrataSiteChrome::CacheKey do
  let(:helper) { SocrataSiteChrome::CacheKey }

  describe '.cache_key_string' do

    let(:domain) { 'data.michigan.gov' }
    let(:domains_uri) { "#{coreservice_uri}/domains/#{domain}.json" }
    let(:coreservice_uri) { Rails.application.config_for(:config)['coreservice_uri'] }

    before do
      allow(Time).to receive(:now).and_return('1477076931')
      stub_domains
    end

    it 'returns the site_chrome cache key' do
      domain_config = SocrataSiteChrome::DomainConfig.new(domain)
      config_type = 'site_chrome'

      result = helper.cache_key_string(domain_config, config_type)

      expect(result).to eq('frontend:deadbeef:domain:data.michigan.gov:1477076931:configurations:site_chrome')
    end

    it 'returns the feature_set cache key' do
      domain_config = SocrataSiteChrome::DomainConfig.new(domain)
      config_type = 'feature_set'

      result = helper.cache_key_string(domain_config, config_type)

      expect(result).to eq('frontend:deadbeef:domain:data.michigan.gov:1477076931:configurations:feature_set')
    end
  end
end
