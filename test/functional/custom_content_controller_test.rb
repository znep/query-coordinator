require 'test_helper'
require 'timecop'

class CustomContentControllerTest < ActionController::TestCase

  ANONYMOUS_USER = 'anon'.freeze

  PAGE_PATH = 'hello'.freeze
  PAGE_KEY = ("/#{PAGE_PATH}").freeze
  BASIC_PARAMS = [[:path,  PAGE_PATH], [:action, 'page'], [:controller, 'custom_content'] ].sort.freeze

  def setup
    init_core_session
    init_current_domain

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

  def teardown
    return_filters(@controller)
  end

  def simple_render_with_user
    user = prepare_page
    get :page, :path => PAGE_PATH
    assert_response :success
    assert VersionAuthority.validate_manifest?(@basic_cache_key, user.id)
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

  test 'simple page render and manifest write' do
    simple_render_with_user
  end

  test '304 for etag' do
    simple_render_with_user
    assert_etag_request(@response.headers['ETag'], PAGE_PATH)
  end

  test '304 for Global Manifest Cache' do
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
    user = prepare_page(fixture='test/fixtures/dataslate-private-hello.json', anonymous=false)
    get :page, :path => PAGE_PATH
    assert_response :success
    assert VersionAuthority.validate_manifest?(@basic_cache_key, user.id)
    assert VersionAuthority.validate_manifest?(@basic_cache_key, ANONYMOUS_USER).nil?
    assert_etag_request(@response.headers['ETag'], PAGE_PATH)

    user = prepare_page(fixture='test/fixtures/dataslate-private-hello.json', anonymous=false)
    get :page, :path => PAGE_PATH
    assert_response :success
    assert VersionAuthority.validate_manifest?(@basic_cache_key, user.id)
    assert_etag_request(@response.headers['ETag'], PAGE_PATH)
  end

  test 'Render Page With DataSet' do
    prepare_page(fixture = 'test/fixtures/pie-charts-and-repeaters.json', anonymous = true)
    get :page, :path => 'pie-repeat'
    assert_response :success
    # This seems to be a dumb test, because the returned page content has things like 'Error Bars' in it
    #assert !@response.body.match(/Error/)
    assert_equal 1234, Canvas2::DataContext.manifest.max_age
  end

end
