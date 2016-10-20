require 'rails_helper'
require 'test_helper_methods'

describe CoreServer::Connection do
  include TestHelperMethods

  before do
    init_current_domain
    init_current_user(
      ApplicationController.new.tap do |controller|
        session_double = double
        allow(session_double).to receive(:[]=)
        controller.request = ActionDispatch::Request.new(ENV)
        controller.response = ActionDispatch::Response.new
        allow(controller).to receive(:session).and_return(session_double)
      end
    )
  end

  it 'does not send the entire Core HTTP response to Airbrake' do
    VCR.use_cassette('core_error_page_response') do
      expect(Airbrake).to receive(:notify).with(
        :error_class => 'JSON Parser',
        :error_message => "Parse error: 784: unexpected token at '" <<
          "<html><body><h1>503 Service Unavailable</h1>\n" <<
          "No server is available to handle this request.\n</body></html>\n'",
        :session => {
          :current_domain => 'localhost',
          :current_user_id => 'test-test'
        },
        :parameters => {
          :request => {
            :path => '/views/8hbj-mt5f.json',
            :method => 'GET',
            :body => nil
          }
        }
      )
      expect do
        CoreServer::Connection.new.get_request('/views/8hbj-mt5f.json', 'X-Socrata-Host' => 'localhost')
      end.to raise_error(JSON::ParserError)
    end
  end

end

