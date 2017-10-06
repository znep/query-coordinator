require 'rails_helper'

describe AdministrationController do
  include TestHelperMethods

  let(:view) { double(View, :createdAt => 1456530636244, :columns => []) }

  before(:each) do
    init_environment(:test_user => TestHelperMethods::NON_ROLED)
  end

  describe 'when logged in as non-superadmin user', :verify_stubs => false do
    it 'forbid access' do
      get :index
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe 'when logged in as a superadmin user', :verify_stubs =>  false do
    before do
      allow(subject).to receive(:check_member).and_return(true)
      allow_any_instance_of(AdministrationHelper).to receive(:show_site_appearance_admin_panel?).and_return(true)
      allow(AdministrationHelper).to receive(:user_can_see_administration_section?).and_return(true)
      allow(subject).to receive(:check_auth_level).and_return(true)
      allow(subject).to receive(:check_auth_levels_any).and_return(true)
      stub_superadmin_user(subject)
    end

    render_views

    it 'allows access' do
      get :index
      expect(response).to have_http_status(:ok)
    end

    context 'when enable_new_admin_ui is enabled' do
      before do
        rspec_stub_feature_flags_with(:enable_new_admin_ui => true)
        allow(subject).to receive(:enable_new_admin_ui?).and_return(true)
        allow(CuratedRegion).to receive(:all).and_return([])
        allow(User).to receive(:roles_list).and_return([])
      end

      it 'renders the superadmin section on the index page' do
        get :index
        expect(response).to have_http_status(:ok)
        assert_select('.super-admin-menu')
        assert_select('.leftNavBox.adminNavBox', :count => 0)
        assert_select('.leftNavBox.internalPanel', :count => 0)
      end

          # Pages that intentionally do not show the left_nav are: assets, site_appearance, activity_feed, goals
      %i(users analytics federations sdp_templates georegions home metadata).each do |page|
        it "renders the superadmin section on the '#{page}' page" do
          VCR.use_cassette('sectioned_admin') do
            get page
            expect(response).to have_http_status(:ok)
            # This section is only shown on the index (tested above)
            assert_select('.super-admin-menu', :count => 0)
            assert_select('.leftNavBox.adminNavBox', :count => 0)
            assert_select('.leftNavBox.internalPanel', :count => 0)
          end
        end
      end
    end

    context 'when enable_new_admin_ui is disabled' do
      before do
        rspec_stub_feature_flags_with(:enable_new_admin_ui => false)
        allow(subject).to receive(:enable_new_admin_ui?).and_return(false)
        allow(subject).to receive(:check_auth_level).with(UserRights::MANAGE_USERS).and_return(true)
        allow(User).to receive(:roles_list).and_return([])
      end

      %i(index users analytics).each do |page|
        it "renders the superadmin section on the '#{page}' page" do
          get page
          expect(response).to have_http_status(:ok)
          assert_select('.super-admin-menu', :count => 0)
          assert_select('.leftNavBox.adminNavBox')
          assert_select('.leftNavBox.internalPanel', :count => 0)
        end
      end
    end
  end

  describe 'when logged in as admin user', :verify_stubs => false do
    render_views

    describe 'and user is a member of the domain' do
      before { allow(CurrentDomain).to receive(:member?).and_return(true) }

      it 'allows access' do
        get :index
        expect(response).to have_http_status(:ok)
      end

      it 'does not render the internal panel in the superadmin section' do
        get :index
        assert_select('.super-admin-menu', :count => 0)
        assert_select('.leftNavBox.adminNavBox')
        assert_select('.leftNavBox.adminNavBox .internal', :count => 0)
      end
    end

    describe 'and user is not a member of the domain' do
      before { allow(CurrentDomain).to receive(:member?).and_return(false) }

      it 'does not allow access' do
        get :index
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe 'goals', :verify_stubs => false do
    describe 'GET /admin/goals' do
      describe 'with manage_goals right' do
        before(:each) do
          init_environment
          stub_user(subject, [UserRights::MANAGE_GOALS])
          allow(CurrentDomain).to receive(:module_enabled?).with(:govStat).and_return(govstat_enabled)
        end

        describe 'when govstat is enabled' do
          let(:govstat_enabled) { true }

          it 'renders' do
            get :goals
            expect(response).to have_http_status(:ok)
          end
        end

        describe 'when govstat is disabled' do
          let(:govstat_enabled) { false }

          it '404s' do
            get :goals
            expect(response).to have_http_status(:not_found)
          end
        end
      end

      describe 'without view_goals right' do
        before(:each) do
          init_environment
          stub_user(subject, [])
          allow(CurrentDomain).to receive(:module_enabled?).with(:govStat).and_return(true)
        end

        describe 'cannot see goals' do
          it '403s' do
            get :goals
            expect(response).to have_http_status(:forbidden)
          end
        end
      end
    end
  end

  # Can't use self-verifying stubs because the User class uses method_missing for all of the data properties
  describe 'georegions', :verify_stubs => false do
    before(:each) do
      init_current_user(subject)
      allow(subject).to receive(:default_url_options).and_return({})
      allow(subject).to receive(:sync_logged_in_cookie)
      allow(subject).to receive(:set_user)
      allow(subject).to receive(:set_meta)
      allow(subject).to receive(:feature_flag?).and_return(true)
      allow(subject).to receive(:incomplete_curated_region_jobs).and_return([])
      allow(subject).to receive(:failed_curated_region_jobs).and_return([])
      allow(subject).to receive(:enable_site_chrome?).and_return(false)
      allow_any_instance_of(CuratedRegion).to receive(:view).and_return(view)
      allow(CurrentDomain).to receive(:strings).and_return(Hashie::Mash.new(:site_title => 'My Site'))
    end

    describe 'GET /admin/geo' do

      describe 'not logged in' do
        before(:each) do
          allow(subject).to receive(:current_user_session).and_return(nil)
          allow(subject).to receive(:current_user).and_return(nil)
        end

        it 'should redirect to login page' do
          get :georegions
          expect(response).to redirect_to(:login)
        end
      end

      describe 'logged in as user without manage_spatial_lens_right' do
        before(:each) do
          init_environment
          stub_user(subject, [])
        end

        it 'should be forbidden' do
          get :georegions
          expect(response).to have_http_status(:forbidden)
        end
      end

      describe 'logged in as user with manage_spatial_lens right' do
        before(:each) do
          init_environment
          stub_spatial_lens_admin(subject)
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

        it 'does not error if CRJQ and ISS are down' do
          curated_region = build(:curated_region)
          allow(CuratedRegion).to receive(:find).and_return([curated_region])

          allow(subject).to receive(:incomplete_curated_region_jobs).and_call_original
          allow(subject).to receive(:failed_curated_region_jobs).and_call_original
          allow_any_instance_of(CuratedRegionJobQueue).to receive(:get_queue).and_raise('CRJQ is down')
          allow(ImportStatusService).to receive(:get).and_raise('ISS is down')

          get :georegions
          expect(response).to be_success
          expect(response).to have_http_status(200)
          expect(flash[:notice]).to include('We are experiencing technical issues')
        end

        it 'loads template data into @georegions' do
          allow(CuratedRegion).to receive(:find).and_return([
            CuratedRegion.new(
              'id' => 1,
              'name' => 'My Curated Region',
              'enabledFlag' => false,
              'defaultFlag' => false
            ),
            CuratedRegion.new(
              'id' => 2,
              'name' => 'My Curated Region',
              'enabledFlag' => true,
              'defaultFlag' => false
            ),
            CuratedRegion.new(
              'id' => 3,
              'name' => 'My Curated Region',
              'enabledFlag' => false,
              'defaultFlag' => true
            )
          ])

          get :georegions
          view_model = assigns(:view_model)
          expect(view_model.available_count).to eq(3)
          expect(view_model.default_count).to eq(1)
          expect(view_model.curated_regions).to contain_exactly(
            an_instance_of(CuratedRegion), an_instance_of(CuratedRegion),an_instance_of(CuratedRegion)
          )
          expect(view_model.translations).to be_an_instance_of(LocalePart)
        end

      end

      describe 'logged in as superadmin user' do
        it 'responds successfully with a 200 HTTP status code' do
          stub_superadmin_user(subject)
          curated_region = build(:curated_region)
          allow(CuratedRegion).to receive(:find).and_return([curated_region])
          get :georegions
          expect(response).to have_http_status(:success)
        end
      end

    end

    describe 'POST /admin/geo' do
      let(:curated_region_double) { double(CuratedRegion, :id => 1) }

      before(:each) do
        stub_spatial_lens_admin(subject)
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
      let(:curated_region_double) { double(CuratedRegion, :id => 1, :name => 'My Region') }

      before(:each) do
        stub_spatial_lens_admin(subject)
        allow(CuratedRegion).to receive(:find).and_return(curated_region_double)
      end

      it 'redirects to /admin/geo for html requests' do
        put :edit_georegion, :id => 1
        expect(response).to redirect_to('/admin/geo')
      end

      it 'returns a response for json requests' do
        put :edit_georegion, :id => 1, :format => :json
        expect(response).to have_http_status(200)
        expect(response.body).to include('Something went wrong')
      end

      it 'edits the region' do
        expect_any_instance_of(::Services::Administration::GeoregionEditor).
          to receive(:edit).
            and_return(curated_region_double)
        put :edit_georegion, :id => 1
      end

      describe 'with core server error' do
        before(:each) do
          allow_any_instance_of(::Services::Administration::GeoregionEditor).to receive(:edit).
            and_raise(CoreServer::CoreServerError.new(1, 2, 3))
        end

        describe 'html request' do
          before(:each) do
            put :edit_georegion, :id => 1
          end

          it 'sets the appropriate flash error' do
            expect(flash[:error]).to include('Something went wrong')
          end

          it 'redirects to /admin/geo' do
            expect(response).to redirect_to('/admin/geo')
          end
        end

        describe 'json request' do
          before(:each) do
            put :edit_georegion, :id => 1, :format => :json
          end

          it 'set the appropriate error' do
            expect(JSON.parse(response.body)['message']).to include('Something went wrong')
          end
        end
      end

      describe 'with missing name' do
        before(:each) do
          allow_any_instance_of(::Services::Administration::GeoregionEditor).to receive(:edit).
            and_raise(::Services::Administration::MissingBoundaryNameError)
        end

        describe 'html request' do
          before(:each) do
            put :edit_georegion, :id => 1
          end
          it 'sets the appropriate error for failed html requests' do
            expect(flash[:error]).to include('boundary must have a name')
          end

          it 're-renders the /admin/geo/:id/configure page for html requests' do
            expect(response).to redirect_to('/admin/geo/1/configure')
          end
        end

        describe 'json request' do
          before(:each) do
            put :edit_georegion, :id => 1, :format => :json
          end

          it 'set the appropriate error' do
            expect(JSON.parse(response.body)['message']).to include('the boundary must have')
          end
        end
      end
    end

    describe 'GET /admin/geo/:id/configure' do
      let(:curated_region_double) do
        double(
          CuratedRegion,
          :id => 1,
          :name => 'My Region',
          :geometry_label_columns => [],
          :geometryLabel => 'label column'
        )
      end

      before(:each) do
        stub_spatial_lens_admin(subject)
        allow(CuratedRegion).to receive(:find).and_return(curated_region_double)
      end

      it 'renders' do
        get :configure_boundary, :id => 1
        expect(response).to be_success
      end

      it 'loads template data into @view_model' do
        get :configure_boundary, :id => 1
        view_model = assigns(:view_model)
        expect(view_model.boundary).to eq(curated_region_double)
        expect(view_model.site_title).to eq('My Site')
        expect(view_model.is_name_missing).to eq(false)
        expect(view_model.shape_label_options).to eq([])
        expect(view_model.selected_shape_label).to eq('label column')
      end
    end

    describe 'DELETE /admin/geo/:id' do
      before(:each) do
        stub_spatial_lens_admin(subject)
      end

      it 'redirects to /admin/geo' do
        delete :remove_georegion, :id => 1
        expect(response).to redirect_to('/admin/geo')
      end
    end

    describe 'PUT /admin/geo/:id/enable' do
      let(:curated_region_double) { double(CuratedRegion, :id => 1, :name => 'My Region') }

      before(:each) do
        stub_spatial_lens_admin(subject)
        allow(CuratedRegion).to receive(:find).and_return(curated_region_double)
        allow(CuratedRegion).to receive(:find_enabled).and_return([])
      end

      describe 'success' do
        it 'redirects to /admin/geo' do
          allow_any_instance_of(::Services::Administration::GeoregionEnabler).to receive(:enable)
          put :enable_georegion, :id => 1
          expect(response).to redirect_to('/admin/geo')
        end

        it 'enables via the enabler' do
          expect_any_instance_of(::Services::Administration::GeoregionEnabler).to receive(:enable)
          put :enable_georegion, :id => 1
        end
      end
    end

    describe 'PUT /admin/geo/:id/disable' do
      let(:curated_region_double) { double(CuratedRegion, :id => 1, :name => 'My Region') }

      before(:each) do
        stub_spatial_lens_admin(subject)
        allow(CuratedRegion).to receive(:find).and_return(curated_region_double)
      end

      it 'redirects to /admin/geo' do
        allow_any_instance_of(::Services::Administration::GeoregionEnabler).to receive(:disable)
        put :disable_georegion, :id => 1
        expect(response).to redirect_to('/admin/geo')
      end

      it 'disables via the enabler' do
        expect_any_instance_of(::Services::Administration::GeoregionEnabler).to receive(:disable)
        put :disable_georegion, :id => 1
      end
    end

    describe 'PUT admin/geo/:id/:default_flag' do
      let(:curated_region_double) { double(CuratedRegion, :id => 1, :name => 'My Region') }

      before(:each) do
        stub_spatial_lens_admin(subject)
        allow(CuratedRegion).to receive(:find).and_return(curated_region_double)
        allow(CuratedRegion).to receive(:find_default).and_return([])
      end

      describe 'when flag is default' do
        describe 'success' do
          it 'redirects to /admin/geo' do
            allow_any_instance_of(::Services::Administration::GeoregionDefaulter).to receive(:default)
            put :set_georegion_default_status, :id => 1, :default_flag => 'default'
            expect(response).to redirect_to('/admin/geo')
          end

          it 'defaults via the defaulter' do
            expect_any_instance_of(::Services::Administration::GeoregionDefaulter).to receive(:default)
            put :set_georegion_default_status, :id => 1, :default_flag => 'default'
          end
        end

        describe 'failure' do
          it 'errors when the limit is met' do
            allow_any_instance_of(::Services::Administration::GeoregionDefaulter).
              to receive(:default).
              and_raise(::Services::Administration::DefaultGeoregionsLimitMetError)
            put :set_georegion_default_status, :id => 1, :default_flag => 'default'
            expect(flash[:error]).to_not be_nil
          end
        end
      end

      describe 'when flag is undefault' do
        it 'redirects to /admin/geo' do
          allow_any_instance_of(::Services::Administration::GeoregionDefaulter).to receive(:undefault)
          put :set_georegion_default_status, :id => 1, :default_flag => 'undefault'
          expect(response).to redirect_to('/admin/geo')
        end

        it 'undefaults via the defaulter' do
          expect_any_instance_of(::Services::Administration::GeoregionDefaulter).to receive(:undefault)
          put :set_georegion_default_status, :id => 1, :default_flag => 'undefault'
        end
      end
    end

    describe 'POST /admin/geo/poll' do
      it 'gets curated regions, in-progress jobs, and failed jobs' do
        allow(CuratedRegion).to receive(:find).and_return(
          [build(:curated_region), build(:curated_region), build(:curated_region)]
        )
        allow(subject).to receive(:incomplete_curated_region_jobs).and_return(
          [{ 'jobId' => 'cur8ed-r3g10n-j0b'}]
        )
        allow(subject).to receive(:failed_curated_region_jobs).and_return(
          [{ 'jobId' => 'f41l3d-cur8ed-r3g10n-j0b-1'}, { 'jobId' => 'f41l3d-cur8ed-r3g10n-j0b-2'}]
        )

        post :poll_georegion_jobs
        expect(response).to have_http_status(200)
        response_body = JSON.parse(response.body)
        expect(response_body).to include('success' => true)
        expect(response_body['message']['georegions'].size).to eq(3)
        expect(response_body['message']['jobs'].size).to eq(1)
        expect(response_body['message']['failedJobs'].size).to eq(2)
      end

      it 'provides an error message if any API call fails' do
        allow(CuratedRegion).to receive(:find).and_return(
          []
        )
        allow(subject).to receive(:incomplete_curated_region_jobs).and_raise(
          'CRJQ exploded'
        )
        allow(subject).to receive(:failed_curated_region_jobs).and_return(
          []
        )

        post :poll_georegion_jobs
        expect(response).to have_http_status(500)
        response_body = JSON.parse(response.body)
        expect(response_body['success']).to eq(false)
        expect(response_body['message']['errorMessage']).to include('CRJQ exploded')
      end
    end
  end

  describe 'metadata' do
    before(:each) do
      init_current_user(controller)
      allow(subject).to receive(:default_url_options).and_return({})
      allow(subject).to receive(:sync_logged_in_cookie)
      allow(subject).to receive(:set_user)
      allow(subject).to receive(:set_meta)
      allow(subject).to receive(:feature_flag?).and_return(true)
      allow(CurrentDomain).to receive(:user_can?).with(anything, UserRights::EDIT_SITE_THEME).and_return(true)
    end

    context 'when no metadata has yet to be set up' do
      before(:each) do
        allow(Configuration).to receive(:find_by_type).and_return(Configuration.parse('[{}]'))
        allow_any_instance_of(Configuration).to receive(:create_or_update_property)
      end

      describe '#create_metadata_field' do
        it 'post /metadata/:fieldset/create' do

          post :create_metadata_field, :fieldset => 'foo', :newFieldName => 'new_fieldname'

          expect(flash[:notice]).to include('Field Successfully Created')
          expect(response).to redirect_to(:action => 'metadata')
        end
      end
    end

    context 'when metadata_field already has choices set up' do
      let(:expected_new_field) {
        [Hashie::Mash.new(
          :name => 'Metadata',
          :fields => [Hashie::Mash.new(:name => 'Field with options', :options => nil, :type => 'text')]
        )]
      }

      before(:each) do
        allow(Configuration).to receive(:find_by_type).and_return(Configuration.parse(configuration_stub))
      end

      describe '#save_metadata_field' do
        it 'nullifies the options if all are removed from the field' do
          expect_any_instance_of(AdministrationController).to receive(:save_metadata).
            with(anything, expected_new_field, anything, anything)
          post :save_metadata_field, :fieldset => 0, :field => 'Field with options', :options => nil
        end
      end
    end
  end

  describe 'set_view_moderation_status' do
    before do
      init_environment
    end

    it 'should set a flash[:notice] unless request is JSON' do
      double(View).tap do |view_double|
        allow(view_double).to receive(:moderationStatus=).and_return(true)
        allow(view_double).to receive(:hideFromCatalog=).and_return(false)
        allow(view_double).to receive(:hideFromDataJson=).and_return(false)
        allow(view_double).to receive(:save!)
        allow(view_double).to receive(:name).and_return('view name')
        allow(view_double).to receive(:data_lens?).and_return(true)
        allow(view_double).to receive(:moderationStatus).and_return(true)
        allow(view_double).to receive(:moderation_status).and_return('APPROVED')
        allow(View).to receive(:find).and_return(view_double)
      end

      double.tap do |flash_double|
        expect(flash_double).to receive(:[]=).with(:notice, "The view 'view name' has been approved. Please allow a few minutes for the changes to be reflected on your home page")
        expect(flash_double).to receive(:update)
        expect(flash_double).to receive(:to_session_value)
        allow(request).to receive(:flash).and_return(flash_double)
      end

      allow(request.format).to receive(:json?).and_return(false)
      expect(subject).to receive(:check_auth_level).with(UserRights::APPROVE_NOMINATIONS).and_return(true)

      VCR.use_cassette('set_view_moderation_status') do
        post :set_view_moderation_status, :id => 'test-test', :approved => 'yes'
      end
    end
  end

  describe 'site appearance panel', :verify_stubs => false do
    context '#show_site_appearance_admin_panel?' do
      context 'with site_appearance_visible set to true' do
        before(:each) do
          make_site_appearance_visible(true)
          stub_site_chrome_custom_content
        end

        context 'as an anonymous user' do
          it 'should return false' do
            allow(subject).to receive(:current_user).and_return(nil)
            expect(subject.show_site_appearance_admin_panel?).to eq(false)
          end
        end

        context 'as a viewer' do
          it 'should return false' do
            stub_viewer_user(subject)
            expect(subject.show_site_appearance_admin_panel?).to eq(false)
          end
        end

        context 'as a superadmin' do
          it 'should return true' do
            stub_superadmin_user(subject)
            VCR.use_cassette('administration_controller_superadmin') do
              expect(subject.show_site_appearance_admin_panel?).to eq(true)
            end
          end
        end

        context 'as an administrator' do
          it 'should return true' do
            stub_administrator_user(subject)
            rspec_stub_feature_flags_with(site_appearance_visible: true)
            VCR.use_cassette('administration_controller_administrator') do
              expect(subject.show_site_appearance_admin_panel?).to eq(true)
            end
          end
        end

        context 'as a designer' do
          it 'should return true' do
            stub_designer_user(subject)
            rspec_stub_feature_flags_with(site_appearance_visible: true)
            VCR.use_cassette('administration_controller_designer') do
              expect(subject.show_site_appearance_admin_panel?).to eq(true)
            end
          end
        end
      end

      context 'with site_appearance_visible set to false' do
        before(:each) do
          make_site_appearance_visible(false)
          stub_site_chrome_custom_content
        end

        context 'as an anonymous user' do
          it 'should return false' do
            allow(subject).to receive(:current_user).and_return(nil)
            expect(subject.show_site_appearance_admin_panel?).to eq(false)
          end
        end

        context 'as a viewer' do
          it 'should return false' do
            stub_viewer_user(subject)
            expect(subject.show_site_appearance_admin_panel?).to eq(false)
          end
        end

        context 'as a superadmin' do
          it 'should return true' do
            stub_superadmin_user(subject)
            VCR.use_cassette('administration_controller_superadmin') do
              expect(subject.show_site_appearance_admin_panel?).to eq(true)
            end
          end
        end

        context 'as an administrator' do
          it 'should return false' do
            stub_administrator_user(subject)
            expect(subject.show_site_appearance_admin_panel?).to eq(false)
          end
        end

        context 'as a designer' do
          it 'should return false' do
            stub_designer_user(subject)
            expect(subject.show_site_appearance_admin_panel?).to eq(false)
          end
        end
      end

      # EN-6555: Hide site appearance panel if custom h/f is activated
      context 'with custom content in the site chrome config' do
        before(:each) do
          make_site_appearance_visible(true)
          stub_site_chrome_custom_content(:header => { :html => '<div>custom header</div>' })
          stub_site_chrome(SocrataSiteChrome::DomainConfig.default_configuration.first.tap do |config|
            config['properties'].push(
              :name => 'activation_state', :value => { 'custom' => true }
            )
          end)
        end

        context 'as a superadmin' do
          it 'should return false' do
            stub_superadmin_user(subject)
            VCR.use_cassette('administration_controller_superadmin') do
              expect(subject.show_site_appearance_admin_panel?).to eq(false)
            end
          end
        end

        context 'as an administrator' do
          it 'should return false' do
            stub_administrator_user(subject)
            VCR.use_cassette('administration_controller_administrator') do
              expect(subject.show_site_appearance_admin_panel?).to eq(false)
            end
          end
        end

        context 'as a designer' do
          it 'should return false' do
            stub_designer_user(subject)
            VCR.use_cassette('administration_controller_designer') do
              expect(subject.show_site_appearance_admin_panel?).to eq(false)
            end
          end
        end
      end
    end
  end

  private

  def make_site_appearance_visible(state)
    allow(CurrentDomain).to receive(:feature_flags).and_return(
      Hashie::Mash.new.tap { |mash| mash.site_appearance_visible = state }
    )
    init_feature_flag_signaller(:with => { :site_appearance_visible => state })
  end

  def configuration_stub
    '
      [
        {
          "id": 1,
          "name": "Metadata configuration",
          "type": "metadata",
          "properties": [
            {
              "name": "fieldsets",
              "value": [
                {
                  "name": "Metadata",
                  "fields": [
                    {
                      "name": "Field with options",
                      "options": [
                        "option1",
                        "option2"
                      ],
                      "type": "fixed"
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    '
  end

end
