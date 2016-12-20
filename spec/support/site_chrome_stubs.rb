module SiteChromeStubs
  include SocrataSiteChrome::Test::Helpers

  def stub_site_chrome
    stub_site_chrome_instance # SocrataSiteChrome::Test::Helpers

    stub_request(:get, 'http://localhost:8080/configurations.json?defaultOnly=true&type=site_chrome').
      with(:headers => {'X-Socrata-Host'=>'test.host'}).
      to_return(:status => 200, :body => '[{}]', :headers => {})
  end
end

RSpec.configure do |config|
  config.include SiteChromeStubs
end

