require 'rails_helper'

describe SiteAppearanceController do
  include TestHelperMethods

  before :each do
    init_environment(test_user: TestHelperMethods::NO_USER, site_chrome: false)
    @request.host = 'localhost' # VCR tapes were recorded against localhost
  end

  after :each do
    logout
  end

  # If you're going to re-record the VCR tapes:
  # * grab a fresh batch of cookies from a valid local session
  # * wipe the spec/fixtures/vcr_cassettes/site_appearance/controller/*yml files
  # * re-run
  #
  # These may or may not be duplicates of those in spec/models/site_appearance_spec.rb depending on when
  # VCR tapes for these tests suites were last recorded
  def auth_cookies_for_vcr_tapes
    {
      'logged_in' => 'true',
      '_socrata_session_id' => 'BAh7CkkiD3Nlc3Npb25faWQGOgZFRkkiJWM3NjQwMzViYmM0MTcxOGEyOTc1ZGI5NGZkZThlOGEwBjsARkkiCXVzZXIGOwBGaQdJIhBfY3NyZl90b2tlbgY7AEZJIjE3a0p6V1hDNVVjVUVKMzdsR3pGTGJZTzZSdkVXaDNHdzN1VnVneDNxeDBJPQY7AEZJIg5yZXR1cm5fdG8GOwBGMEkiCWluaXQGOwBUVA%3D%3D--9b787ae2e932a2cf057be464aaab195d141071a3',
      'socrata-csrf-token' => 'pNPUdEnKk5ajBaaDdASYYvlOslH2IkxX6NNUtKgHD4dKkactOXPCU6ci2GZvNdMPevT0oOClPec2Njo3te3IxQ%3D%3D',
      '_core_session_id' => 'dHVnZy1pa2NlIDE0Nzk4ODAxNjQgNDc1ZTBhMTg2ZThjIGI5YTc1NWIxZTQ1ZGZjYWM3OGUzODI2Njk3YzM1NDY0NzNjNWY5NWY%3D'
    }
  end

  # The main page admins will typically access
  describe 'edit' do
    before(:each) do
      stub_site_chrome
      allow(subject).to receive(:enable_site_chrome?).and_return(true)
    end

    it 'redirects if not logged in' do
      stub_anonymous_user
      get :edit
      expect(response).to redirect_to(login_url)
    end

    it 'is forbidden to users without rights' do
      init_current_user(@controller)
      stub_user(subject)
      get :edit
      expect(response).to have_http_status(:forbidden)
    end

    it 'loads if superadmin' do
      init_current_user(@controller)
      stub_superadmin_user(subject)
      make_site_appearance_visible
      VCR.use_cassette('site_appearance/controller/edit') do
        get :edit
        expect(response).to be_success
      end
    end

    it 'loads if administrator' do
      init_current_user(@controller)
      stub_administrator_user(subject)
      make_site_appearance_visible
      VCR.use_cassette('site_appearance/controller/edit') do
        get :edit
        expect(response).to be_success
      end
    end

    it 'loads if designer' do
      init_current_user(@controller)
      stub_administrator_user(subject)
      make_site_appearance_visible
      VCR.use_cassette('site_appearance/controller/edit') do
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
      VCR.use_cassette('site_appearance/controller/update_redirect_to_login') do
        put :update, content: new_content
        expect(response).to redirect_to(login_url)
      end
    end

    it 'is forbidden to non-admins' do
      init_current_user(@controller)
      stub_user(subject)
      allow(@controller).to receive(:get_site_title).and_return('site title')
      put :update, content: new_content
      expect(response).to have_http_status(:forbidden)
    end

    # TODO Refactor this as a Cheetah test, it can't really be a functional test since it mutates data.
    # it 'works if admin' do
    #   init_current_user(@controller)
    #   stub_superadmin_user # auth for rails but not for core

    #   # now we get auth for core
    #   auth_cookies_for_vcr_tapes.each { |key, value| @request.cookies[key] = value }

    #   VCR.use_cassette('site_appearance/controller/update') do
    #     site_appearance = SiteAppearance.find
    #     expect(site_appearance.content).not_to include(new_content)

    #     put :update, content: new_content
    #     expect(response).to redirect_to(edit_site_appearance_path)

    #     after_update = site_appearance.reload
    #     expect(after_update.content).to include(new_content)
    #   end
    # end

    describe 'activation_state' do
      before(:each) do
        init_current_user(@controller)
        stub_superadmin_user(subject)
        allow(@controller).to receive(:get_site_title).and_return('site title')
        auth_cookies_for_vcr_tapes.each { |key, value| @request.cookies[key] = value }
      end

      it 'gets called if params[:site_appearance] and params[:activation] is present and site appearance is not yet activated' do
        site_appearance_param = { 'entire_site' => true }
        activation_param = { 'activation' => true }

        VCR.use_cassette('site_appearance/controller/update_with_activation_state') do
          allow_any_instance_of(SiteAppearance).to receive(:activated?).and_return(false)
          expect_any_instance_of(SiteAppearance).to receive(:set_activation_state)

          put :update, content: new_content, site_appearance: site_appearance_param, activation: activation_param
        end
      end

      it 'gets called if params[:site_appearance] is present and site appearance is already activated' do
        site_appearance_param = { 'entire_site' => true }

        VCR.use_cassette('site_appearance/controller/update_with_activation_state') do
          allow_any_instance_of(SiteAppearance).to receive(:activated?).and_return(true)
          expect_any_instance_of(SiteAppearance).to receive(:set_activation_state)

          put :update, content: new_content, site_appearance: site_appearance_param
        end
      end

      it 'does not get called if params[:site_appearance] is not present' do
        stub_anonymous_user
        VCR.use_cassette('site_appearance/controller/update_with_activation_state') do
          allow_any_instance_of(SiteAppearance).to receive(:activated?).and_return(true)
          expect_any_instance_of(SiteAppearance).not_to receive(:set_activation_state)

          put :update, content: new_content
        end
      end
    end
  end

  describe '#fetch_site_appearance_content' do
    before(:each) do
      allow(subject).to receive(:enable_site_chrome?).and_return(true)
    end

    it 'creates content with necessary keys to render views' do
      allow(SiteAppearance).to receive(:find).and_return(empty_site_appearance)
      result = @controller.instance_eval { fetch_site_appearance_content }
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
      expect { post :create, site_appearance: {} }.to raise_error(ActionController::UrlGenerationError)
    end
  end

  describe 'destroy' do
    it 'is unimplemented' do
      expect { delete site_appearance: {id: 456} }.to raise_error(ActionController::UrlGenerationError)
    end
  end

  private

  def empty_site_appearance
    SiteAppearance.new
  end

  def make_site_appearance_visible
    rspec_stub_feature_flags_with(site_appearance_visible: true)
  end
end
