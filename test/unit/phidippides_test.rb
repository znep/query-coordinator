require_relative '../test_helper'

class PhidippidesTest < Test::Unit::TestCase

  def phidippides
    @phidippides ||= Phidippides.new
  end

  def setup
    CurrentDomain.stubs(domain: stub(cname: 'localhost'))
    Phidippides.any_instance.stubs(:connection_details => {
      'address' => 'localhost',
      'port' => '2401'
    })
  end

  def test_phidippides_connection_details
    assert(phidippides.address)
    assert(phidippides.port)
  end

  def test_service_end_point
    assert_equal("http://#{phidippides.address}:#{phidippides.port}", phidippides.end_point)
  end

  def test_fetch_pages_for_dataset
    prepare_stubs(body: pages_for_dataset, path: 'datasets/four-four/pages', verb: :get)
    result = phidippides.fetch_pages_for_dataset('four-four', request_id: 'request_id')
    assert_equal(pages_for_dataset, result[:body])
  end

  def test_includes_request_id_when_present
    prepare_stubs(body: pages_for_dataset, path: 'datasets/four-four/pages', verb: :get)
    phidippides.fetch_pages_for_dataset('four-four', request_id: 'request_id')
    assert_equal('request_id', @mock_request['X-Socrata-RequestId'])
  end

  def test_does_not_include_request_id_when_absent
    prepare_stubs(body: pages_for_dataset, path: 'datasets/four-four/pages', verb: :get)
    phidippides.fetch_pages_for_dataset('four-four')
    refute(@mock_request['X-Socrata-RequestId'])
  end

  def test_includes_cookies_when_present
    prepare_stubs(body: pages_for_dataset, path: 'datasets/four-four/pages', verb: :get)
    phidippides.fetch_pages_for_dataset('four-four', cookies: 'some cookies')
    assert_equal('some cookies', @mock_request['Cookie'])
  end

  def test_does_not_include_cookies_when_absent
    prepare_stubs(body: pages_for_dataset, path: 'datasets/four-four/pages', verb: :get)
    phidippides.fetch_pages_for_dataset('four-four')
    refute(@mock_request['Cookie'])
  end

  def test_fetch_page_metadata
    prepare_stubs(body: page_metadata, path: 'datasets/four-four', verb: :get)
    result = phidippides.issue_request(verb: :get, path: 'datasets/four-four', request_id: 'request_id')
    assert_equal(page_metadata, result[:body])
  end

  def test_create_page_metadata
    prepare_stubs(body: new_page_metadata, path: 'pages', verb: :post, request_body: new_page_metadata)
    result = phidippides.create_page_metadata(new_page_metadata, request_id: 'request_id')
    assert_equal(new_page_metadata, result[:body])
  end

  def test_update_page_metadata
    prepare_stubs(body: page_metadata, path: 'pages/desk-chek', verb: :put, request_body: page_metadata)
    result = phidippides.update_page_metadata(page_metadata, request_id: 'request_id')
    assert_equal(page_metadata, result[:body])
  end

  def test_fetch_dataset_metadata
    prepare_stubs(body: dataset_metadata, path: 'datasets/four-four', verb: :get)
    result = phidippides.fetch_dataset_metadata('four-four', request_id: 'request_id')
    assert_equal(dataset_metadata, result[:body])
  end

  def test_create_dataset_metadata
    prepare_stubs(body: new_dataset_metadata, path: 'datasets', verb: :post, request_body: new_dataset_metadata)
    result = phidippides.create_dataset_metadata(new_dataset_metadata, request_id: 'request_id')
    assert_equal(new_dataset_metadata, result[:body])
  end

  def test_update_dataset_metadata
    prepare_stubs(body: dataset_metadata, path: 'datasets/q77b-s2zi', verb: :put, request_body: dataset_metadata)
    result = phidippides.update_dataset_metadata(dataset_metadata, request_id: 'request_id')
    assert_equal(dataset_metadata, result[:body])
  end

  def test_issue_request_success_response
    prepare_stubs(body: { key: 'value' }, path: 'datasets/four-four', verb: :get)
    result = phidippides.issue_request(verb: :get, path: 'datasets/four-four', request_id: 'request_id')
    assert_equal({'key' => 'value'}, result[:body])
  end

  def test_issue_request_failure_response
    prepare_stubs(code: '405', path: 'datasets/four-four', verb: :get, kind_of: false)
    result = phidippides.issue_request(verb: :get, path: 'datasets/four-four', request_id: 'request_id')
    assert_equal({'status' => '405', 'body' => nil, 'error' => nil}, result)
  end

  def test_issue_request_invalid_response
    prepare_stubs(body: 'junk', path: 'datasets/four-four', verb: :get)
    result = phidippides.issue_request(verb: :get, path: 'datasets/four-four', request_id: 'request_id')
    assert_equal({'status' => '500', 'body' => '"junk"', 'error' => '757: unexpected token at \'"junk"\''}, result)
  end

  def test_raises_when_create_dataset_metadata_is_missing_keys
    assert_raises(ArgumentError) do
      phidippides.create_dataset_metadata({})
    end
  end

  def test_raises_when_create_page_metadata_is_missing_keys
    assert_raises(ArgumentError) do
      phidippides.create_page_metadata({})
    end
  end

  private

  # noinspection RubyArgCount
  def prepare_stubs(options)
    @mock_response = stub(
      code: options[:code] || '200',
      body: options[:body].try(:to_json),
      kind_of?: options.fetch(:kind_of, true)
    )

    @mock_request = {}
    @mock_request.expects(:body=).with(JSON.dump(options[:request_body])) if options[:request_body].present?
    @mock_request.expects(:body).returns(options[:body])

    "Net::HTTP::#{options[:verb].capitalize}".constantize.expects(:new).
      with("#{phidippides.end_point}/#{options[:path]}").returns(@mock_request)

    @mock_http = stub
    @mock_http.expects(:request)

    Net::HTTP.expects(:start).with(
      phidippides.address,
      phidippides.port
    ).yields(@mock_http).returns(@mock_response)
  end

  def teardown
    Net::HTTP.unstub(:start)
  end

  def page_metadata
    @page_metadata ||= JSON.parse(File.read("#{Rails.root}/test/fixtures/page-metadata.json"))
  end

  def dataset_metadata
    @dataset_metdata ||= JSON.parse(File.read("#{Rails.root}/test/fixtures/dataset-metadata.json"))
  end

  def pages_for_dataset
    JSON.parse('{"publisher":[{"id":"q77b-s2zi","pageId":"vwwn-6r7g"}],"user":[]}')
  end

  def new_page_metadata
    JSON.parse('{"datasetId":"q77b-s2zi","pageId":"vwwn-6r7g"}')
  end

  def new_dataset_metadata
    {
      'id' => 'plac-hldr',
      'rowDisplayUnit' => 'rowDisplayUnit',
      'defaultAggregateColumn' => 'defaultAggregateColumn',
      'domain' => 'localhost',
      'ownerId' => 'four-four',
      'updatedAt' => Time.now.utc.iso8601,
      'columns' => []
    }
  end

end
