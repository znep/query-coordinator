require 'rails_helper'

describe SocrataSiteChrome::Middleware do
  let(:app) { lambda {|env| [200, {'Content-Type' => 'text/plain'}, ['OK']]} }
  let(:stack) { SocrataSiteChrome::Middleware.new(app) }
  let(:request) { Rack::MockRequest.new(stack) }

  it 'adds a Site Chrome instance on Rails.application.config.socrata_site_chrome' do
    response = request.get('/')
    expect(Rails.application.config.respond_to?(:socrata_site_chrome)).to eq(true)
  end

  it 'uses the test configuration to instantiate the Site Chrome instance' do
    response = request.get('/')
    expect(Rails.application.config.socrata_site_chrome.to_json).to eq(
      SocrataSiteChrome::SiteChrome.new(SocrataSiteChrome::DomainConfig.site_chrome_test_configuration).to_json
    )
  end
end
