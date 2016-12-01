require 'rails_helper'

describe SocrataSiteChrome::Middleware do
  let(:app) { lambda { |env| [200, {'Content-Type' => 'text/plain'}, ['OK']] } }
  let(:middleware) { SocrataSiteChrome::Middleware.new(app) }
  let(:request) { Rack::MockRequest.new(middleware).tap { |request| allow(request).to receive(:env).and_return({}) } }

  it 'adds a SocrataSiteChrome::Middleware instance do env', :verify_stubs => false do
    middleware.call(request.env)
    expect(request.env[SocrataSiteChrome::Middleware::SOCRATA_SITE_CHROME_ENV_KEY]).to_not be_nil
  end

  it 'uses the test configuration to instantiate the Site Chrome instance', :verify_stubs => false do
    middleware.call(request.env)
    expect(request.env[SocrataSiteChrome::Middleware::SOCRATA_SITE_CHROME_ENV_KEY].socrata_site_chrome(request.env).to_json).to eq(
      SocrataSiteChrome::SiteChrome.new(SocrataSiteChrome::DomainConfig.site_chrome_test_configuration).to_json
    )
  end
end
