require 'rails_helper'
require_relative '../../test/test_helper'

describe AdministrationController do
  include TestHelperMethods

  describe 'georegions' do
    before(:each) do
      init_current_user(controller)
      allow_any_instance_of(ApplicationController).to receive(:default_url_options).and_return({})
      allow_any_instance_of(ApplicationController).to receive(:sync_logged_in_cookie)
      allow_any_instance_of(ApplicationController).to receive(:set_user)
      allow_any_instance_of(ApplicationController).to receive(:set_meta)
      allow_any_instance_of(ApplicationHelper).to receive(:feature_flag?).and_return(true)
      strings = Hashie::Mash.new
      strings.site_title = 'My Site'
      allow(CurrentDomain).to receive(:strings).and_return(strings)
    end

    describe 'GET /admin/geo' do

      describe 'not logged in' do
        before(:each) do
          allow_any_instance_of(UserAuthMethods).to receive(:current_user_session).and_return(nil)
          allow_any_instance_of(UserAuthMethods).to receive(:current_user).and_return(nil)
        end

        it 'should redirect to login page' do
          get :georegions
          expect(response).to redirect_to(:login)
        end
      end

      describe 'not admin user' do
        it 'should be forbidden' do
          get :georegions
          expect(response).to have_http_status(:forbidden)
        end
      end

      describe 'logged in' do
        before(:each) do
          user_double = double(User)
          allow(user_double).to receive(:has_right?).and_return(true)
          allow_any_instance_of(UserAuthMethods).to receive(:current_user).and_return(user_double)
        end

        it 'responds successfully with a 200 HTTP status code' do
          curated_region = build(:curated_region)
          allow(CuratedRegion).to receive(:find).and_return([curated_region])
          get :georegions
          expect(response).to be_success
          expect(response).to have_http_status(200)
        end

        it 'renders the administration/georegions template' do
          curated_region = build(:curated_region)
          allow(CuratedRegion).to receive(:find).and_return([curated_region])
          get :georegions
          expect(response).to render_template('administration/georegions')
        end

        it 'loads template data into @georegions' do
          allow(CuratedRegion).to receive(:find).and_return([
                build(:curated_region),
                build(:curated_region, :enabled),
                build(:curated_region, :default)
              ])

          get :georegions
          view_model = assigns(:view_model)
          expect(view_model.available_count).to eq(3)
          expect(view_model.enabled_count).to eq(1)
          expect(view_model.custom_regions).to contain_exactly(an_instance_of(CuratedRegion), an_instance_of(CuratedRegion))
          expect(view_model.default_regions).to contain_exactly(an_instance_of(CuratedRegion))
          expect(view_model.translations).to be_an_instance_of(LocalePart)
        end

      end

    end

    describe 'POST /admin/geo' do
      let(:curated_region_double) { double(CuratedRegion, :id => 1) }

      before(:each) do
        user_double = double(User)
        allow(user_double).to receive(:has_right?).and_return(true)
        allow_any_instance_of(UserAuthMethods).to receive(:current_user).and_return(user_double)
      end

      it 'redirects to /admin/geo' do
        allow_any_instance_of(::Services::Administration::GeoregionAdder).to receive(:add).and_return(nil)
        post :add_georegion
        expect(response).to redirect_to('/admin/geo')
      end

      it 'calls add on the georegion adder service' do
        expect_any_instance_of(::Services::Administration::GeoregionAdder).to receive(:add).and_return(curated_region_double)
        post :add_georegion, :format => :json
      end

      it 'returns an error response if GeoregionAdder.add returns nil' do
        allow_any_instance_of(::Services::Administration::GeoregionAdder).to receive(:add).and_return(nil)
        post :add_georegion, :format => :json
        expect(JSON.parse(response.body)).to include('error' => true)
      end

      it 'returns a success response when successful' do
        allow_any_instance_of(::Services::Administration::GeoregionAdder).to receive(:add).and_return(curated_region_double)
        post :add_georegion, :format => :json
        expect(JSON.parse(response.body)).to include('success' => true)
      end

      it 'returns the curated region info when successful' do
        response_hash = {
          'id' => 1,
          'name' => 'Georegion Name',
          'enabledFlag' => true
        }
        allow_any_instance_of(::Services::Administration::GeoregionAdder).to receive(:add).and_return(response_hash)
        post :add_georegion, :format => :json
        expect(JSON.parse(response.body)).to include(
            'message' => response_hash
          )
      end
    end

    describe 'PUT /admin/geo/:id' do
      before(:each) do
        user_double = double(User)
        allow(user_double).to receive(:has_right?).and_return(true)
        allow_any_instance_of(UserAuthMethods).to receive(:current_user).and_return(user_double)
      end

      it 'redirects to /admin/geo' do
        put :edit_georegion, :id => 1
        expect(response).to redirect_to('/admin/geo')
      end
    end

    describe 'DELETE /admin/geo/:id' do
      before(:each) do
        user_double = double(User)
        allow(user_double).to receive(:has_right?).and_return(true)
        allow_any_instance_of(UserAuthMethods).to receive(:current_user).and_return(user_double)
      end

      it 'redirects to /admin/geo' do
        delete :remove_georegion, :id => 1
        expect(response).to redirect_to('/admin/geo')
      end
    end

    describe 'PUT /admin/geo/:id/enable' do
      before(:each) do
        user_double = double(User)
        allow(user_double).to receive(:has_right?).and_return(true)
        allow_any_instance_of(UserAuthMethods).to receive(:current_user).and_return(user_double)
      end

      it 'redirects to /admin/georegions' do
        put :enable_georegion, :id => 1
        expect(response).to redirect_to('/admin/geo')
      end
    end

    describe 'PUT /admin/geo/:id/disable' do
      before(:each) do
        user_double = double(User)
        allow(user_double).to receive(:has_right?).and_return(true)
        allow_any_instance_of(UserAuthMethods).to receive(:current_user).and_return(user_double)
      end

      it 'redirects to /admin/geo' do
        put :disable_georegion, :id => 1
        expect(response).to redirect_to('/admin/geo')
      end
    end
  end
end
