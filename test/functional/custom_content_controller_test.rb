require 'test_helper'
require 'timecop'

class CustomContentControllerTest < ActionController::TestCase
  ANONYMOUS_USER = "anon".freeze
  GLOBAL_USER = "".freeze

  def setup
    init_core_session
    init_current_domain
    VersionAuthority.expire("hello", GLOBAL_USER)
    VersionAuthority.expire("hello", ANONYMOUS_USER)
    VersionAuthority.expire("hello", "test-test")
    assert VersionAuthority.validate_manifest?("hello", GLOBAL_USER).nil?
    assert VersionAuthority.validate_manifest?("hello", ANONYMOUS_USER).nil?
    assert VersionAuthority.validate_manifest?("hello", "test-test").nil?
  end

  def teardown
    return_filters(@controller)
  end

  def simple_render_with_user
    user = prepare_page()
    get :page, {:path => "hello"}
    assert_response :success
    assert VersionAuthority.validate_manifest?("hello", user.id)
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
    assert_etag_request(@response.headers['ETag'], "hello")
  end

  test "304 for Global Manifest Cache" do
    prepare_page(fixture="test/fixtures/dataslate-global-hello.json", anonymous=true)
    init_current_user(@controller, nil)
    get :page, {:path => "hello"}
    assert_response :success
    assert VersionAuthority.validate_manifest?("hello", GLOBAL_USER)
    assert VersionAuthority.validate_manifest?("hello", ANONYMOUS_USER).nil?
    assert_etag_request(@response.headers['ETag'], "hello")
  end

  test "304 for User Manifest Cache" do
    user = prepare_page(fixture="test/fixtures/dataslate-private-hello.json", anonymous=false)
    get :page, {:path => "hello"}
    assert_response :success
    assert VersionAuthority.validate_manifest?("hello", GLOBAL_USER).nil?
    assert VersionAuthority.validate_manifest?("hello", ANONYMOUS_USER).nil?
    assert_etag_request(@response.headers['ETag'], "hello")

    user = prepare_page(fixture="test/fixtures/dataslate-private-hello.json", anonymous=false)
    get :page, {:path => "hello"}
    assert_response :success
    assert VersionAuthority.validate_manifest?("hello", user.id)
    assert_etag_request(@response.headers['ETag'], "hello")
  end

end
