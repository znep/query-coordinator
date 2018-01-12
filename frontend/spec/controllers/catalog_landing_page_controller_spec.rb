require 'rails_helper'

describe CatalogLandingPageController do

  include TestHelperMethods

  before do
    init_anonymous_environment
    stub_feature_flags_with(
      enable_catalog_landing_page: true,
      cetera_search: true
    )
    allow(subject).to receive(:get_site_title).and_return('site title')
  end

  # Note, these specs do NOT exercise the CatalogLandingPageConstraint.
  describe 'GET #show' do
    it '404s when enable_catalog_landing_page is false' do
      stub_feature_flags_with(
        enable_catalog_landing_page: false,
        cetera_search: true
      )
      get :show, :category => 'Government'
      expect(response).to have_http_status(404)
    end

    it 'should render show with the catalog_landing_page layout' do
      VCR.use_cassette('catalog_landing_page_controller_show') do
        get :show, :category => 'Government'

        expect(subject).to render_template('styleguide')

        expect(assigns(:clp_title_param_string)).to eq('Government | Page 1 of 1')
        expect(assigns(:featured_content).length).to eq(2)
        expect(assigns(:metadata).keys).to eq(%w(description headline))
        expect(assigns(:processed_browse)[:sidebar_config].search).to eq(false)

        expect(response).to have_http_status(:success)
      end
    end
  end

  describe 'GET #manage' do
    describe 'while not logged in' do
      it 'should redirect to the login page' do
        get :manage, :category => 'Government'
        expect(response).to redirect_to('https://test.host/login')
      end
    end

    describe 'while logged in as a normal user' do
      before(:each) do
        init_current_user(controller)
        stub_user(subject)
      end

      it 'should tell me I have insufficient privileges' do
        get :manage, :category => 'Government'
        expect(response).to have_http_status(403)
      end
    end

    describe 'while logged in as an admin' do
      before(:each) do
        init_current_user(controller)
        stub_administrator_user(subject)
      end

      it '404s when enable_catalog_landing_page is false' do
        stub_feature_flags_with(
          enable_catalog_landing_page: false,
          cetera_search: true
        )
        get :manage, :category => 'Government'
        expect(response).to have_http_status(404)
      end

      it 'should render show with the catalog_landing_page layout' do
        VCR.use_cassette('catalog_landing_page_controller_manage') do
          get :manage, :category => 'Government'

          expect(subject).to render_template('styleguide')

          expect(assigns(:clp_title_param_string)).to eq('Government')
          expect(assigns(:featured_content).length).to eq(2)
          expect(assigns(:metadata).keys.sort).to eq(%w(description headline))

          expect(response).to have_http_status(:success)
        end
      end
    end
  end

  describe 'POST #manage_write' do
    let(:post_body) {
      {
        :catalog_query => {
          :category => 'Government',
        },
        :metadata => {
          :headline => 'My headline',
          :description => 'My description'
        },
        :featured_content => {
          1 => {
            :removed => false,
            :resource_id => 1
          },
          2 => {
            :removed => true,
            :resource_id => 2
          },
          3 => {
            :removed => false,
            :resource_id => 3
          }
        }
      }
    }

    describe 'while not logged in' do
      it 'should redirect to the login page' do
        post :manage_write, post_body

        expect(response).to redirect_to('https://test.host/login')
      end
    end

    describe 'while logged in as a normal user' do
      before(:each) do
        init_current_user(controller)
        stub_user(subject)
      end

      it 'should tell me I have insufficient privileges' do
        post :manage_write, post_body
        expect(response).to have_http_status(403)
      end
    end

    describe 'while logged in as an admin' do
      before(:each) do
        init_current_user(controller)
        stub_administrator_user(subject)
      end

      it '404s when enable_catalog_landing_page is false' do
        stub_feature_flags_with(
          enable_catalog_landing_page: false,
          cetera_search: true
        )
        post :manage_write, post_body
        expect(response).to have_http_status(404)
      end

      it 'should save the updated information' do
        expect_any_instance_of(CatalogLandingPage).to receive(:update_metadata).
          with('headline' => 'My headline', 'description' => 'My description')
        expect_any_instance_of(CatalogLandingPage).to receive(:create_or_update_featured_content).
          with('removed' => false, 'resource_id' => '1').once
        expect(FeaturedContent).to receive(:destroy).once
        expect_any_instance_of(CatalogLandingPage).to receive(:create_or_update_featured_content).
          with('removed' => false, 'resource_id' => '3').once

        allow_any_instance_of(Domain).to receive(:default_configuration).
          and_return(Configuration.new)

        post :manage_write, post_body

        expect(response).to have_http_status(:success)
      end
    end
  end

  private

end
