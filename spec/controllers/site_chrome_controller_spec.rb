require 'rails_helper'

describe SiteChromeController do
  include TestHelperMethods

  before :each do
    init_current_domain
    init_core_session
    @request.host = 'localhost' # VCR tapes were recorded against localhost
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
    {"remember_token"=>"eR9ZWVZCdcvcpTOw8ouyJA", "mp_mixpanel__c"=>"10", "mp_mixpanel__c3"=>"15026", "mp_mixpanel__c4"=>"11567", "mp_mixpanel__c5"=>"76", "logged_in"=>"true", "_socrata_session_id"=>"BAh7B0kiD3Nlc3Npb25faWQGOgZFRiIlNjIyNDc1MGIwMzMwNzJlODhlNTM1MTE1ZDc1MTRkODBJIhBfY3NyZl90b2tlbgY7AEZJIjFSNXVEeWR6b01ZaHFzQjViQWpGbytVWXNVUnhFa3QvNXV0aVgxbGlCaTZrPQY7AEY=--87c50ef28e9e16cf40637e33bd29d821aa9142aa", "socrata-csrf-token"=>"R5uDydzoMYhqsB5bAjFo+UYsURxEkt/5utiX1liBi6k=", "_core_session_id"=>"ODNueS13OXplIDE0NjMxODI5MTggNWE4ZGRmZTViOTUwIGY3ZmM3MTc4NjNhYzMzYTA3ODNlNjhkYTkzYmFhOWUyOTE3MTBlYzg"}
  end

  # The main page admins will typically access
  describe 'edit' do
    it 'redirects if not logged in' do
      get :edit
      expect(response).to redirect_to(login_url)
    end

    it 'is forbidden to non-admins' do
      init_current_user(@controller)
      stub_normal_user
      get :edit
      expect(response).to have_http_status(:forbidden)
    end

    # TODO: add these tests:
    # 1) site_theme created if does not already exist
    # 2) site_theme loaded if already exists
    # 3) site_theme.property siteChromeConfigVars created if does not already exist
    # 4) site_theme.property siteChromeConfigVars loaded if already exists

    it 'loads if admin' do
      init_current_user(@controller)
      stub_superadmin_user
      VCR.use_cassette('site_chrome/controller/edit') do
        get :edit
        expect(response).to be_success
      end
    end
  end

  describe 'update' do
    new_content = { 'new_batch_of_properties' => { 'some_key' => 'some_fine_value' } }

    it 'redirects if not logged in' do
      VCR.use_cassette('site_chrome/controller/update_redirect_to_login') do
        put :update, content: new_content
        expect(response).to redirect_to(login_url)
      end
    end

    it 'is forbidden to non-admins' do
      init_current_user(@controller)
      stub_normal_user
      put :update, content: new_content
      expect(response).to have_http_status(:forbidden)
    end

    # TODO: add these tests:
    # 1) site theme does not exist
    # 2) site theme exists but siteChromeConfigVars does not

    it 'works if admin' do
      init_current_user(@controller)
      stub_superadmin_user # auth for rails but not for core

      # now we get auth for core
      auth_cookies.each { |key, value| @request.cookies[key] = value }

      VCR.use_cassette('site_chrome/controller/update') do
        site_chrome = SiteChrome.find_default
        expect(site_chrome.content).not_to include(new_content)

        put :update, content: new_content
        expect(response).to redirect_to(site_chrome_path)

        after_update = site_chrome.reload
        expect(after_update.content).to include(new_content)
      end
    end
  end

  #########################
  # Routes that don't exist

  describe 'index' do
    it 'is unimplemented' do
      expect { get :index }.
        to raise_error(ActionController::RoutingError)
    end
  end

  describe 'show' do
    it 'is unimplemented' do
      expect { get :show, id: 123 }.
        to raise_error(ActionController::RoutingError)
    end
  end

  describe 'create' do
    it 'is unimplemented' do
      expect { post :create, site_chrome: {} }.
        to raise_error(ActionController::RoutingError)
    end
  end

  describe 'destroy' do
    it 'is unimplemented' do
      expect { delete site_chrome_path(456) }.
        to raise_error(ActionController::RoutingError)
    end
  end

  private

  def stub_normal_user
    user_double = double(User)
    allow(user_double).to receive(:is_admin?).and_return(false)
    allow_any_instance_of(UserAuthMethods).to receive(:current_user).and_return(user_double)
  end

  # a la spec/controllers/administration_controller/spec.rb
  def stub_superadmin_user
    user_double = double(User)
    allow(user_double).to receive(:is_admin?).and_return(true)
    allow_any_instance_of(UserAuthMethods).to receive(:current_user).and_return(user_double)
  end
end
