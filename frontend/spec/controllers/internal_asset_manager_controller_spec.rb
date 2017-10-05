require 'rails_helper'

describe InternalAssetManagerController do
  include TestHelperMethods

  describe 'show' do

    describe 'when not logged in' do
      before do
        init_current_domain
        init_feature_flag_signaller
        init_environment
        logout
      end

      it 'should require current_user' do
        get :show

        expect(response).to have_http_status(:redirect)
      end
    end

    describe 'when logged in as a roled user' do
      before do
        init_current_domain
        init_feature_flag_signaller
        init_environment
        login(init_current_user(subject, 'tugg-ikce'))
        user_double = double(User)
        expect(user_double).to receive(:is_superadmin?).and_return(true)
        allow(user_double).to receive(:is_roled_user?).and_return(true)
        allow(user_double).to receive(:has_right?).
          with(UserRights::CAN_SEE_ALL_ASSETS_TAB_SIAM).and_return(true)
        allow(subject).to receive(:current_user).and_return(user_double)
      end

      it 'should render show' do
        expect(AssetInventoryService::InternalAssetManager).to receive(:find)

        cetera_user_search_client_double = double(Cetera::UserSearch)
        expect(cetera_user_search_client_double).to receive(:find_all_owners).and_return('results' => [])
        expect(Cetera::Utils).to receive(:user_search_client).and_return(cetera_user_search_client_double)

        cetera_facet_search_client_double = double(Cetera::FacetSearch)
        expect(cetera_facet_search_client_double).to receive(:get_categories_of_views).
          and_return('results' => [])
        expect(cetera_facet_search_client_double).to receive(:get_tags_of_views).
          and_return('results' => [])
        expect(Cetera::Utils).to receive(:facet_search_client).
          and_return(cetera_facet_search_client_double).exactly(2).times

        expect(Cetera::Utils).to receive(:get_asset_counts).and_return('results' => [])

        get :show

        expect(response).to have_http_status(:success)
      end
    end

    describe 'when logged in as a non-roled user' do
      before do
        init_current_domain
        init_feature_flag_signaller
        init_environment(test_user: TestHelperMethods::NON_ROLED)
        login(init_current_user(subject, 'tugg-ikce'))
        user_double = double(User)
        allow(user_double).to receive(:has_right?).
          with(UserRights::CAN_SEE_ALL_ASSETS_TAB_SIAM).and_return(false)
        expect(user_double).to receive(:is_superadmin?).and_return(false)
        expect(user_double).to receive(:is_roled_user?).and_return(false)
        allow(subject).to receive(:current_user).and_return(user_double)
      end

      it 'should render permission denied' do
        get :show

        expect(response).to have_http_status(403)
      end
    end

  end
end
