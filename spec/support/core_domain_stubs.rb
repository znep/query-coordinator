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
end

RSpec.configure do |config|
  config.include CoreDomainStubs
end
