require 'test_helper'
require 'timecop'

class CustomContentControllerTest < ActionController::TestCase
  ANONYMOUS_USER = 'anon'.freeze

  PAGE_PATH = 'hello'.freeze
  BASIC_PARAMS = [[:path,  PAGE_PATH], [:action, 'page'], [:controller, 'custom_content']].sort.freeze

  def setup
    init_environment

    stub_request(:get, "http://localhost:8080/pages.json?method=getLightweightRouting").
      to_return(:status => 200, :body => "", :headers => {})

    @basic_cache_params = {
      'domain' => CurrentDomain.cname,
      'locale' => I18n.locale,
      'page_updated' => nil,
      'domain_updated' => CurrentDomain.default_config_updated_at,
      'params' => Digest::MD5.hexdigest(BASIC_PARAMS.to_json)
    }
    @basic_cache_key  = AppHelper.instance.cache_key('canvas2-page', @basic_cache_params)
  end

  def stub_rails_cache
    Manifest.new.tap do |manifest|
      manifest.set_manifest(max_age: nil)
      Rails.cache.stubs(read: manifest)
    end
  end

  def simple_render_with_user
    user = prepare_page
    get :page, :path => PAGE_PATH
    assert_response :success
  end

  def prepare_page(fixture='test/fixtures/dataslate-private-hello.json', anonymous = false)
    user = nil
    user = init_current_user(@controller) unless anonymous
    page = Page.parse(File.open(fixture).read)
    DataslateRouting.stubs(:for => { page: page })
    user
  end

  def assert_etag_request(valid_etag, path)
    # return 304 if the etag is valid
    @request.env['HTTP_IF_NONE_MATCH'] = valid_etag
    get :page, :path => path
    assert_response 304

    # rerender with invalid etag
    @request.env['HTTP_IF_NONE_MATCH'] = 'PEANUT BUTTER'
    get :page, :path => path
    assert_response :success
  end

  test 'known dataslate pages route here' do
    test_paths = %w(
      countystat/objective/housing
    )
    stub_request(:get, 'http://localhost:8080/configurations.json?defaultOnly=true&merge=true&type=catalog_landing_page').
      with(:headers => {'Accept'=>'*/*', 'Accept-Encoding'=>'gzip;q=1.0,deflate;q=0.6,identity;q=0.3', 'User-Agent'=>'Ruby', 'X-Socrata-Host'=>'localhost'}).
      to_return(:status => 200, :body => File.read('test/fixtures/catalog_landing_page_configuration.json'), :headers => {})

    stub_request(:get, 'http://localhost:8080/configurations.json?defaultOnly=true&merge=true&type=catalog').
      with(:headers => {'Accept'=>'*/*', 'Accept-Encoding'=>'gzip;q=1.0,deflate;q=0.6,identity;q=0.3', 'User-Agent'=>'Ruby', 'X-Socrata-Host'=>'localhost'}).
      to_return(:status => 200, :body => '', :headers => {})

    test_paths.each do |path|
      assert_routing(path, { controller: 'custom_content', action: 'page', path: path })
    end
  end

  test 'simple page render and manifest write' do
    simple_render_with_user
  end

  test 'simple redirect' do
    prepare_page(fixture='test/fixtures/dataslate-redirect.json', anonymous=true)
    get :page, :path => 'not-here'
    assert_response 301
    assert_redirected_to '/here-instead'
  end

  test 'redirect with response code' do
    prepare_page(fixture='test/fixtures/dataslate-redirect-with-code.json', anonymous=true)
    get :page, :path => 'not-here'
    assert_response 302
    assert_redirected_to '/here-instead'
  end

  test 'Render Page With DataSet' do
    load_sample_data('test/fixtures/sample-data.json')
    prepare_page(fixture = 'test/fixtures/pie-charts-and-repeaters.json', anonymous = true)
    get :page, :path => 'pie-repeat'
    assert_response :success
  end

  test 'Render home page with embedded catalog' do
    stub_rails_cache
    Page.stubs(:[] => nil)
    @controller.stubs(:get_config => Hashie::Mash.new(
      JSON.parse(File.read('test/fixtures/dataslate-default-homepage.json'))
    ))
    @controller.stubs(:prepare_config)
    get :page
    assert_response :success
  end

end
