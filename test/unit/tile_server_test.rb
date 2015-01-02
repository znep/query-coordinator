require_relative '../test_helper'

class TileServerTest < Test::Unit::TestCase

  def tileserver
    @tileserver ||= TileServer.new
  end


  # Called before every test method runs. Can be used
  # to set up fixture information.
  def setup
    CurrentDomain.stubs(domain: stub(cname: 'localhost'))
    TileServer.any_instance.stubs(:connection_details => {
      'address' => 'localhost',
      'port' => '4242'
    })
  end

  def test_connection_details
    assert(tileserver.address)
    assert(tileserver.port)
  end

  def test_service_end_point
    assert_equal("http://#{tileserver.address}:#{tileserver.port}", tileserver.end_point)
  end

  def test_end_point_does_not_include_port_when_absent
    TileServer.any_instance.stubs(:connection_details => {
      'address' => 'localhost',
      'port' => nil
    })
    assert_equal("http://#{tileserver.address}", tileserver.end_point)
  end

  def test_end_point_does_include_port_when_present
    TileServer.any_instance.stubs(:connection_details => {
      'address' => 'localhost',
      'port' => 13237
    })
    assert_equal("http://#{tileserver.address}:#{tileserver.port}", tileserver.end_point)
  end

  def test_end_point_raises_on_blank_address
    TileServer.any_instance.stubs(:connection_details => {
      'address' => nil,
      'port' => nil
    })
    assert_raises(SocrataHttp::ConfigurationError) { tileserver.end_point }
  end

  def test_fetch_tile_all_args_required
    good_args = {
      :page_id => 'asdf-fdsa',
      :field_id => 'field',
      :zoom => 15,
      :x_coord => 1,
      :y_coord => 2,
      '$limit' => 1123
    }

    assert_raises(ArgumentError) { tileserver.fetch_tile }
    assert_raises(KeyError) { tileserver.fetch_tile({}) }

    good_args.each do |key, value|
      assert_raises(KeyError) { tileserver.fetch_tile(good_args.except(key)) }
    end
  end

  def test_fetch_tile_success_no_where
    page_id = 'test-page'
    field_id = 'test_field'
    zoom = 14
    x_coord = 2
    y_coord = 3
    limit = 11088
    test_body = 'insert juicy binary tile here'

    prepare_stubs(
      :verb => :get,
      :page_id => page_id,
      :field_id => field_id,
      :zoom => zoom,
      :x_coord => x_coord,
      :y_coord => y_coord,
      '$limit' => limit,
      :body => test_body
    )

    result = tileserver.fetch_tile(
      :page_id => page_id,
      :field_id => field_id,
      :zoom => zoom,
      :x_coord => x_coord,
      :y_coord => y_coord,
      '$limit' => limit
    )

    assert_equal({
      'status' => '200',
      'body' => test_body,
      'content_type' => 'application/octet-stream'
    }, result)
  end

  def test_fetch_tile_success_with_where
    page_id = 'test-page'
    field_id = 'test_field'
    zoom = 14
    x_coord = 2
    y_coord = 3
    limit = 11088
    where = 'test_field=3'
    test_body = 'insert juicy binary tile here'

    prepare_stubs(
      :verb => :get,
      :page_id => page_id,
      :field_id => field_id,
      :zoom => zoom,
      :x_coord => x_coord,
      :y_coord => y_coord,
      '$limit' => limit,
      '$where' => where,
      :body => test_body
    )

    result = tileserver.fetch_tile(
      :page_id => page_id,
      :field_id => field_id,
      :zoom => zoom,
      :x_coord => x_coord,
      :y_coord => y_coord,
      '$limit' => limit,
      '$where' => where
    )

    assert_equal({
      'status' => '200',
      'body' => test_body,
      'content_type' => 'application/octet-stream'
    }, result)
  end

  def test_pass_app_token_to_socrata_http
    page_id = 'test-page'
    field_id = 'test_field'
    zoom = 14
    x_coord = 2
    y_coord = 3
    limit = 11088
    app_token = 'aaaabbbb'

    expected_params = {
      :verb => :get,
      :request_id => nil,
      :cookies => nil,
      :path => 'tiles/test-page/test_field/14/2/3.pbf?$limit=11088&$where=0%3D0',
      :app_token => app_token
    }

    TileServer.any_instance.expects(:issue_request).
      with(expected_params).
      returns(:status => '200', :body => '', :content_type => '')

    result = tileserver.fetch_tile(
      :page_id => page_id,
      :field_id => field_id,
      :zoom => zoom,
      :x_coord => x_coord,
      :y_coord => y_coord,
      '$limit' => limit,
      '$$app_token' => app_token
    )
  end

  def test_failure_json_response
    page_id = 'test-page'
    field_id = 'test_field'
    zoom = 14
    x_coord = 2
    y_coord = 3
    limit = 11088

    prepare_stubs(
      :code => '500',
      :verb => :get,
      :page_id => page_id,
      :field_id => field_id,
      :zoom => zoom,
      :x_coord => x_coord,
      :y_coord => y_coord,
      '$limit' => limit,
      :kind_of => false,
      :content_type => 'application/json',
      :body => '{"error":true,"reason":"Error"}'
    )

    result = tileserver.fetch_tile(
      :page_id => page_id,
      :field_id => field_id,
      :zoom => zoom,
      :x_coord => x_coord,
      :y_coord => y_coord,
      '$limit' => limit
    )

    assert_equal({
      'status' => '500',
      'content_type' => 'application/json',
      'body' => {
        'error' => true,
        'reason' => 'Error'
      }
    }, result)
  end

  def test_failure_nonjson_response
    page_id = 'test-page'
    field_id = 'test_field'
    zoom = 14
    x_coord = 2
    y_coord = 3
    limit = 11088

    prepare_stubs(
      :code => '500',
      :verb => :get,
      :page_id => page_id,
      :field_id => field_id,
      :zoom => zoom,
      :x_coord => x_coord,
      :y_coord => y_coord,
      '$limit' => limit,
      :kind_of => false
    )

    result = tileserver.fetch_tile(
      :page_id => page_id,
      :field_id => field_id,
      :zoom => zoom,
      :x_coord => x_coord,
      :y_coord => y_coord,
      '$limit' => limit
    )

    assert_equal({
      'status' => '500',
      'content_type' => 'application/json',
      'body' => {
        'error' => true,
        'reason' => 'Received error status and unexpected return type from TileServer',
        'details' => { 'content_type' => 'application/octet-stream' }
      }
    }, result)
  end

  private

  # noinspection RubyArgCount
  def prepare_stubs(options)
    @mock_response = stub(
      code: options[:code] || '200',
      body: options.fetch(:body, 'no body'),
      content_type: options.fetch(:content_type, 'application/octet-stream'),
      kind_of?: options.fetch(:kind_of, true)
    )

    @mock_request = {}
    @mock_request.expects(:body).returns(options.fetch(:body, ''))

    where_clause = options['$where'] || '0=0'

    "Net::HTTP::#{options[:verb].capitalize}".constantize.expects(:new).
      with("#{tileserver.end_point}/tiles/#{options[:page_id]}/#{options[:field_id]}/#{options[:zoom]}/#{options[:x_coord]}/#{options[:y_coord]}.pbf?$limit=#{options['$limit']}&$where=#{CGI::escape(where_clause)}").
      returns(@mock_request)

    @mock_http = stub
    @mock_http.expects(:request)

    Net::HTTP.expects(:start).with(
      tileserver.address,
      tileserver.port
    ).yields(@mock_http).returns(@mock_response)
  end

  def teardown
    Net::HTTP.unstub(:start)
  end

end
