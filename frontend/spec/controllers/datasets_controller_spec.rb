require 'rails_helper'

describe DatasetsController do
  include TestHelperMethods

  let(:view_data) do
    {
      :id => 'test-data',
      :createdAt => 1456530636244,
      :columns => [],
      :name => 'Test-Data',
      :viewType => 'tabular',
      :meta_description => 'Test-Test-Data',
      :flags => ['default']
    }.with_indifferent_access
  end

  let(:derived_view_data) do
    {
      :id => 'data-lens',
      :createdAt => 1456530636244,
      :columns => [],
      :name => 'Data-Lens',
      :viewType => 'tabular',
      :displayType => 'data_lens',
      :displayFormat => {
        :data_lens_page_metadata => {
          :name => 'test name',
          :description => 'test description'
        }
      }
    }.with_indifferent_access
  end

  let(:story_view_data) do
    {
      :id => 'test-stry',
      :createdAt => 1456530636244,
      :columns => [],
      :name => 'My Test Story',
      :viewType => 'story'
    }.with_indifferent_access
  end

  let(:view_json) { view_data.to_json }
  let(:view) { View.new(view_data) }
  let(:derived_view) { View.new(derived_view_data) }
  let(:story_view) { View.new(story_view_data) }

  before do
    stub_request(:get, 'http://localhost:8080/manifest_version.json?uid=test-data').
      with(:headers => request_headers).
      to_return(:status => 200, :body => view_json, :headers => {})
  end

  describe 'stats page' do
    let(:stats_response) do
      allow(view).to receive(:can_see_stats?).and_return(can_see_stats)
      get :stats, :id => view.id
      response
    end

    before(:each) do
      init_environment
      allow(subject).to receive(:get_view).and_return(view)
    end

    describe 'user can see stats page' do
      let(:can_see_stats) { true }

      it 'responds success' do
        expect(stats_response).to have_http_status(:success)
      end
    end

    describe 'user cannot see stats page' do
      let(:can_see_stats) { false }

      it 'responds 403' do
        expect(stats_response).to have_http_status(403)
      end
    end
  end

  describe 'Accessing public forms on private datasets' do
    before(:each) do
      init_environment
      allow(subject).to receive(:enable_site_chrome?).and_return(false)
    end

    context 'when logged out' do
      it 'loads the page without error' do
        expect(View).to receive(:find).and_return(view)
        expect(subject).to receive(:using_canonical_url?).and_return(true)
        view.stub(
          :op_measure? => false,
          :is_form? => true,
          :can_add? => true,
          :can_read? => false
        )
        logout
        get :show, :id => 'dont-matr'
        expect(response).to have_http_status(:success)
      end
    end

    context 'when logged in' do

      it 'loads the page without error' do
        init_current_user(controller)
        login
        expect(View).to receive(:find).and_return(view)
        expect(subject).to receive(:using_canonical_url?).and_return(true)
        view.stub(
          :op_measure? => false,
          :is_form? => true,
          :can_add? => true,
          :can_read? => false
        )
        get :show, :id => 'dont-matr'
        expect(response).to have_http_status(:success)
      end

    end

  end

  describe 'SEO friendly dataset show page' do

    before(:each) do
      init_environment
      init_current_user(controller)
      login
      allow(subject).to receive(:get_view).and_return(view)
      allow(subject).to receive(:using_canonical_url?).and_return(true)
      subject.instance_variable_set('@meta', {})
      allow(subject).to receive(:enable_site_chrome?).and_return(false)
      stub_site_chrome
    end

    context 'with DSLP fully enabled' do
      before(:each) do
        allow(subject).to receive(:dataset_landing_page_enabled?).and_return(true)
        allow(view).to receive(:has_landing_page?).and_return(true)
        allow(DatasetLandingPage).to receive(:fetch_all).and_return({})
      end

      describe 'GET /category/view_name/id' do

        before do
          stub_request(:get, 'http://localhost:8080/views/test-data.json').
            with(:headers => request_headers).
            to_return(:status => 200, :body => '', :headers => {})
        end

        it 'should display the DSLP page' do
          get :show, :category => 'Personal', :view_name => 'Test-Data', :id => 'test-data'
          expect(response).to have_http_status(:success)
          expect(response).to render_template(:dataset_landing_page)
        end

      end

      describe 'GET /category/view_name/id/about' do

        before do
          stub_request(:get, 'http://localhost:8080/views/test-data.json').
            with(:headers => request_headers).
            to_return(:status => 200, :body => '', :headers => {})
        end

        it 'should display the DSLP page' do
          get :about, :category => 'Personal', :view_name => 'Test-Data', :id => 'test-data'
          expect(response).to have_http_status(:success)
          expect(response).to render_template(:dataset_landing_page)
        end

      end

      describe 'GET /category/view_name/id' do

        it 'should display the DSLP page' do
          allow(subject).to receive(:using_canonical_url?).and_return(false)
          get :show, :category => 'Personal', :view_name => 'Test-Data', :id => 'test-data'
          expect(response).to have_http_status(:redirect)
        end

      end

    end

    context 'saved visualization canvas' do

      before(:each) do
        allow(view).to receive(:visualization_canvas?).and_return(true)
        allow(view).to receive(:parent_view).and_return(double)
      end

      context 'when feature flag is enabled' do
        before(:each) do
          allow(subject).to receive(:visualization_canvas_enabled?).and_return(true)
        end

        it 'is success' do
          get :show, :category => 'Personal', :view_name => 'Test-Data', :id => 'test-data'
          expect(response).to have_http_status(:success)
        end

        it 'renders visualization_canvas' do
          get :show, :category => 'Personal', :view_name => 'Test-Data', :id => 'test-data'
          expect(response).to render_template(:visualization_canvas)
        end

        context 'when not using canonical_url' do
          let(:canonical_path) { 'the_canonical_path' }

          before(:each) do
            allow(subject).to receive(:using_canonical_url?).and_return(false)
            allow(subject).to receive(:canonical_path).and_return(canonical_path)
          end

          it 'redirects to canonical path' do
            get :show, :category => 'Personal', :view_name => 'Test-Data', :id => 'test-data'
            expect(response).to redirect_to(canonical_path)
          end
        end
      end

      context 'when feature flag is not enabled' do
        before(:each) do
          allow(subject).to receive(:visualization_canvas_enabled?).and_return(false)
        end

        it 'is not found' do
          get :show, :category => 'Personal', :view_name => 'Test-Data', :id => 'test-data'
          expect(response).to have_http_status(:not_found)
        end

      end
    end

    context 'for a published story' do
      before(:each) do
        allow(subject).to receive(:get_view).and_return(story_view)
        CurrentDomain.stub(:default_locale => 'the_default_locale', :cname => 'example.com')
      end

      it 'redirects to the stories#show page' do
        get :show, :id => 'test-stry'

        expect(response).to have_http_status(302)
        expect(response).to redirect_to('//example.com/stories/s/My-Test-Story/test-stry')
      end
    end

    context 'for a published OP measure' do
      before(:each) do
        allow(view).to receive(:op_measure?).and_return(true)
        stub_request(:get, 'http://localhost:8080/measures_v1/test-data.json').
          with(:headers => request_headers).
          to_return(:status => 200, :body => '{}', :headers => {})
      end

      it 'renders the OP measure if the module/feature flag combo is enabled' do
        allow(subject).to receive(:op_standalone_measures_enabled?).and_return(true)
        get :show, :category => 'Personal', :view_name => 'Test-Data', :id => 'test-data'

        expect(response).to have_http_status(:success)
        expect(response).to render_template(:op_measure)
      end

      it 'does not render the OP measure if the module/feature flag combo is disabled' do
        allow(subject).to receive(:op_standalone_measures_enabled?).and_return(false)
        get :show, :category => 'Personal', :view_name => 'Test-Data', :id => 'test-data'

        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe 'OP measure' do
    before(:each) do
      init_environment
      init_current_user(controller)
      login
      stub_site_chrome

      allow(view).to receive(:op_measure?).and_return(true)
      allow(subject).to receive(:get_view).and_return(view)
      allow(subject).to receive(:using_canonical_url?).and_return(true)
      allow(subject).to receive(:op_standalone_measures_enabled?).and_return(true)

      stub_request(:get, 'http://localhost:8080/measures_v1/test-data.json').
        with(:headers => request_headers).
        to_return(:status => 200, :body => '{}', :headers => {})
    end

    describe 'GET /category/view_name/id/edit' do
      it 'should render the OP measure edit page' do
        get :edit, :category => 'Personal', :view_name => 'Test-Data', :id => 'test-data'

        expect(response).to have_http_status(:success)
        expect(response).to render_template(:op_measure)

        # options that are set specifically for edit mode
        expect(subject.instance_variable_get('@site_chrome_admin_header_options')).to eq({size: 'small'})
        expect(subject.instance_variable_get('@body_classes')).to eq('hide-site-chrome')
      end
    end
  end

  describe 'visualization canvas' do

    let(:obe_uid) { 'test-data' }
    let(:nbe_uid) { '1234-abcd' }
    let(:nbe_view) { View.new({ 'id' => nbe_uid }) }

    let(:get_request) { get :create_visualization_canvas, :category => 'Personal', :view_name => 'Test-Data', :id => nbe_uid }
    let(:edit_request) { get :edit, :category => 'Personal', :view_name => 'Test-Data', :id => nbe_uid }

    before(:each) do
      init_environment
      init_current_user(controller)
      login
      allow(subject).to receive(:get_view).and_return(view)
      allow(subject).to receive(:using_canonical_url?).and_return(true)
      subject.instance_variable_set('@meta', {})
      allow(subject).to receive(:enable_site_chrome?).and_return(false)
      stub_site_chrome
      allow(view).to receive(:nbe_view).and_return(nbe_view)
      allow(view).to receive(:visualization_canvas?).and_return(true)
      allow(view).to receive(:new_backend?).and_return(true)
    end

    context 'when feature flag is enabled' do
      before(:each) do
        allow(subject).to receive(:visualization_canvas_enabled?).and_return(true)
      end

      context 'when user is logged in' do
        before(:each) do
          login
        end

        describe '#create_visualization_canvas' do
          it 'is success' do
            get_request
            expect(response).to have_http_status(:success)
          end

          it 'renders template' do
            get_request
            expect(response).to render_template(:visualization_canvas)
          end

          it 'renders styleguide layout' do
            get_request
            expect(response).to render_template(:styleguide)
          end

          it 'assigns display_placeholder_edit_bar' do
            get_request
            expect(assigns[:display_placeholder_edit_bar]).to eq(true)
          end
        end

        describe '#edit' do
          it 'is success' do
            edit_request
            expect(response).to have_http_status(:success)
          end

          it 'renders template' do
            edit_request
            expect(response).to render_template(:visualization_canvas)
          end

          it 'renders styleguide layout' do
            get_request
            expect(response).to render_template(:styleguide)
          end

          it 'assigns site_chrome_admin_header_options' do
            edit_request
            expect(assigns[:site_chrome_admin_header_options]).to eq({size: 'small'})
          end

          it 'assigns body classes' do
            edit_request
            expect(assigns[:body_classes]).to eq('hide-site-chrome')
          end

          it 'assigns display_placeholder_edit_bar' do
            edit_request
            expect(assigns[:display_placeholder_edit_bar]).to eq(false)
          end

          context 'when not using canonical_url' do
            let(:canonical_path) { 'the_canonical_path' }

            before(:each) do
              allow(subject).to receive(:using_canonical_url?).and_return(false)
              allow(subject).to receive(:canonical_path).and_return(canonical_path)
            end

            it 'redirects' do
              edit_request
              expect(response).to redirect_to("#{canonical_path}/edit")
            end
          end
        end
      end

      context 'when user is not logged in' do
        before(:each) do
          allow(subject).to receive(:current_user).and_return(nil)
        end

        it 'is success' do
          get_request
          expect(response).to have_http_status(:success)
        end

        it 'renders template' do
          get_request
          expect(response).to render_template(:visualization_canvas)
        end
      end

      context 'when view is not a dataset' do
        before(:each) do
          allow(subject).to receive(:get_view).and_return(derived_view)
        end

        it 'is not found' do
          get_request
          expect(response).to have_http_status(:not_found)
        end
      end

      context 'when id is OBE 4x4' do
        before(:each) do
          allow(view).to receive(:new_backend?).and_return(false)
        end

        describe '#create_visualization_canvas' do
          it 'redirects' do
            get :create_visualization_canvas, :category => 'Personal', :view_name => 'Test-Data', :id => obe_uid
            expect(response).to have_http_status(:redirect)
            expect(response).to redirect_to("http://test.host/d/#{nbe_uid}/visualization")
          end

          context 'when migration does not exist' do
            before(:each) do
              allow(view).to receive(:nbe_view).and_return(nil)
            end

            it 'is internal server error' do
              get :create_visualization_canvas, :category => 'Personal', :view_name => 'Test-Data', :id => 'test-data'
              expect(response).to have_http_status(:internal_server_error)
            end
          end
        end
      end
    end

    context 'when feature flag is not enabled' do
      before(:each) do
        allow(subject).to receive(:visualization_canvas_enabled?).and_return(false)
      end

      describe '#create_visualization_canvas' do
        it 'is not found' do
          get_request
          expect(response).to have_http_status(:not_found)
        end
      end

      describe '#edit' do
        it 'is not found' do
          edit_request
          expect(response).to have_http_status(:not_found)
        end
      end
    end

  end

  describe 'email dataset' do

    before do
      init_environment
      init_current_user(controller)
      login
      stub_site_chrome
    end

    it 'bails early if there are no email recipients' do
      expect(View).to receive(:find).never
      get :email, :emails => '', :category => 'Personal', :view_name => 'Test-Data', :id => 'test-data'
      expect(response).to have_http_status(:success)
    end

    it 'invokes the email method for each recipient when recipients is an array' do
      view_double = double(View)
      expect(View).to receive(:find).once.and_return(view_double)
      expect(view_double).to receive(:email).twice
      get :email, :emails => ['foo@bar.com', 'bar@foo.com'], :category => 'Personal', :view_name => 'Test-Data', :id => 'test-data'
      expect(response).to have_http_status(:success)
    end

    it 'invokes the email method for each recipient when recipients is an string' do
      view_double = double(View)
      expect(View).to receive(:find).once.and_return(view_double)
      expect(view_double).to receive(:email).twice
      get :email, :emails => 'foo@bar.com, bar@foo.com', :category => 'Personal', :view_name => 'Test-Data', :id => 'test-data'
      expect(response).to have_http_status(:success)
    end

    it 'does not raise when an email recipient is blank' do
      expect(View).to receive(:find).once.and_return(View.new('id' => 'test-test'))
      expect_any_instance_of(View).to receive(:email).twice.and_call_original
      get :email, :emails => 'foo@bar.com, ', :category => 'Personal', :view_name => 'Test-Data', :id => 'test-data'
      expect(response).to have_http_status(:success)
    end

  end

  describe 'edit_metadata' do
    before(:each) do
      init_environment
      init_current_user(controller)
      login
      allow(subject).to receive(:get_view).and_return(derived_view)
      allow(subject).to receive(:using_canonical_url?).and_return(true)
      subject.instance_variable_set('@meta', {})
      allow(subject).to receive(:enable_site_chrome?).and_return(false)
      stub_site_chrome
    end

    context 'when saving a data lens' do
      let(:payload) do
        {
          :name => 'new name',
          :description => 'new description'
        }
      end

      let(:save_payload) do
        {
          :name => 'new name',
          :description => 'new description',
          :displayFormat => {
            :data_lens_page_metadata => {
              :name => 'new name',
              :description => 'new description'
            }
          }
        }
      end

      it 'should write the view name and description through to the display format metadata' do
        stub_request(:put, 'http://localhost:8080/views/data-lens.json').
          with(:body => payload).
          to_return(:status => 200, :body => JSON.dump(payload), :headers => {})

        stub_request(:put, 'http://localhost:8080/views/data-lens.json').
          with(:body => hash_including(save_payload)).
          to_return(:status => 200, :body => '')

        get :edit_metadata, :category => 'Personal', :view_name => 'Problems', :id => 'data-lens', :view => payload
      end
    end

    context 'I18n transforms' do
      render_views

      let(:view) do
        View.new(JSON.parse('{"id":"k466-pv3f","name":"Airline Passenger and Freight Traffic (T100) - Traffic Statistics April 2010","averageRating":0,"createdAt":1500929923,"description":"The Air Carrier Statistics database, also known as the T-100 data bank, contains domestic and international airline market and segment data. certificated U.S. air carriers report monthly air carrier traffic information using Form T-100. Foreign carriers having at least one point of service in the United States or one of its territories report monthly air carrier traffic information using Form T-100(f). The data is collected by the Office of Airline Information, Bureau of Transportation Statistics, Research and Innovative Technology Administration.","displayType":"federated","domainCName":"localhost","downloadCount":0,"hideFromCatalog":false,"hideFromDataJson":false,"newBackend":false,"numberOfComments":0,"oid":1905,"provenance":"official","publicationAppendEnabled":false,"publicationDate":1500929930,"publicationGroup":1896,"publicationStage":"published","rowsUpdatedAt":1500929923,"tableId":1896,"totalTimesRated":0,"viewCount":0,"viewLastModified":1500929930,"viewType":"href","columns":[],"federatedCatalogEntry":{"id":722,"createdAt":1500929923,"federatedCatalogSelectionExternalId":"145.90","federatedCatalogSelectionId":623,"federatedCatalogSource":"https://www.transportation.gov/sites/dot.gov/files/docs/data.json","federatedCatalogSourceId":12,"federatedCatalogSourceType":"open_data_metadata_v1_1","viewId":1905,"viewUid":"k466-pv3f"},"grants":[{"inherited":false,"type":"viewer","flags":["public"]}],"metadata":{"additionalAccessPoints":[{"urls":{"application/zip":"http://apps.bts.gov/publications/green_book/current/GREENBOOK.201004.REL02.09JUL2010.zip"},"title":"Traffic Statistics April 2010"}],"custom_fields":{"Common Core":{"Contact Name":"Jennifer Rodes","Update Frequency":"R/P1M","Temporal Applicability":"R/1990-01-01/P1M","License":"http://www.usa.gov/publicdomain/label/1.0/","Program Code":["021:000"],"Publisher":"Research and Innovative Technology Administration","Is Quality Data":true,"Bureau Code":["021:53"],"Contact Email":"mailto:Jennifer.Rodes@dot.gov","Language":["en-US"],"Described By":"http://www.transtats.bts.gov/DL_SelectFields.asp%3FTable_ID=310\u0026DB_Short_Name=Air%20Carriers","References":"http://www.transtats.bts.gov/DL_SelectFields.asp%3FTable_ID=310\u0026DB_Short_Name=Air%20Carriers","Issued":"2002-10-13","Last Update":"2017-04-19","Theme":"Transportation","Collection":"DOT-145","Unique Identifier":"145.90","Geographic Coverage":"Airports","Access Level Comment":"domestic data no restriction\nForeign\u003c-\u003edomestic not to be released until 3 months after domestic data release\nForeign\u003c-\u003eforeign 3 yeers not available to public.","Public Access Level":"restricted public"}},"accessPoints":{"application/zip":"http://apps.bts.gov/publications/green_book/current/GREENBOOK.201004.REL02.09JUL2010.zip"}},"owner":{"id":"tugg-ikce","displayName":"Randy Antler","screenName":"Randy Antler"},"query":{},"rights":["read","write","add","delete","grant","add_column","remove_column","update_column","update_view","delete_view"],"tableAuthor":{"id":"tugg-ikce","displayName":"Randy Antler","screenName":"Randy Antler"},"tags":["air freight","departures performed","departures scheduled","market","mile","passenger","revenue","seats available","segment"],"flags":["default"]}'))
      end

      it 'should transform the label "Described By" to "Data Dictionary"', :verify_stubs => false do
        VCR.use_cassette('edit_metadata') do
          allow_any_instance_of(ApplicationHelper).to receive(:view_path).and_return('not used')
          stub_user(subject)
          allow(subject).to receive(:get_view).and_return(view)
          get :edit_metadata, :category => view.category, :view_name => view.view, :id => view.id
          expect(response.body).to match(%r(<label class="false" for="view_metadata_custom_fields_Common_Core_Described_By">Data Dictionary</label>))
        end
      end
    end

  end

  describe 'entering DSMP' do
    before(:each) do
      stub_site_chrome
      allow(subject).to receive(:dataset_management_page_enabled?).and_return(true)
    end

    context 'GET /:category/:view_name/:id/revisions/revision_seq' do
      before do
        stub_request(:get, 'http://localhost:8080/views/test-data.json').
          with(:headers => request_headers).
          to_return(:status => 200, :body => '', :headers => {})
      end

      before(:each) do
        init_environment
        allow(subject).to receive(:using_canonical_url?).and_return(true)
      end

      # 4x4 is valid and has revision, directly to path with sequence number
      it 'loads the page without error' do
        allow(DatasetManagementAPI).to receive(:get_revision).and_return({'id' => 1})
        allow(DatasetManagementAPI).to receive(:get_sources_index).and_return([{'resource' => {'id' => 2}}])
        allow(DatasetManagementAPI).to receive(:get_source).and_return([])
        allow(DatasetManagementAPI).to receive(:get_websocket_token).and_return('a token')
        init_current_user(controller)
        login
        expect(View).to receive(:find).and_return(view)
        view.stub(:can_read? => true)
        get :show_revision, :view_name => 'Test-Data', :id => 'test-data', :revision_seq => '0'
        expect(response).to have_http_status(:success)
      end

      # 4x4 is not found should 404
      it '404s for not found views' do
        init_current_user(controller)
        login
        expect(View).to receive(:find).and_raise(CoreServer::ResourceNotFound.new('response'))
        get :show_revision, :view_name => 'Test-Data', :id => 'test-data', :revision_seq => '0'
        expect(response).to have_http_status(:not_found)
      end

      # no permissions for 4x4 should 404
      it '404s if user does not have permission' do
        init_current_user(controller)
        login
        expect(View).to receive(:find).and_return(view)
        view.stub(:can_read? => false)
        get :show_revision, :view_name => 'Test-Data', :id => 'test-data', :revision_seq => '0'
        expect(response).to have_http_status(:forbidden)
      end
    end

    context 'GET /d/:id/revisions/:revision_seq' do
      before do
        init_environment
        init_current_user(controller)
        login
        stub_request(:get, 'http://localhost:8080/views/test-data.json').
          with(:headers => request_headers).
          to_return(:status => 200, :body => '', :headers => {})
      end

      # 4x4 is valid and has revision, directly to path with sequence number
      it 'redirects to the canonical address' do
        init_current_user(controller)
        login
        expect(View).to receive(:find).and_return(view)
        view.stub(:can_read? => true)
        expect(subject).to receive(:using_canonical_url?).and_return(false)
        get :show_revision, :view_name => 'Test-Data', :id => 'test-data', :revision_seq => '0'
        expect(response).to have_http_status(:redirect)
        expect(response['Location']).to end_with('/revisions/0')
      end

      it 'redirects to the canonical address, preserving the full path' do
        expect(View).to receive(:find).and_return(view)
        view.stub(:can_read? => true)
        expect(subject).to receive(:using_canonical_url?).and_return(false)
        get :show_revision, :view_name => 'Test-Data', :id => 'test-data', :revision_seq => '0', :rest_of_path => '/metadata/columns'
        expect(response).to have_http_status(:redirect)
        expect(response['Location']).to end_with('/revisions/0/metadata/columns')
      end
    end

    context 'GET /:category/:view_name/:id/revisions/current' do
      before do
        init_environment
        init_current_user(controller)
        login
      end

      # 4x4 is valid and has revision, redirected from 'current'
      it 'redirects without error' do
        expect(DatasetManagementAPI)
          .to receive(:get_open_revisions)
          .and_return([{'revision_seq' => 1}, {'revision_seq' => 0}])
        get :current_revision, :id => 'test-data'
        expect(response).to have_http_status(:redirect)
        expect(response['Location']).to end_with('/revisions/1')
      end

      it 'redirects without error, preserving the full path' do
        expect(DatasetManagementAPI)
          .to receive(:get_open_revisions)
          .and_return([{'revision_seq' => 1}, {'revision_seq' => 0}])
        get :current_revision, :id => 'test-data', :rest_of_path => '/metadata/columns'
        expect(response).to have_http_status(:redirect)
        expect(response['Location']).to end_with('/revisions/1/metadata/columns')
      end

      # 4x4 does not have any open revisions should 404 at 'current'
      it '404s when there are no open revisions' do
        expect(DatasetManagementAPI)
          .to receive(:get_open_revisions)
          .and_return([])
        get :current_revision, :id => 'test-data'
        expect(response).to have_http_status(:not_found)
      end
    end

    context 'GET /d/id/revisions/current' do

      before do
        init_environment
      end

      # 4x4 is valid and has revision, directly to path with sequence number
      it 'redirects to a path with the revision sequence' do
        init_current_user(controller)
        login
        expect(DatasetManagementAPI)
          .to receive(:get_open_revisions)
          .and_return([{'revision_seq' => 1}, {'revision_seq' => 0}])

        get :current_revision, :id => 'test-data'
        expect(response).to have_http_status(:redirect)
        expect(response['Location']).to end_with('/revisions/1')
      end

      # 4x4 is valid and has revision, directly to path with sequence number
      it 'redirects to a path with the revision sequence, preserving the full path' do
        init_current_user(controller)
        login
        expect(DatasetManagementAPI)
          .to receive(:get_open_revisions)
          .and_return([{'revision_seq' => 1}, {'revision_seq' => 0}])

        get :current_revision, :id => 'test-data', :rest_of_path => '/metadata/columns'
        expect(response).to have_http_status(:redirect)
        expect(response['Location']).to end_with('/revisions/1/metadata/columns')
      end
    end
  end
end
