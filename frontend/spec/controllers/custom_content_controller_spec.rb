require 'rails_helper'

describe CustomContentController do
  include TestHelperMethods

  let(:page_path) { 'hello' }

  before do
    init_environment

    stub_request(:get, "http://localhost:8080/pages.json?method=getLightweightRouting").
      to_return(:status => 200, :body => "", :headers => {})

    stub_request(:get, "http://localhost:8080/configurations.json?defaultOnly=true&merge=true&type=dataslate_config").
      to_return(:status => 200, :body => "", :headers => {})
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

end
