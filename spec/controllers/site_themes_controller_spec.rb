require 'rails_helper'

describe SiteThemesController do
  include TestHelperMethods

  before :each do
    init_current_domain
    init_core_session
  end

  after :each do
    logout
  end

  # If you're going to re-record the VCR tapes, just grab a fresh batch of cookies from a valid
  # local session, change the set_theme_id, wipe the site_theme*yml files, and re-run.
  def auth_cookies
    {
      'remember_token' => 'eR9ZWVZCdcvcpTOw8ouyJA',
      'logged_in' => 'true',
      'mp_mixpanel__c' => '9',
      'mp_mixpanel__c3' => '12737',
      'mp_mixpanel__c4' => '10222',
      'mp_mixpanel__c5' => '75',
      'socrata-csrf-token' => 'R5uDydzoMYhqsB5bAjFo+UYsURxEkt/5utiX1liBi6k=',
      '_socrata_session_id' => 'BAh7CEkiD3Nlc3Npb25faWQGOgZFRiIlNjIyNDc1MGIwMzMwNzJlODhlNTM1MTE1ZDc1MTRkODBJIhBfY3NyZl90b2tlbgY7AEZJIjFSNXVEeWR6b01ZaHFzQjViQWpGbytVWXNVUnhFa3QvNXV0aVgxbGlCaTZrPQY7AEZJIgl1c2VyBjsARmkH--453acf9420884d37b8603df38e14142985922fec',
      '_core_session_id' => 'ODNueS13OXplIDE0NjI1MTQzMDcgMTRkNzZhMWVhNWI1IGQ0MWM2NDQ2ZjUzNmFjOWYzMGVlMTllODMyNjIyMWQ4NDc2NmJhNDU='
    }
  end

  # If you re-record the VCR tapes from your local dev box, you'll likely need to change this
  def site_theme_id
    32
  end

  describe 'index' do
    it 'redirects if not logged in' do
      get :index
      expect(response).to redirect_to(login_url)
    end

    it 'is forbidden to non-admins' do
      init_current_user(@controller)
      stub_normal_user
      get :index
      expect(response).to have_http_status(:forbidden)
    end

    it 'loads if admin' do
      init_current_user(@controller)
      stub_superadmin_user
      VCR.use_cassette('site_themes_index') do
        get :index
        expect(response).to be_success
      end
    end
  end

  describe 'show' do
    it 'redirects if not logged in' do
      get :show, id: site_theme_id
      expect(response).to redirect_to(login_url)
    end

    it 'is forbidden to non-admins' do
      init_current_user(@controller)
      stub_normal_user
      get :show, id: site_theme_id
      expect(response).to have_http_status(:forbidden)
    end

    it 'loads if admin' do
      init_current_user(@controller)
      stub_superadmin_user
      VCR.use_cassette('site_themes_show') do
        get :show, id: site_theme_id
        expect(response).to be_success
      end
    end
  end

  describe 'new' do
    it 'redirects if not logged in' do
      get :new
      expect(response).to redirect_to(login_url)
    end

    it 'is forbidden to non-admins' do
      init_current_user(@controller)
      stub_normal_user
      get :new
      expect(response).to have_http_status(:forbidden)
    end

    it 'loads if admin' do
      init_current_user(@controller)
      stub_superadmin_user
      VCR.use_cassette('site_themes_new') do
        get :new
        expect(response).to be_success
      end
    end
  end

  # The main page admins will typically access
  describe 'edit' do
    it 'redirects if not logged in' do
      get :edit, id: site_theme_id
      expect(response).to redirect_to(login_url)
    end

    it 'is forbidden to non-admins' do
      init_current_user(@controller)
      stub_normal_user
      get :edit, id: site_theme_id
      expect(response).to have_http_status(:forbidden)
    end

    it 'loads if admin' do
      init_current_user(@controller)
      stub_superadmin_user
      VCR.use_cassette('site_themes_edit') do
        get :edit, id: site_theme_id
        expect(response).to be_success
      end
    end
  end

  #####################
  # Destructive actions
  #####################

  describe 'create' do
    site_theme = { properties: { 'some_key' => 'some_value' } }

    it 'redirects if not logged in' do
      post :create, site_theme: site_theme
      expect(response).to redirect_to(login_url)
    end

    it 'is forbidden to non-admins' do
      init_current_user(@controller)
      stub_normal_user
      post :create, site_theme: site_theme
      expect(response).to have_http_status(:forbidden)
    end

    it 'works if admin' do
      init_current_user(@controller)
      stub_superadmin_user
      post :create, site_theme: site_theme
      expect(response).to be_success
    end
  end

  describe 'update' do
    site_theme = { properties: { 'some_key' => 'some_value' } }
    name_value_hash = { 'name' => 'some_key', 'value' => 'some_value' }

    it 'redirects if not logged in' do
      put :update, id: site_theme_id, site_theme: site_theme
      expect(response).to redirect_to(login_url)
    end

    it 'is forbidden to non-admins' do
      init_current_user(@controller)
      stub_normal_user
      put :update, id: site_theme_id, site_theme: site_theme
      expect(response).to have_http_status(:forbidden)
    end

    it 'works if admin' do
      init_current_user(@controller)
      stub_superadmin_user
      request.cookies = auth_cookies

      VCR.use_cassette('site_themes_update') do
        put :update, id: site_theme_id, site_theme: site_theme
        expect(response).to be_success

        site_theme_reloaded = SiteTheme.find_one(site_theme_id)
        expect(site_theme_reloaded.properties).to include(name_value_hash)
      end
    end
  end

  # Let's keep destroy from existing
  describe 'destroy' do
    it 'is unimplemented' do
      expect { delete site_theme_path(site_theme_id) }.to raise_error(ActionController::RoutingError)
    end
  end

  private

  def stub_normal_user
    user_double = double(User)
    allow(user_double).to receive(:is_admin?).and_return(false)
    allow_any_instance_of(UserAuthMethods).to receive(:current_user).and_return(user_double)
  end

  # a la spec/controllers/administration_controller_spec.rb
  def stub_superadmin_user
    user_double = double(User)
    allow(user_double).to receive(:is_admin?).and_return(true)
    allow_any_instance_of(UserAuthMethods).to receive(:current_user).and_return(user_double)
  end
end
