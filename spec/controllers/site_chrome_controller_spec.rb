require 'rails_helper'

describe SiteChromeController do
  include TestHelperMethods

  before :each do
    init_current_domain
    init_core_session
  end

  after :each do
    logout
  end

  # If you're going to re-record the VCR tapes:
  # * grab a fresh batch of cookies from a valid local session
  # * change the set_theme_id
  # * with wipe the site_chrome*yml files
  # * and re-run.
  def auth_cookies
    {
      'remember_token' => 'eR9ZWVZCdcvcpTOw8ouyJA',
      'logged_in' => 'true',
      'mp_mixpanel__c' => '7',
      'mp_mixpanel__c3' => '12706',
      'mp_mixpanel__c4' => '9207',
      'mp_mixpanel__c5' => '64',
      '_socrata_session_id' => 'BAh7B0kiD3Nlc3Npb25faWQGOgZFRiIlNjIyNDc1MGIwMzMwNzJlODhlNTM1MTE1ZDc1MTRkODBJIhBfY3NyZl90b2tlbgY7AEZJIjFSNXVEeWR6b01ZaHFzQjViQWpGbytVWXNVUnhFa3QvNXV0aVgxbGlCaTZrPQY7AEY=--87c50ef28e9e16cf40637e33bd29d821aa9142aa',
      'socrata-csrf-token' => 'R5uDydzoMYhqsB5bAjFo+UYsURxEkt/5utiX1liBi6k=',
      '_core_session_id' => 'ODNueS13OXplIDE0NjI4Mzc4NzUgYjE2YjUxZDk3NWY0IDBiMTRjNTc4ZmQ5NDZhMjdjNGUyZDUwYjRkMzI1ZjFkZjRiOTIyY2Q'
    }
  end

  # If you re-record the VCR tapes from your local dev box, you'll likely need to change this
  def site_chrome_id
    61
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
      VCR.use_cassette('site_chrome_index') do
        get :index
        expect(response).to be_success
      end
    end
  end

  describe 'show' do
    it 'redirects if not logged in' do
      get :show, id: site_chrome_id
      expect(response).to redirect_to(login_url)
    end

    it 'is forbidden to non-admins' do
      init_current_user(@controller)
      stub_normal_user
      get :show, id: site_chrome_id
      expect(response).to have_http_status(:forbidden)
    end

    it 'loads if admin' do
      init_current_user(@controller)
      stub_superadmin_user
      VCR.use_cassette('site_chrome_show') do
        get :show, id: site_chrome_id
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
      VCR.use_cassette('site_chrome_new') do
        get :new
        expect(response).to be_success
      end
    end
  end

  # The main page admins will typically access
  describe 'edit' do
    it 'redirects if not logged in' do
      get :edit, id: site_chrome_id
      expect(response).to redirect_to(login_url)
    end

    it 'is forbidden to non-admins' do
      init_current_user(@controller)
      stub_normal_user
      get :edit, id: site_chrome_id
      expect(response).to have_http_status(:forbidden)
    end

    it 'loads if admin' do
      init_current_user(@controller)
      stub_superadmin_user
      VCR.use_cassette('site_chrome_edit') do
        get :edit, id: site_chrome_id
        expect(response).to be_success
      end
    end
  end

  #####################
  # Destructive actions
  #####################

  describe 'create' do
    site_chrome = { properties: { 'some_key' => 'some_value' } }

    it 'redirects if not logged in' do
      post :create, site_chrome: site_chrome
      expect(response).to redirect_to(login_url)
    end

    it 'is forbidden to non-admins' do
      init_current_user(@controller)
      stub_normal_user
      post :create, site_chrome: site_chrome
      expect(response).to have_http_status(:forbidden)
    end

    it 'works if admin' do
      init_current_user(@controller)
      stub_superadmin_user
      VCR.use_cassette('site_chrome_controller_create') do
        post :create, site_chrome: site_chrome
        expect(response).to be_success
      end
    end
  end

  describe 'update' do
    site_chrome = { properties: { 'some_key' => 'some_value' } }
    name_value_hash = { 'name' => 'some_key', 'value' => 'some_value' }

    it 'redirects if not logged in' do
      put :update, id: site_chrome_id, site_chrome: site_chrome
      expect(response).to redirect_to(login_url)
    end

    it 'is forbidden to non-admins' do
      init_current_user(@controller)
      stub_normal_user
      put :update, id: site_chrome_id, site_chrome: site_chrome
      expect(response).to have_http_status(:forbidden)
    end

    it 'works if admin' do
      init_current_user(@controller)
      stub_superadmin_user

      auth_cookies.each { |key, value| @request.cookies[key] = value }

      VCR.use_cassette('site_chrome_controller_update') do
        put :update, id: site_chrome_id, site_chrome: site_chrome
        expect(response).to be_success

        site_chrome_reloaded = SiteChrome.find_one(site_chrome_id)
        expect(site_chrome_reloaded.properties).to include(name_value_hash)
      end
    end
  end

  # Let's keep destroy from existing
  describe 'destroy' do
    it 'is unimplemented' do
      expect { delete site_chrome_path(site_chrome_id) }.to raise_error(ActionController::RoutingError)
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
