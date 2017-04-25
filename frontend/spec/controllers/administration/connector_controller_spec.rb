require 'rails_helper'

describe Administration::ConnectorController do
  include TestHelperMethods

  before do
    init_current_domain
    init_current_user(subject)
    stub_site_chrome
  end

  context 'when user does not have USE_DATA_CONNECTORS right' do
    it 'returns a 403 response' do
      VCR.use_cassette('administration/connector_controller', :record => :new_episodes) do
        get :connectors
        expect(response).to have_http_status(403)
      end
    end
  end
end
