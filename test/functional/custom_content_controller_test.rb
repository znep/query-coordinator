require 'test_helper'
require 'timecop'

class CustomContentControllerTest < ActionController::TestCase

  ANONYMOUS_USER = 'anon'.freeze

  PAGE_PATH = 'hello'.freeze
  BASIC_PARAMS = [[:path,  PAGE_PATH], [:action, 'page'], [:controller, 'custom_content']].sort.freeze

  def setup
    init_core_session
    init_current_domain
    stub_site_chrome

    @basic_cache_params = {
      'domain' => CurrentDomain.cname,
      'locale' => I18n.locale,
      'page_updated' => nil,
      'domain_updated' => CurrentDomain.default_config_updated_at,
      'params' => Digest::MD5.hexdigest(BASIC_PARAMS.to_json)
    }
    @basic_cache_key  = AppHelper.instance.cache_key('canvas2-page', @basic_cache_params)

    VersionAuthority.expire(@basic_cache_key, ANONYMOUS_USER)
    VersionAuthority.expire(@basic_cache_key, 'test-test')
    assert VersionAuthority.validate_manifest?(@basic_cache_key, ANONYMOUS_USER).nil?
    assert VersionAuthority.validate_manifest?(@basic_cache_key, 'test-test').nil?
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
    @controller.page_override = page
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

  test '304 for etag' do
    stub_rails_cache
    simple_render_with_user
    assert_etag_request(@response.headers['ETag'], PAGE_PATH)
  end

  test '304 for Global Manifest Cache' do
    stub_rails_cache
    prepare_page(fixture='test/fixtures/dataslate-global-hello.json', anonymous=true)
    init_current_user(@controller, ANONYMOUS_USER)
    get :page, :path => PAGE_PATH
    assert_response :success
    assert VersionAuthority.validate_manifest?(@basic_cache_key, ANONYMOUS_USER)
    # Subsequent requests should NOT return 304s
    @request.env['HTTP_IF_NONE_MATCH'] = @response.headers['ETag']
    get :page, :path => PAGE_PATH
    assert_response 304
  end

  test '304 for User Manifest Cache' do
    stub_rails_cache
    prepare_page(fixture='test/fixtures/dataslate-private-hello.json', anonymous=false)
    get :page, :path => PAGE_PATH
    assert_response :success
    assert_etag_request(@response.headers['ETag'], PAGE_PATH)

    prepare_page(fixture='test/fixtures/dataslate-private-hello.json', anonymous=false)
    get :page, :path => PAGE_PATH
    assert_response :success
    assert_etag_request(@response.headers['ETag'], PAGE_PATH)
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
