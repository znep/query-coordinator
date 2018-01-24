require 'rails_helper'

describe CustomContentController do
  include TestHelperMethods

  let(:page_path) { 'hello' }

  let(:dataslate_config) { '' }
  let(:existing_routes) { '' }

  before do
    init_environment

    stub_request(:get, "http://localhost:8080/pages.json?method=getLightweightRouting").
      to_return(:status => 200, :body => existing_routes, :headers => {})

    stub_request(:get, "http://localhost:8080/configurations.json?defaultOnly=true&merge=true&type=dataslate_config").
      to_return(:status => 200, :body => dataslate_config, :headers => {})
  end

  describe 'routing specs' do
    it 'known dataslate pages route here' do
      test_paths = %w(
        countystat/objective/housing
      )
      stub_request(:get, 'http://localhost:8080/configurations.json?defaultOnly=true&merge=true&type=catalog_landing_page').
        with(:headers => {'Accept'=>'*/*', 'Accept-Encoding'=>'gzip;q=1.0,deflate;q=0.6,identity;q=0.3', 'User-Agent'=>'Ruby', 'X-Socrata-Host'=>'localhost'}).
        to_return(:status => 200, :body => fixture('catalog_landing_page_configuration.json'), :headers => {})

      stub_request(:get, 'http://localhost:8080/configurations.json?defaultOnly=true&merge=true&type=catalog').
        with(:headers => {'Accept'=>'*/*', 'Accept-Encoding'=>'gzip;q=1.0,deflate;q=0.6,identity;q=0.3', 'User-Agent'=>'Ruby', 'X-Socrata-Host'=>'localhost'}).
        to_return(:status => 200, :body => '', :headers => {})

      test_paths.each do |path|
        expect(get: path).to route_to({ controller: 'custom_content', action: 'page', path: path })
      end
    end
  end

  describe 'request specs' do
    def prepare_page(fixture_name)
      allow(DataslateRouting).to receive(:for).and_return({
        page: Page.parse(fixture(fixture_name))
      })
    end

    it 'simple page render and manifest write' do
      prepare_page('dataslate-private-hello.json')
      get :page, :path => page_path
      expect(response).to have_http_status(:ok)
    end

    it 'simple redirect' do
      prepare_page('dataslate-redirect.json')
      get :page, :path => 'not-here'
      expect(response).to have_http_status(301)
      expect(response).to redirect_to('/here-instead')
    end

    it 'redirect with response code' do
      prepare_page('dataslate-redirect-with-code.json')
      get :page, :path => 'not-here'
      expect(response).to have_http_status(302)
      expect(response).to redirect_to('/here-instead')
    end

    it 'Render Page With DataSet' do
      prepare_page('pie-charts-and-repeaters.json')
      get :page, :path => 'pie-repeat'
      expect(response).to have_http_status(:ok)
    end

    it 'Render home page with embedded catalog' do
      Manifest.new.tap do |manifest|
        manifest.set_manifest(max_age: nil)
        allow(Rails.cache).to receive(:read).and_return(manifest)
      end

      allow(controller).to receive(:prepare_config) {}
      allow(controller).to receive(:get_config).and_return(
        Hashie::Mash.new(json_fixture('dataslate-default-homepage.json'))
      )

      get :page
      expect(response).to have_http_status(:ok)
    end
  end

  context 'when staging_lockdown is turned on' do
    let(:test_path) { '/test-path' }
    let(:existing_routes) do
      [{
        permission: 'public',
        path: test_path
      }].to_json
    end

    before(:each) do
      allow(CurrentDomain).to receive(:feature?).with(:staging_lockdown).and_return(true)
      allow(DataslateRouting).to receive(:for).and_return({
        page: Page.parse({ path: test_path, permission: 'public' }.to_json)
      })
    end

    trigger_lockdown = proc do
      expect(controller).to receive(:check_lockdown).once.and_call_original
      get :page, :path => test_path
      expect(response).to have_http_status(302)
    end

    pass_through_lockdown = proc do
      expect(controller).to receive(:check_lockdown).never.and_call_original
      get :page, :path => test_path
      expect(response).to have_http_status(:ok)
    end

    it 'should require a user', &trigger_lockdown

    context 'with a staging_lockdown_exception in place' do
      let(:dataslate_config) do
        [{
          type: 'dataslate_config',
          properties: dataslate_config_properties
        }].to_json
      end
      let(:dataslate_config_properties) { [] }

      it 'should still require a user', &trigger_lockdown

      context 'and an exception exists for this path' do
        let(:dataslate_config_properties) do
          [{
            name: 'staging_lockdown_exceptions',
            value: [ test_path ]
          }] 
        end

        it 'should not require a user', &pass_through_lockdown
      end

      context 'and an exception exists for this path as a regex' do
        let(:dataslate_config_properties) do
          [{
            name: 'staging_lockdown_exceptions',
            value: [ '/test-\w+' ]
          }] 
        end

        it 'should not require a user', &pass_through_lockdown
      end

      context 'and an exception exists but not for this path' do
        let(:dataslate_config_properties) do
          [{
            name: 'staging_lockdown_exceptions',
            value: [ '/some-other-page' ]
          }] 
        end

        it 'should not require a user', &trigger_lockdown
      end
    end
  end

end
