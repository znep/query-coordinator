require 'rails_helper'

# This file is a port of the MiniTest file that was contemporaneous with the
# RSpec file for the same class, for some reason. It was deemed easier to have a
# second test file than to merge the two files into one.

describe DatasetsController do
  include TestHelperMethods

  let(:view) { View.new(json_fixture('sample-data.json')) }
  let(:mock_metadata) do
    double(Metadata, {
      :feature_flags => Hashie::Mash.new,
      :attachments => [],
      :data => Hashie::Mash.new
    })
  end
  let(:dsmtime) { 12345 }
  let(:dummy_params) do
    { :foo => 'foo', :bar => 'bar' }
  end
  let(:contact_form_data) do
    {
      :method => 'flag',
      :type => 'other',
      :subject => "A visitor has sent you a message about your 'Test for Andrew' 'Socrata' dataset",
      :message => 'message body',
      :from_address => 'user@example.com'
    }
  end

  before do
    allow(View).to receive(:find).and_return(view)

    allow(view).to receive(:metadata).and_return(mock_metadata)
    allow(view).to receive(:mtime_according_to_core).and_return(dsmtime)
  end

  describe 'unauthenticated user' do
    before do
      init_environment(test_user: TestHelperMethods::ANONYMOUS)
    end

    it 'should returns 304 if no changes have occurred for anonymous user' do
      request.env['HTTP_IF_NONE_MATCH'] = "#{dsmtime}-ANONYMOUS-#{controller.get_revision}"
      get :show, :id => 'four-four'
      expect(response).to have_http_status(304)
    end
  end

  describe 'authenticated user' do
    describe 'with disable_obe_direction == true' do
      before do
        init_environment(
          test_user: TestHelperMethods::ADMIN,
          site_chrome: true,
          feature_flags: {
            :disable_obe_redirection => true
          }
        )
      end

      it 'should not redirect to OBE view page when the feature flag disable_obe_redirection is true and there is no OBE view' do
        allow(view).to receive(:new_backend?).and_return(true)
        allow(View).to receive(:migrations).and_raise(CoreServer::ResourceNotFound, 'No migrations found')

        get :show, :category => 'dataset', :view_name => 'dataset', :id => 'four-four'
        expect(response).not_to redirect_to('/d/olde-four')
      end

      it 'should redirect to OBE view page when the feature flag disable_obe_redirection is true and there is an OBE view' do
        allow(view).to receive(:new_backend?).and_return(true)
        allow(View).to receive(:migrations).and_return({ 'obeId' => 'olde-four' })

        get :show, :category => 'dataset', :view_name => 'dataset', :id => 'four-four'
        expect(response).to redirect_to('/d/olde-four')
      end
    end

    describe 'with disable_obe_direction == false' do
      before do
        init_environment(
          test_user: TestHelperMethods::ADMIN,
          site_chrome: true,
          feature_flags: {
            disable_obe_redirection: false
          }
        )
      end

      # https://opendata.test-socrata.com/dataset/28-Formwidtest/zwjk-24g6.json?text=1
      # should redirect to https://opendata.test-socrata.com/resource/zwjk-24g6.json?text=1
      it 'should redirects to format URLs include query string parameters' do
        params = { id: view.id, format: 'json' }.merge(dummy_params)
        get :show, params
        expect(response).to redirect_to(resource_url(params))
      end

      it 'should generic dataset paths route here' do
        expect(get: 'datasets/four-four').to route_to(
          controller: 'datasets',
          action: 'show',
          id: 'four-four'
        )
      end

      it 'should seo dataset paths route here' do
        expect(get: 'category/name/four-four').to route_to(
          controller: 'datasets',
          action: 'show',
          category: 'category',
          view_name: 'name',
          id: 'four-four'
        )
      end

      it 'should not redirect for datasets that are on the NBE and user is admin' do
        allow(View).to receive(:migrations).and_return({ 'obeId' => 'olde-four' })
        get :show, :id => 'four-four'
        expect(response).not_to redirect_to('/d/olde-four')
      end

      it 'should special snowflake SF api geo datasets do not die' do
        allow(view).to receive(:is_api_geospatial?).and_return(true)
        get :show, :category => 'dataset', :view_name => 'dataset', :id => 'four-four'
        expect(response).to have_http_status(:found)
      end

      describe 'with DSLP fully enabled' do
        before do
          allow(controller).to receive(:dataset_landing_page_enabled?).and_return(true)
          allow(View).to receive(:migrations).and_return({'nbeId' => 'test-nbe1'})
        end

        describe 'if the view is a dataset' do
          describe 'display the DLSP' do
            before do
              allow(DatasetLandingPage).to receive(:fetch_derived_views).and_return([])
              stub_request(:get, 'http://localhost:8080/domains/test.host.json').
                with(:headers => { 'X-Socrata-Host' => 'test.host' }).
                to_return(
                  :status => 200,
                  :body => '{"id": "four-four", "cname": "test.host", "configsLastUpdatedAt": 1477332982}',
                  :headers => {}
                )
              allow(controller).to receive(:get_view).and_return(view)
              allow(view).to receive(:dataset?).and_return(true)
              allow(view).to receive(:find_dataset_landing_page_related_content).and_return([])
              allow(view).to receive(:featured_content).and_return([])
            end

            it 'should successfully on the show path' do
              allow(DatasetLandingPage).to receive(:fetch_all).and_return({})
              get :show, :category => 'Personal', :view_name => 'Test-Data', :id => 'test-data'
              expect(response).to have_http_status(:ok)
              expect(controller).to render_template('dataset_landing_page')
            end

            it 'should successfully when /about is appended to the show path' do
              allow(DatasetLandingPage).to receive(:fetch_all).and_return({})
              get :about, :category => 'Personal', :view_name => 'Test-Data', :id => 'test-data'
              expect(response).to have_http_status(:ok)
              expect(controller).to render_template('dataset_landing_page')
            end
          end

          it 'should display the grid view when /data is appended to the show path' do
            get :show, :category => 'Personal', :view_name => 'Test-Data', :id => 'test-data', :bypass_dslp => true
            expect(response).to have_http_status(:ok)
            expect(controller).not_to render_template('dataset_landing_page')
          end
        end

        describe 'if the view is not a dataset' do
          before do
            allow(controller).to receive(:get_view).and_return(view)
            allow(view).to receive(:dataset?).and_return(false)
            allow(view).to receive(:featured_content).and_return([])
          end

          it 'should not show the dslp at /about' do
            get :about, :category => 'Personal', :view_name => 'Test-Data', :id => 'test-data'
            expect(response).to have_http_status(:ok)
            expect(controller).not_to render_template('dataset_landing_page')
          end

          it 'should show the normal display view at show' do
            get :show, :category => 'Personal', :view_name => 'Test-Data', :id => 'test-data'
            expect(response).to have_http_status(:ok)
            expect(controller).not_to render_template('dataset_landing_page')
          end
        end
      end

      # Leaving CSRF token validation disabled for email is not without some risk. It could allow
      # malicious attackers to attempt to use the site as an email relay, among other things.
      # However, the risk is somewhat mitgated by the fact that a captcha is included on the form.
      describe 'without a valid request forgery token' do
        before do
          stub_request(:post, "http://localhost:8080/views/test-data.json?from_address=user@example.com&id=1234-abcd&message=message%20body&method=flag&subject=A%20visitor%20has%20sent%20you%20a%20message%20about%20your%20'Test%20for%20Andrew'%20'Socrata'%20dataset&type=other").
            with(:body => "{}", :headers => request_headers).
            to_return(:status => 200, :body => "", :headers => {})
        end

        it 'should login and return a JSON success result' do
          allow(SocrataRecaptcha).to receive(:valid).and_return(true)
          allow(controller).to receive(:protect_against_forgery?).and_return(true)

          post :validate_contact_owner, contact_form_data.merge(:id => '1234-abcd', :format => :data)
          expect(response).to have_http_status(:ok)
          expect(response.body).to eq({ success: true }.to_json)
        end

      end

      describe 'contacting dataset owner' do
        before do
          stub_request(:post, "http://localhost:8080/views/test-data.json?from_address=user@example.com&id=1234-abcd&message=message%20body&method=flag&subject=A%20visitor%20has%20sent%20you%20a%20message%20about%20your%20'Test%20for%20Andrew'%20'Socrata'%20dataset&type=other").
            with(:body => "{}", :headers => request_headers).
            to_return(:status => 200, :body => "", :headers => {})
        end

        it 'should return a JSON failure result if view is missing' do
          allow(controller).to receive(:get_view).and_return(nil)

          post :contact_dataset_owner, contact_form_data.merge(:id => '1234-abcd')
          expect(response).to have_http_status(400)
          expect(response.body).to eq({ success: false, message: 'Can\'t find view: 1234-abcd' }.to_json)
        end

        it 'should return a JSON failure result if missing params' do
          post :contact_dataset_owner, {:id => '1234-abcd'}
          expect(response).to have_http_status(400)
          expect(response.body).to eq({ success: false, message: 'Missing key: type' }.to_json)
        end

        it 'should return a JSON failure result if Recaptcha is invalid' do
          allow(SocrataRecaptcha).to receive(:valid).and_return(false)

          post :contact_dataset_owner, contact_form_data.merge(:id => '1234-abcd', :recaptcha_response_token => 'wombats-in-top-hats')
          expect(response).to have_http_status(400)
          expect(response.body).to eq({ success: false, message: 'Invalid Recaptcha' }.to_json)
        end

        it 'should return a JSON success result if Recaptcha is valid' do
          allow(SocrataRecaptcha).to receive(:valid).and_return(true)

          post :contact_dataset_owner, contact_form_data.merge(:id => '1234-abcd', :recaptcha_response_token => 'wombats-in-top-hats')
          expect(response).to have_http_status(:ok)
          expect(response.body).to eq({ success: true }.to_json)
        end
      end

    end
  end
end
