require 'rails_helper'

describe SiteChromeController do
  include TestHelperMethods

  before :each do
    init_current_domain
    init_core_session
    init_signaller
    @request.host = 'localhost' # VCR tapes were recorded against localhost
  end

  after :each do
    logout
  end

  # If you're going to re-record the VCR tapes:
  # * grab a fresh batch of cookies from a valid local session
  # * wipe the spec/fixtures/vcr_cassettes/site_chrome/controller/*yml files
  # * re-run
  #
  # These may or may not be duplicates of those in spec/models/site_chrome_spec.rb depending on when
  # VCR tapes for these tests suites were last recorded
  def auth_cookies_for_vcr_tapes
    {
      'logged_in' => 'true',
      '_socrata_session_id' => 'BAh7C0kiD3Nlc3Npb25faWQGOgZFRkkiJTE0ODEzNzdkODA0OWM1ZTQzNDFhN2RhYjdmNGYzODlhBjsARkkiCXVzZXIGOwBGMEkiEF9jc3JmX3Rva2VuBjsARkkiMWNSenU3VjNaMi9WVkVoQ1o0NURTeUdWTEtQaktXS2w2MnZxVHd0aDZ1QUE9BjsARkkiCWluaXQGOwBUVEkiDnJldHVybl90bwY7AEYwSSIKZmxhc2gGOwBUewdJIgxkaXNjYXJkBjsAVFsGSSILbm90aWNlBjsARkkiDGZsYXNoZXMGOwBUewZJIgtub3RpY2UGOwBGSSIXU2l0ZSB0aGVtZSB1cGRhdGVkBjsAVA',
      'socrata-csrf-token' => 'dbIpjcrCMkifCCB47xe4gwioH1JW3j9nrLjJ9Uko2PIErsdglxvpvcoaMOEMh2pLbeM3qpyGlh12Qlo3kVJg8g',
      '_core_session_id' => 'M2hwYS10Znp5IDE0NzU4OTgyNjAgYzMyZTA4NmVhMjVjIDVhZTU4NTJiZTJmN2VkMmRmMDcyOWEzYTc2MWJkYTBkZTk0YjA2MTU'
    }
  end

  # The main page admins will typically access
  describe 'edit' do
    before(:each) do
      stub_site_chrome
      allow(subject).to receive(:enable_site_chrome?).and_return(true)
    end

    it 'redirects if not logged in' do
      get :edit
      expect(response).to redirect_to(login_url)
    end

    it 'is forbidden to users without rights' do
      init_current_user(@controller)
      stub_normal_user
      get :edit
      expect(response).to have_http_status(:forbidden)
    end

    it 'loads if superadmin' do
      init_current_user(@controller)
      stub_superadmin_user
      enable_site_appearance
      VCR.use_cassette('site_chrome/controller/edit') do
        get :edit
        expect(response).to be_success
      end
    end

    it 'loads if administrator' do
      init_current_user(@controller)
      stub_administrator_user
      enable_site_appearance
      VCR.use_cassette('site_chrome/controller/edit') do
        get :edit
        expect(response).to be_success
      end
    end

    it 'loads if designer' do
      init_current_user(@controller)
      stub_administrator_user
      enable_site_appearance
      VCR.use_cassette('site_chrome/controller/edit') do
        get :edit
        expect(response).to be_success
      end
    end
  end

  describe 'update' do
    before(:each) do
      allow(subject).to receive(:enable_site_chrome?).and_return(true)
    end

    new_content = { 'new_properties' => { 'some_key' => 'some_fine_value' } }

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

    it 'works if admin' do
      init_current_user(@controller)
      stub_superadmin_user # auth for rails but not for core

      # now we get auth for core
      auth_cookies_for_vcr_tapes.each { |key, value| @request.cookies[key] = value }

      VCR.use_cassette('site_chrome/controller/update') do
        site_chrome = SiteChrome.find
        expect(site_chrome.content).not_to include(new_content)

        put :update, content: new_content
        expect(response).to redirect_to(edit_site_chrome_path)

        after_update = site_chrome.reload
        expect(after_update.content).to include(new_content)
      end
    end

    describe 'activation_state' do
      before(:each) do
        init_current_user(@controller)
        stub_superadmin_user
        auth_cookies_for_vcr_tapes.each { |key, value| @request.cookies[key] = value }
      end

      it 'gets called if params[:site_appearance] and params[:activation] is present and site chrome is not yet activated' do
        site_appearance_param = { 'entire_site' => true }
        activation_param = { 'activation' => true }

        VCR.use_cassette('site_chrome/controller/update_with_activation_state') do
          allow_any_instance_of(SiteChrome).to receive(:activated?).and_return(false)
          expect_any_instance_of(SiteChrome).to receive(:set_activation_state)

          put :update, content: new_content, site_appearance: site_appearance_param, activation: activation_param
        end
      end

      it 'gets called if params[:site_appearance] is present and site chrome is already activated' do
        site_appearance_param = { 'entire_site' => true }

        VCR.use_cassette('site_chrome/controller/update_with_activation_state') do
          allow_any_instance_of(SiteChrome).to receive(:activated?).and_return(true)
          expect_any_instance_of(SiteChrome).to receive(:set_activation_state)

          put :update, content: new_content, site_appearance: site_appearance_param
        end
      end

      it 'does not get called if params[:site_appearance] is not present' do
        VCR.use_cassette('site_chrome/controller/update_with_activation_state') do
          allow_any_instance_of(SiteChrome).to receive(:activated?).and_return(true)
          expect_any_instance_of(SiteChrome).not_to receive(:set_activation_state)

          put :update, content: new_content
        end
      end
    end
  end

  describe '#fetch_site_chrome_content' do
    before(:each) do
      allow(subject).to receive(:enable_site_chrome?).and_return(true)
    end

    it 'creates content with necessary keys to render views' do
      allow(SiteChrome).to receive(:find).and_return(empty_site_chrome)
      result = @controller.instance_eval { fetch_site_chrome_content }
      expect(result).to match_array(%w(header footer general locales))
    end
  end

  #########################
  # Routes that don't exist

  describe 'index' do
    it 'is unimplemented' do
      expect { get :index }.to raise_error(ActionController::UrlGenerationError)
    end
  end

  describe 'show' do
    it 'is unimplemented' do
      expect { get :show, id: 123 }.to raise_error(ActionController::UrlGenerationError)
    end
  end

  describe 'create' do
    it 'is unimplemented' do
      expect { post :create, site_chrome: {} }.to raise_error(ActionController::UrlGenerationError)
    end
  end

  describe 'destroy' do
    it 'is unimplemented' do
      expect { delete site_chrome: {id: 456} }.to raise_error(ActionController::UrlGenerationError)
    end
  end

  private

  def stub_normal_user
    user = User.new
    allow(user).to receive(:is_superadmin?).and_return(false)
    allow(user).to receive(:is_administrator?).and_return(false)
    allow(user).to receive(:is_designer?).and_return(false)
    allow_any_instance_of(SiteChromeController).to receive(:current_user).and_return(user)
  end

  # a la spec/controllers/administration_controller/spec.rb
  def stub_superadmin_user
    user = User.new
    allow(user).to receive(:is_superadmin?).and_return(true)
    allow(user).to receive(:is_administrator?).and_return(false)
    allow(user).to receive(:is_designer?).and_return(false)
    allow_any_instance_of(SiteChromeController).to receive(:current_user).and_return(user)
  end

  # a la spec/controllers/administration_controller/spec.rb
  def stub_administrator_user
    user = User.new
    allow(user).to receive(:is_superadmin?).and_return(false)
    allow(user).to receive(:is_administrator?).and_return(true)
    allow(user).to receive(:is_designer?).and_return(false)
    allow_any_instance_of(SiteChromeController).to receive(:current_user).and_return(user)
  end

  def stub_designer_user
    user = User.new
    allow(user).to receive(:is_superadmin?).and_return(false)
    allow(user).to receive(:is_administrator?).and_return(false)
    allow(user).to receive(:is_designer?).and_return(true)
    allow_any_instance_of(SiteChromeController).to receive(:current_user).and_return(user)
  end

  def empty_site_chrome
    SiteChrome.new
  end

  def enable_site_appearance
    allow(CurrentDomain).to receive(:feature_flags).and_return(
      Hashie::Mash.new.tap { |mash| mash.site_appearance_visible = true }
    )
  end
end
