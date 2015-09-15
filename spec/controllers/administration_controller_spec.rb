require 'rails_helper'

describe AdministrationController do

  describe 'georegions' do
    before(:each) do
      user_double = double(User)
      allow(user_double).to receive(:has_right?).and_return(true)
      allow_any_instance_of(ApplicationController).to receive(:default_url_options).and_return({})
      allow_any_instance_of(ApplicationController).to receive(:sync_logged_in_cookie)
      allow_any_instance_of(ApplicationController).to receive(:require_user).and_return(true)
      allow_any_instance_of(ApplicationController).to receive(:set_user)
      allow_any_instance_of(ApplicationController).to receive(:set_meta)
      allow_any_instance_of(UserAuthMethods).to receive(:current_user).and_return(user_double)
    end

    describe 'GET /admin/georegions' do

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
end
