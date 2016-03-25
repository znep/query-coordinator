require 'spec_helper'

describe Chrome::DomainConfig do
  let(:helper) { Chrome::DomainConfig }
  let(:domain) { 'data.seattle.gov' }
  let(:auth_cookie) { 'fake-cookie' }

  def stub_httparty(response = { status: 200, body: '{}' })
    uri = "https://#{domain}/api/configurations.json"
    stub_request(:get, uri).to_return(status: response[:status], body: response[:body])
  end

  it 'fails to initialize if HTTParty cannot GET the domain configuration' do
    stub_httparty(status: 404, body: 'Page not found')
    expect { helper.new(domain, auth_cookie) }.to raise_error('404: Page not found')
  end

  describe '#domain_with_scheme' do
    it 'adds "https://" to a uri without a scheme' do
      stub_httparty
      domain_config = helper.new(domain, auth_cookie)
      result = domain_config.send(:domain_with_scheme)
      expect(result).to eq('https://data.seattle.gov')
    end

    it 'does not add anything to a uri that already has a scheme' do
      stub_httparty
      domain_config = helper.new("https://#{domain}", auth_cookie)
      result = domain_config.send(:domain_with_scheme)
      expect(result).to eq('https://data.seattle.gov')
    end
  end

  describe '#header_html' do
    # TODO
  end

  describe '#footer_html' do
    # TODO
  end
end
