module ConfigurationStubs
  def stub_configurations_request
    stub_request(:get, "http://localhost:8080/configurations.json?defaultOnly=true&type=feature_set").
      with(:headers => {'Content-Type'=>'application/json', 'X-Socrata-Host'=>'example.com'}).
      to_return(:status => 200, :body => "[{}]", :headers => {})
  end
end

RSpec.configure do |config|
  config.include ConfigurationStubs
end
