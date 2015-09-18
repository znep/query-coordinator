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
      before(:each) do
        user_double = double(User)
        allow(user_double).to receive(:has_right?).and_return(true)
        allow_any_instance_of(UserAuthMethods).to receive(:current_user).and_return(user_double)
      end

      it 'redirects to /admin/geo' do
        post :add_georegion
        expect(response).to redirect_to('/admin/geo')
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
