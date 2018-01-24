require 'rails_helper'

describe Administration::ConnectorController do
  include TestHelperMethods

  before do
    init_environment
    init_current_user(subject)
    stub_site_chrome
    stub_feature_flags_with(:enable_catalog_federator_connector => true)
  end

  context 'when user does not have USE_DATA_CONNECTORS right' do
    it 'returns a 403 response' do
      VCR.use_cassette('administration/connector_controller', :record => :new_episodes) do
        get :connectors
        expect(response).to have_http_status(403)
      end
    end
  end

  context 'when user has the appropriate rights' do
    let(:server_id) { '1' }
    let(:server) { OpenStruct.new(:id => server_id) }
    let(:datasets) do
      [
        {'externalId' => 'http://some.url.com', 'name' => 'dataset_1'},
        {'externalId' => 'http://another.url.com', 'name' => 'dataset_2'},
        {'externalId' => 'http://yet.another.url.com', 'name' => 'dataset_3'},
      ]
    end

    before do
      allow(subject)
        .to receive(:check_auth_levels_all)
        .with([UserRights::USE_DATA_CONNECTORS, UserRights::CREATE_DATASETS, UserRights::EDIT_OTHERS_DATASETS])
        .and_return(true)
    end

    context 'when connection type is connect all assets' do
      let(:selection_diff) do
        {
          :addedSelections => ['http://some.url.com', 'http://another.url.com', 'http://yet.another.url.com'],
          :removedSelections => []
        }
      end
      let(:sync_policy) { 'all' }

      it 'should set the selection strategy to sync' do
        expect(CatalogFederatorConnector).to receive(:servers).at_least(:once).and_return([server])
        expect(CatalogFederator.client).to receive(:get_datasets).with(server_id).and_return(datasets)
        expect(CatalogFederator.client).to receive(:set_sync_policy).with(server_id, sync_policy)
        expect(CatalogFederator.client).to receive(:sync_source).with(server_id)
        post :update_connector, :server_id => server_id, :type => 'catalog_federator', :server => {
          :sync_policy => sync_policy
        }
      end
    end

    context 'when connection type is a subset of assets' do
      let(:selection_diff) do
        {
          :addedSelections => ['http://another.url.com'],
          :removedSelections => ['http://some.url.com', 'http://yet.another.url.com']
        }
      end
      let(:selected_asset_indices) { [1] } # The middle dataset index
      let(:sync_policy) { 'existing' }

      it 'should set the selection strategy to make-it-so' do
        expect(CatalogFederatorConnector).to receive(:servers).at_least(:once).and_return([server])
        expect(CatalogFederator.client).to receive(:get_datasets).with(server_id).and_return(datasets)
        expect(CatalogFederator.client).to receive(:set_sync_policy).with(server_id, sync_policy)
        expect(CatalogFederator.client).to receive(:sync_datasets).with(server_id, selection_diff)
        post :update_connector, :server_id => server_id, :type => 'catalog_federator', :server => {
          :sync_policy => sync_policy,
          :assets => selected_asset_indices
        }
      end
    end

  end

end
