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

  context 'when user has USE_DATA_CONNECTORS right' do
    before do
      allow(subject).to receive(:check_auth_level).with(UserRights::USE_DATA_CONNECTORS).and_return(true)
    end

    context 'when connector services are unavailable' do
      context 'when both esri and catalog federator are enabled' do
        it 'displays both error messages' do
          VCR.use_cassette('administration/connector_controller', :record => :new_episodes) do
            get :connectors
            expect(response).to have_http_status(:success)
            expect(flash[:warning].length).to eq(2)
            expect(flash[:warning]).to include('Esri connector services are currently unavailable.')
            expect(flash[:warning]).to include('Catalog federator services are currently unavailable.')
          end
        end
      end

      context 'when only esri is enabled' do
        before do
          allow(subject).to receive(:check_feature_flag).with('enable_catalog_federator_connector').and_return(false)
          allow(subject).to receive(:check_feature_flag).with('enable_catalog_connector').and_return(true)
        end

        it 'displays only the esri error message' do
          VCR.use_cassette('administration/connector_controller', :record => :new_episodes) do
            get :connectors
            expect(response).to have_http_status(:success)
            expect(flash[:warning].length).to eq(1)
            expect(flash[:warning]).to include('Esri connector services are currently unavailable.')
          end
        end
      end

      context 'when only catalog federator is enabled' do
        before do
          allow(subject).to receive(:check_feature_flag).with('enable_catalog_federator_connector').and_return(true)
          allow(subject).to receive(:check_feature_flag).with('enable_catalog_connector').and_return(false)
        end

        it 'displays only the esri error message' do
          VCR.use_cassette('administration/connector_controller', :record => :new_episodes) do
            get :connectors
            expect(response).to have_http_status(:success)
            expect(flash[:warning].length).to eq(1)
            expect(flash[:warning]).to include('Catalog federator services are currently unavailable.')
          end
        end
      end
    end
  end
end
