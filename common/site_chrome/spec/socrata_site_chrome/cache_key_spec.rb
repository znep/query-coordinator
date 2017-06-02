require 'rails_helper'

describe SocrataSiteChrome::CacheKey do
  let(:helper) { SocrataSiteChrome::CacheKey }
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

    result = helper.new(domain_config, config_type).to_s

    expect(result).to eq('frontend:deadbeef:domain:data.michigan.gov:1477076931:configurations:site_chrome')
  end

  it 'returns the feature_set cache key' do
    domain_config = SocrataSiteChrome::DomainConfig.new(domain)
    config_type = 'feature_set'

    result = helper.new(domain_config, config_type).to_s

    expect(result).to eq('frontend:deadbeef:domain:data.michigan.gov:1477076931:configurations:feature_set')
  end

  it 'raises if domain_config is invalid' do
    expect { helper.new(nil, 'feature_set').to_s }.
      to raise_error(ArgumentError)

    invalid_domain_config = OpenStruct.new(
      :request_config => nil,
      :cname => 'test.com',
      :config_updated_at => Time.now
    )
    expect { helper.new(invalid_domain_config, 'feature_set').to_s }.
      to raise_error(ArgumentError)
  end

  it 'raises if config_type is invalid' do
    domain_config = SocrataSiteChrome::DomainConfig.new(domain)
    expect { helper.new(domain_config, nil).to_s }.
      to raise_error(ArgumentError)
  end
end
