require_relative '../test_helper'

class PolaroidTest < Test::Unit::TestCase

  def polaroid
    @polaroid ||= Polaroid.new
  end


  # Called before every test method runs. Can be used
  # to set up fixture information.
  def setup
    CurrentDomain.stubs(domain: stub(cname: 'localhost'))
    Polaroid.any_instance.stubs(:connection_details => {
      'address' => 'localhost',
      'port' => '1337'
    })
  end

  def test_connection_details
    assert(polaroid.address)
    assert(polaroid.port)
  end

  def test_service_end_point
    assert_equal("http://#{polaroid.address}:#{polaroid.port}", polaroid.end_point)
  end

  def test_end_point_does_not_include_port_when_absent
    Polaroid.any_instance.stubs(:connection_details => {
      'address' => 'localhost',
      'port' => nil
    })
    assert_equal("http://#{polaroid.address}", polaroid.end_point)
  end

  def test_end_point_does_include_port_when_present
    Polaroid.any_instance.stubs(:connection_details => {
      'address' => 'localhost',
      'port' => 1337
    })
    assert_equal("http://#{polaroid.address}:#{polaroid.port}", polaroid.end_point)
  end

  def test_end_point_raises_on_blank_address
    Polaroid.any_instance.stubs(:connection_details => {
      'address' => nil,
      'port' => nil
    })
    assert_raises(SocrataHttp::ConfigurationError) { polaroid.end_point }
  end

  def test_fetch_image_success
    page_id = 'test-page'
    field_id = 'test_field'
    test_body = 'insert image here'

    prepare_stubs(verb: :get, page_id: page_id, field_id: field_id, body: test_body)
    result = polaroid.fetch_image(page_id, field_id)
    assert_equal({
      'status' => '200',
      'body' => 'insert image here',
      'content_type' => 'image/png'
    }, result)
  end

  def test_failure_json_response
    page_id = 'test-page'
    field_id = 'test_field'

    prepare_stubs(
      verb: :get,
      code: '500',
      page_id: page_id,
      field_id: field_id,
      response_class: Net::HTTPInternalServerError,
      content_type: 'application/json',
      body: '{"error":true,"reason":"Error"}'
    )
    result = polaroid.fetch_image(page_id, field_id)
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

    prepare_stubs(
      code: '500',
      verb: :get,
      page_id: page_id,
      field_id: field_id,
      response_class: Net::HTTPInternalServerError
    )
    result = polaroid.fetch_image(page_id, field_id)
    assert_equal({
      'status' => '500',
      'content_type' => 'application/json',
      'body' => {
        'error' => true,
        'reason' => 'Received error status and unexpected return type from image service',
        'details' => { 'content_type' => 'image/png' }
      }
    }, result)
  end

  private

  # noinspection RubyArgCount
  def prepare_stubs(options)
    @mock_response = stub(
      code: options[:code] || '200',
      body: options.fetch(:body, 'no body'),
      content_type: options.fetch(:content_type, 'image/png')
    )

    response_class = options.fetch(:response_class, Net::HTTPSuccess)

    @mock_response.stubs(:kind_of?).returns(false)
    @mock_response.stubs(:kind_of?).with do |klass|
      response_class <= klass
    end.returns(true)

    @mock_response.stubs(:to_hash).returns({})

    @mock_request = {}
    @mock_request.expects(:body).returns(options.fetch(:body, ''))

    "Net::HTTP::#{options[:verb].capitalize}".constantize.expects(:new).
      with("#{polaroid.end_point}/domain/#{polaroid.cname}/view/#{options[:page_id]}/#{options[:field_id]}.png").
      returns(@mock_request)

    @mock_http = stub
    @mock_http.expects(:request)

    Net::HTTP.expects(:start).with(
      polaroid.address,
      polaroid.port
    ).yields(@mock_http).returns(@mock_response)
  end

  def teardown
    Net::HTTP.unstub(:start)
  end

end
