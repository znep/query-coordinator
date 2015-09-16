require 'rails_helper'
require 'test_helper'

describe AdministrationController do
  include TestHelperMethods

  describe 'georegions' do
    before(:each) do
      init_current_user(controller)
      allow_any_instance_of(ApplicationController).to receive(:default_url_options).and_return({})
      allow_any_instance_of(ApplicationController).to receive(:sync_logged_in_cookie)
      allow_any_instance_of(ApplicationController).to receive(:set_user)
      allow_any_instance_of(ApplicationController).to receive(:set_meta)
    end

    describe 'GET /admin/georegions' do

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
          expect(assigns(:georegions)).to include(
              :counts => { :available => 3, :enabled => 1 },
              :custom => a_collection_containing_exactly(an_instance_of(CuratedRegion), an_instance_of(CuratedRegion)),
              :default => a_collection_containing_exactly(an_instance_of(CuratedRegion)),
              :translations => an_instance_of(LocalePart)
            )
        end

      end

    end

    describe 'POST /admin/georegions' do
      before(:each) do
        user_double = double(User)
        allow(user_double).to receive(:has_right?).and_return(true)
        allow_any_instance_of(UserAuthMethods).to receive(:current_user).and_return(user_double)
      end

      it 'redirects to /admin/georegions' do
        post :add_georegion
        expect(response).to redirect_to(:georegions)
      end
    end

    describe 'PUT /admin/georegions/:id' do
      before(:each) do
        user_double = double(User)
        allow(user_double).to receive(:has_right?).and_return(true)
        allow_any_instance_of(UserAuthMethods).to receive(:current_user).and_return(user_double)
      end

      it 'redirects to /admin/georegions' do
        put :edit_georegion, :id => 1
        expect(response).to redirect_to(:georegions)
      end
    end

    describe 'DELETE /admin/georegions/:id' do
      before(:each) do
        user_double = double(User)
        allow(user_double).to receive(:has_right?).and_return(true)
        allow_any_instance_of(UserAuthMethods).to receive(:current_user).and_return(user_double)
      end

      it 'redirects to /admin/georegions' do
        delete :remove_georegion, :id => 1
        expect(response).to redirect_to(:georegions)
      end
    end

    describe 'PUT /admin/georegions/:id/enable' do
      before(:each) do
        user_double = double(User)
        allow(user_double).to receive(:has_right?).and_return(true)
        allow_any_instance_of(UserAuthMethods).to receive(:current_user).and_return(user_double)
      end

      it 'redirects to /admin/georegions' do
        put :enable_georegion, :id => 1
        expect(response).to redirect_to(:georegions)
      end
    end

    describe 'PUT /admin/georegions/:id/disable' do
      before(:each) do
        user_double = double(User)
        allow(user_double).to receive(:has_right?).and_return(true)
        allow_any_instance_of(UserAuthMethods).to receive(:current_user).and_return(user_double)
      end

      it 'redirects to /admin/georegions' do
        put :disable_georegion, :id => 1
        expect(response).to redirect_to(:georegions)
      end
    end
  end
end
