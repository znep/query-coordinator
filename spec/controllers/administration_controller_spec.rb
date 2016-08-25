require 'rails_helper'

describe AdministrationController do
  include TestHelperMethods

  let(:view) { double(View, :createdAt => 1456530636244, :columns => []) }

  # Can't use self-verifying stubs because the User class uses method_missing for all of the data properties
  describe 'georegions', :verify_stubs => false do
    before(:each) do
      init_current_user(controller)
      init_current_domain
      allow(subject).to receive(:default_url_options).and_return({})
      allow(subject).to receive(:sync_logged_in_cookie)
      allow(subject).to receive(:set_user)
      allow(subject).to receive(:set_meta)
      allow(subject).to receive(:feature_flag?).and_return(true)
      allow(subject).to receive(:incomplete_curated_region_jobs).and_return([])
      allow(subject).to receive(:failed_curated_region_jobs).and_return([])
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

      describe 'logged in as viewer user' do
        before(:each) do
          stub_viewer_user
        end

        it 'should be forbidden' do
          get :georegions
          expect(response).to have_http_status(:forbidden)
        end
      end

      describe 'logged in as admin user' do
        before(:each) do
          stub_administrator_user
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
          expect(view_model.curated_regions).to contain_exactly(an_instance_of(CuratedRegion), an_instance_of(CuratedRegion),an_instance_of(CuratedRegion))
          expect(view_model.translations).to be_an_instance_of(LocalePart)
        end

      end

      describe 'logged in as superadmin user' do

        it 'responds successfully with a 200 HTTP status code' do
          stub_superadmin_user
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
        stub_administrator_user

        # TODO: Remove this stub once using synthetic spatial lens shape ids exclusively
        feature_flags = Hashie::Mash.new
        feature_flags.enable_synthetic_spatial_lens_id = false
        allow(CurrentDomain).to receive(:feature_flags).and_return(feature_flags)
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
        stub_administrator_user
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
        stub_administrator_user
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
        stub_administrator_user
      end

      it 'redirects to /admin/geo' do
        delete :remove_georegion, :id => 1
        expect(response).to redirect_to('/admin/geo')
      end
    end

    describe 'PUT /admin/geo/:id/enable' do
      let(:curated_region_double) { double(CuratedRegion, :id => 1, :name => 'My Region') }

      before(:each) do
        stub_administrator_user
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
        stub_administrator_user
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
        stub_administrator_user
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
      allow(Configuration).to receive(:find_by_type).and_return(Configuration.parse('[{}]'))
      allow_any_instance_of(Configuration).to receive(:update_or_create_property)
      allow(CurrentDomain).to receive(:user_can?).with(anything, UserRights::EDIT_SITE_THEME).and_return(true)
    end

    describe '#create_metadata_field' do
      it 'post /metadata/:fieldset/create' do

        post :create_metadata_field, :fieldset => 'foo', :newFieldName => 'new_fieldname'

        expect(flash[:notice]).to include('Field Successfully Created')
        expect(response).to redirect_to(:action => 'metadata')
      end
    end

  end

  describe 'site appearance panel', :verify_stubs => false do

    context 'show_site_chrome_admin_panel helper method' do
      context 'as an anonymous user' do
        it 'should return false' do
          allow(subject).to receive(:current_user).and_return(nil)
          expect(subject.show_site_chrome_admin_panel?).to eq(false)
        end
      end

      context 'as a viewer' do
        it 'should return false' do
          stub_viewer_user
          expect(subject.show_site_chrome_admin_panel?).to eq(false)
        end
      end

      context 'as a superadmin' do
        it 'should return true' do
          stub_superadmin_user
          expect(subject.show_site_chrome_admin_panel?).to eq(true)
        end
      end

      context 'as an administrator' do
        it 'should return true' do
          stub_administrator_user
          expect(subject.show_site_chrome_admin_panel?).to eq(true)
        end
      end

      context 'as a designer' do
        it 'should return true' do
          stub_designer_user
          expect(subject.show_site_chrome_admin_panel?).to eq(true)
        end
      end

    end

  end

  private

  def stub_administrator_user
    user = User.new
    allow(user).to receive(:is_superadmin?).and_return(false)
    allow(user).to receive(:roleName).and_return('administrator')
    allow(user).to receive(:role_name).and_return('administrator')
    allow(subject).to receive(:current_user).and_return(user)
  end

  def stub_superadmin_user
    user = User.new
    allow(user).to receive(:is_superadmin?).and_return(true)
    allow(subject).to receive(:current_user).and_return(user)
  end

  def stub_designer_user
    user = User.new
    allow(user).to receive(:is_designer?).and_return(true)
    allow(user).to receive(:roleName).and_return('designer')
    allow(user).to receive(:role_name).and_return('designer')
    allow(subject).to receive(:current_user).and_return(user)
  end

  def stub_viewer_user
    user = User.new
    allow(user).to receive(:is_superadmin?).and_return(false)
    allow(user).to receive(:roleName).and_return('viewer')
    allow(subject).to receive(:current_user).and_return(user)
  end

end
