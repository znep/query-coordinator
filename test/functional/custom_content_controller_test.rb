require 'test_helper'
require 'timecop'

class CustomContentControllerTest < ActionController::TestCase
  ANONYMOUS_USER = "anon".freeze
  GLOBAL_USER = "".freeze
  PAGE_PATH = "hello".freeze
  PAGE_KEY = ("/" + PAGE_PATH).freeze

  def setup
    init_core_session
    init_current_domain
    VersionAuthority.expire(PAGE_KEY, GLOBAL_USER)
    VersionAuthority.expire(PAGE_KEY, ANONYMOUS_USER)
    VersionAuthority.expire(PAGE_KEY, "test-test")
    assert VersionAuthority.validate_manifest?(PAGE_KEY, GLOBAL_USER).nil?
    assert VersionAuthority.validate_manifest?(PAGE_KEY, ANONYMOUS_USER).nil?
    assert VersionAuthority.validate_manifest?(PAGE_KEY, "test-test").nil?
  end

  def teardown
    return_filters(@controller)
  end

  def simple_render_with_user
    user = prepare_page()
    get :page, {:path => PAGE_PATH.dup}
    assert_response :success
    assert VersionAuthority.validate_manifest?(PAGE_KEY, user.id)
  end

  def prepare_page(fixture="test/fixtures/dataslate-private-hello.json", anonymous=false)
    user = init_current_user(@controller) unless anonymous
    page = Page.parse(File.open(fixture).read)
    @controller.page_override = page
    user
  end

  def assert_etag_request(valid_etag, path)
    # return 304 if the etag is valid
    @request.env['HTTP_IF_NONE_MATCH'] = valid_etag
    get :page, {:path => path}
    assert_response 304

    # rerender with invalid etag
    @request.env['HTTP_IF_NONE_MATCH'] = "PEANUT BUTTER"
    get :page, {:path => path}
    assert_response :success
  end

  test "simple page render and manifest write" do
    simple_render_with_user
  end

  test "304 for etag" do
    simple_render_with_user
    assert_etag_request(@response.headers['ETag'], PAGE_PATH.dup)
  end

  test "304 for Global Manifest Cache" do
    prepare_page(fixture="test/fixtures/dataslate-global-hello.json", anonymous=true)
    init_current_user(@controller, nil)
    get :page, {:path => PAGE_PATH.dup}
    assert_response :success
    assert VersionAuthority.validate_manifest?(PAGE_KEY, GLOBAL_USER)
    assert VersionAuthority.validate_manifest?(PAGE_KEY, ANONYMOUS_USER).nil?
    assert_etag_request(@response.headers['ETag'], PAGE_PATH.dup)
  end

  test "304 for User Manifest Cache" do
    user = prepare_page(fixture="test/fixtures/dataslate-private-hello.json", anonymous=false)
    get :page, {:path => PAGE_PATH.dup}
    assert_response :success
    assert VersionAuthority.validate_manifest?(PAGE_KEY, GLOBAL_USER).nil?
    assert VersionAuthority.validate_manifest?(PAGE_KEY, ANONYMOUS_USER).nil?
    assert_etag_request(@response.headers['ETag'], PAGE_PATH.dup)

    user = prepare_page(fixture="test/fixtures/dataslate-private-hello.json", anonymous=false)
    get :page, {:path => PAGE_PATH.dup}
    assert_response :success
    assert VersionAuthority.validate_manifest?(PAGE_KEY, user.id)
    assert_etag_request(@response.headers['ETag'], PAGE_PATH.dup)
  end

  test "Render Page With DataSet" do
    load_sample_data("test/fixtures/sample-data.json")
    prepare_page(fixture="test/fixtures/pie-charts-and-repeaters.json", anonymous=true)
    get :page, {:path => "pie-repeat"}
    assert_response :success
    assert !@response.body.match(/Error/)
    assert_equal 1234, Canvas2::DataContext.manifest.max_age
  end

end
