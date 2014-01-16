require 'test_helper'
require 'rack/etag'
require 'time'
require 'timecop'

class ConditionalRequestHandlerTest < ActionController::TestCase
  include Rack::Test::Methods

  def setup
    @start = Time.at(98765)
    @complicated_manifest = {
        "search-views-some-stuff-that-does-not-matter" => 666,
        "ab12-cd34" => 4321,
        "cd12-ab34" => 1234
    }
    @manifest = Manifest.new
    @manifest.set_manifest(@complicated_manifest)
    Timecop.freeze(@start)
  end

  def teardown
    Timecop.return
  end

  def test_header_set
    response = ActionDispatch::Response.new
    ConditionalRequestHandler.set_conditional_request_headers(response, @manifest)
    assert_equal("\"" + @manifest.hash + "\"", response.headers['ETag'])
    assert_equal(@start.httpdate, response.headers['Last-Modified'])
  end

  class MockApp
    def initialize(headers)
      @headers = headers
    end
    def call(env)
      [200, @headers, ["Hello, World!"]]
    end
  end

  # Explicitly check that our middleware is going nowhere near our headers
  def test_that_rack_does_not_fiddle_with_our_tags
    response = ActionDispatch::Response.new
    ConditionalRequestHandler.set_conditional_request_headers(response, @manifest)
    app = MockApp.new(response.headers)
    tagger = Rack::ETag.new(app)
    rackResponse = tagger.call({})
    assert_equal(response.headers['ETag'], rackResponse[1]['ETag'])
    assert_equal(response.headers['Last-Modified'], rackResponse[1]['Last-Modified'])
  end

  def test_conditional_request_last_modified
    @request.env['HTTP_IF_MODIFIED_SINCE'] = Time.at(0).httpdate
    assert(!ConditionalRequestHandler.check_conditional_request?(@request, @manifest))

    @request.env['HTTP_IF_MODIFIED_SINCE'] = Time.now().httpdate
    assert(ConditionalRequestHandler.check_conditional_request?(@request, @manifest))
  end

  def test_conditional_request_last_modified_zero
    @request.env['HTTP_IF_MODIFIED_SINCE'] = Time.at(0).httpdate
    manifest = Manifest.new
    empty_manifest = {}
    manifest.set_manifest(empty_manifest)
    assert(!ConditionalRequestHandler.check_conditional_request?(@request, manifest))
  end

  def test_conditional_request_etag
    @request.env['HTTP_IF_NONE_MATCH'] = @manifest.hash
    assert(ConditionalRequestHandler.check_conditional_request?(@request, @manifest))

    @request.env['HTTP_IF_NONE_MATCH'] = '"acb", "bcd"'
    assert(!ConditionalRequestHandler.check_conditional_request?(@request, @manifest))

    @request.env['HTTP_IF_NONE_MATCH'] = '"acb", ' + @manifest.hash
    assert(ConditionalRequestHandler.check_conditional_request?(@request, @manifest))

  end

  def test_conditional_request_does_not_match_on_time_if_etag_check_fails
    @request.env['HTTP_IF_NONE_MATCH'] = '"acb", "bcd"'
    @request.env['HTTP_IF_MODIFIED_SINCE'] = Time.now().httpdate
    assert(!ConditionalRequestHandler.check_conditional_request?(@request, @manifest))
  end

end
