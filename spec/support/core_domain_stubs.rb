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
  end

  def stub_domains_request
    stub_request(:get, 'http://localhost:8080/domains/test.host.json').
      with(:headers => {'X-Socrata-Host'=>'test.host'}).
      to_return(
        :status => 200,
        :body => '{"id": "four-four", "cname": "test.host", "configsLastUpdatedAt": 1477332982}',
        :headers => {}
      )
  end

end

RSpec.configure do |config|
  config.include CoreDomainStubs
end
