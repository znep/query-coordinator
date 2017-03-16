require_relative '../test_helper'

class SodaFountainTest < Minitest::Test

  def setup
    CurrentDomain.stubs(domain: stub(cname: 'localhost'))
    SodaFountain.any_instance.stubs(:connection_details => {
      'address' => 'localhost',
      'port' => '6010'
    })
  end

  def test_soda_fountain_connection_details
    assert(soda_fountain.address)
    assert(soda_fountain.port)
  end

  def test_service_end_point
    assert_equal(
      "http://#{soda_fountain.address}:#{soda_fountain.port}/dataset-rollup",
      soda_fountain.end_point
    )
  end

  def test_get_extent_succeeds
    response = { 'status' => '200', 'body' => { 'extent' => {} } }
    SodaFountain.any_instance.stubs(:issue_request => response)
    assert_equal(response, soda_fountain.get_extent(
      dataset_id: 'q77b-s2zi',
      field: 'my_location_field'
    ))
  end

  def test_delete_rollup_table_succeeds
    response = { 'status' => '204' }
    SodaFountain.any_instance.stubs(:issue_request => response)
    assert_equal(response, soda_fountain.delete_rollup_table(
      dataset_id: 'q77b-s2zi',
      identifier: 'rollup'
    ))
  end

  def test_create_rollup_table_succeeds
    response = { 'status' => '204' }
    SodaFountain.any_instance.stubs(:issue_request => response)
    assert_equal(response, soda_fountain.create_or_update_rollup_table(
      dataset_id: 'q77b-s2zi',
      identifier: 'rollup',
      soql: 'select ward, count(*) as value group by ward'
    ))
  end

  def test_update_rollup_table_succeeds
    response = { 'status' => '204' }
    SodaFountain.any_instance.stubs(:issue_request => response)
    assert_equal(response, soda_fountain.create_or_update_rollup_table(
      dataset_id: 'q77b-s2zi',
      identifier: 'rollup',
      soql: 'select district, count(*) as value group by district'
    ))
  end

  def test_includes_request_id_when_present
    args = {
      dataset_id: 'q77b-s2zi',
      identifier: 'rollup',
      soql: 'select district, count(*) as value group by district',
      request_id: 'request id'
    }
    prepare_stubs(verb: :put, code: '204', data: args)
    soda_fountain.create_or_update_rollup_table(args)
    assert_equal('request id', @mock_request['X-Socrata-RequestId'])
  end

  def test_does_not_include_request_id_when_absent
    args = {
      dataset_id: 'q77b-s2zi',
      identifier: 'rollup',
      soql: 'select district, count(*) as value group by district'
    }
    prepare_stubs(verb: :put, code: '204', data: args)
    soda_fountain.create_or_update_rollup_table(args)
    refute(@mock_request['X-Socrata-RequestId'])
  end

  def test_includes_cookies_when_present
    args = {
      dataset_id: 'q77b-s2zi',
      identifier: 'rollup',
      soql: 'select district, count(*) as value group by district',
      cookies: 'some cookies'
    }
    prepare_stubs(verb: :put, code: '204', data: args)
    soda_fountain.create_or_update_rollup_table(args)
    assert_equal('some cookies', @mock_request['Cookie'])
  end

  def test_does_not_include_cookies_when_absent
    args = {
      dataset_id: 'q77b-s2zi',
      identifier: 'rollup',
      soql: 'select district, count(*) as value group by district'
    }
    prepare_stubs(verb: :put, code: '204', data: args)
    soda_fountain.create_or_update_rollup_table(args)
    refute(@mock_request['Cookie'])
  end

  private

  # noinspection RubyArgCount
  def prepare_stubs(options)
    @mock_response = stub(
      code: options[:code] || '200',
      body: nil
    )

    @mock_request = {}
    @mock_request.expects(:body=).with(JSON.dump(soql: options[:data][:soql]))
    @mock_request.expects(:body).returns(options[:body])

    path = "_#{options[:data][:dataset_id]}/#{options[:data][:identifier]}"
    "Net::HTTP::#{options[:verb].capitalize}".constantize.expects(:new).
      with("#{soda_fountain.end_point}/#{path}").returns(@mock_request)

    @mock_http = stub
    @mock_http.expects(:request)

    Net::HTTP.expects(:start).with(
      soda_fountain.address,
      soda_fountain.port
    ).yields(@mock_http).returns(@mock_response)
  end

  private

  def soda_fountain
    @soda_fountain ||= SodaFountain.new
  end

end
