module SiteChromeStubs
  def stub_site_chrome
    @request.env[SocrataSiteChrome::Middleware::SOCRATA_SITE_CHROME_ENV_KEY] = SocrataSiteChrome::Middleware.new(@app)
    stub_request(:get, 'http://localhost:8080/configurations.json?defaultOnly=true&type=site_chrome').
      with(:headers => {'X-Socrata-Host'=>'test.host'}).
      to_return(:status => 200, :body => '[{}]', :headers => {})
  end
end

RSpec.configure do |config|
  config.include SiteChromeStubs
end

