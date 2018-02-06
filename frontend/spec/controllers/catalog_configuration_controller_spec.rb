require 'rails_helper'

describe Administration::CatalogConfigurationsController do
  include TestHelperMethods

  before do
    init_environment # stubs superadmin by default, sets @stubbed_user
    # Adding the line below to the init_environment method, causes a whole bunch of tests blow up. :sadpanda:
    allow(controller).to receive(:current_user).and_return(@stubbed_user)
  end

  describe 'get /edit' do
    it 'shows editable catalog configuration' do
      VCR.use_cassette('catalog configuration') do
        expect(assigns(:catalog_configuration))
        get :edit
        expect(response).to have_http_status(:ok)
      end
    end
  end

  describe 'put /update' do
    context 'showing community assets in the catalog' do
      it 'updates the catalog configuration properly' do
        VCR.use_cassette('catalog configuration') do
          expect(assigns(:catalog_configuration))
          expect_any_instance_of(::Configuration).to receive(:create_or_update_property).
            with('community_assets_hidden_from_catalog', false)
          put :update, 'community_assets_hidden_from_catalog' => 'false'
          expect(response).to have_http_status(:redirect)
          expect(flash[:notice]).to include('updated to Show community')
        end
      end
    end

    context 'error raised by core' do
      it 'updates the catalog configuration properly' do
        VCR.use_cassette('catalog configuration') do
          expect_any_instance_of(::Configuration).to receive(:create_or_update_property).
            with('community_assets_hidden_from_catalog', false).and_raise(
              CoreServer::CoreServerError.new('/admin/catalog_configuration', 500, nil, nil)
            )
          put :update, 'community_assets_hidden_from_catalog' => 'false'
          expect(response).to have_http_status(:redirect)
          expect(flash[:error]).to include('An error occurred')
        end
      end
    end

    context 'hiding community assets from the catalog' do
      it 'updates the catalog configuration properly' do
        VCR.use_cassette('catalog configuration') do
          expect(assigns(:catalog_configuration))
          expect_any_instance_of(::Configuration).to receive(:create_or_update_property).
            with('community_assets_hidden_from_catalog', true)
          put :update, 'community_assets_hidden_from_catalog' => 'true'
          expect(response).to have_http_status(:redirect)
          expect(flash[:notice]).to include('updated to Hide community')
        end
      end
    end
  end

end
