module CoreDomainStubs
  def mock_domain
    {
      'id' => 1,
      'name' => 'Test Domain',
      'cname' => 'example.com'
    }
  end

  def stub_current_domain
    allow(CoreServer).to receive(:current_domain).and_return(mock_domain)

    # also stub any requests to get the domain's locale
    allow_any_instance_of(SocrataSiteChrome::LocaleConfig).to receive(:get_locale_config).
      and_return({ 'default_locale' => :en })
  end

  def stub_domains_request
    stub_request(:get, 'http://localhost:8080/domains/example.com.json').
      with(:headers => {'X-Socrata-Host'=>'example.com'}).
      to_return(
        :status => 200,
        :body => '{"id": "four-four", "cname": "example.com", "configUpdatedAt": 1477332982}',
        :headers => {}
      )
  end

end

RSpec.configure do |config|
  config.include CoreDomainStubs
end
