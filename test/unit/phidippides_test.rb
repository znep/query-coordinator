require_relative '../test_helper'

class PhidippidesTest < Test::Unit::TestCase

  def phidippides
    @phidippides ||= Phidippides.new
  end

  def setup
    CurrentDomain.stubs(domain: stub(cname: 'localhost'))
    stub_feature_flags_with(:metadata_transition_phase, '0')
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

  def test_update_dataset_metadata
    prepare_stubs(body: dataset_metadata, path: 'datasets/q77b-s2zi', verb: :put, request_body: dataset_metadata)
    stub_feature_flags_with(:metadata_transition_phase, '0')
    result = phidippides.update_dataset_metadata(dataset_metadata, request_id: 'request_id')
    assert_equal(dataset_metadata, result[:body])

    prepare_stubs(body: nil, path: 'v1/id/vtvh-wqgq/dataset', verb: :put, request_body: v1_dataset_metadata)
    stub_feature_flags_with(:metadata_transition_phase, '1')
    result = phidippides.update_dataset_metadata(v1_dataset_metadata, request_id: 'request_id')
    assert_equal('200', result[:status])
  end

  def test_create_page_metadata
    prepare_stubs(body: new_page_metadata, path: 'pages', verb: :post, request_body: new_page_metadata)
    stub_feature_flags_with(:metadata_transition_phase, '0')
    result = phidippides.create_page_metadata(new_page_metadata, request_id: 'request_id')
    assert_equal(new_page_metadata, result[:body])
  end

  def test_fetch_page_metadata
    prepare_stubs(body: page_metadata, path: 'pages/four-four', verb: :get)
    stub_feature_flags_with(:metadata_transition_phase, '0')
    result = phidippides.fetch_page_metadata('four-four', request_id: 'request_id')
    assert_equal(page_metadata, result[:body])
  end

  def test_update_page_metadata
    prepare_stubs(body: page_metadata, path: 'pages/desk-chek', verb: :put, request_body: page_metadata)
    stub_feature_flags_with(:metadata_transition_phase, '0')
    result = phidippides.update_page_metadata(page_metadata, request_id: 'request_id')
    assert_equal(page_metadata, result[:body])
  end

  def test_fetch_pages_for_dataset
    prepare_stubs(body: pages_for_dataset, path: 'datasets/four-four/pages', verb: :get)
    stub_feature_flags_with(:metadata_transition_phase, '0')
    result = phidippides.fetch_pages_for_dataset('four-four', request_id: 'request_id')
    assert_equal(pages_for_dataset, result[:body])
  end

  def test_fetch_dataset_metadata
    prepare_stubs(body: dataset_metadata, path: 'datasets/four-four', verb: :get)
    stub_feature_flags_with(:metadata_transition_phase, '0')
    result = phidippides.fetch_dataset_metadata('four-four', request_id: 'request_id')
    assert_equal(dataset_metadata, result[:body])

    prepare_stubs(body: dataset_metadata, path: 'v1/id/four-four/dataset', verb: :get)
    stub_feature_flags_with(:metadata_transition_phase, '1')
    result = phidippides.fetch_dataset_metadata('four-four', request_id: 'request_id')
    assert_equal(dataset_metadata, result[:body])
  end

  def test_pages_for_dataset_with_dataset_object_succeeds
    Phidippides.any_instance.stubs(
      fetch_pages_for_dataset: { status: '200', body: pages_for_dataset }
    )
    stub_feature_flags_with(:metadata_transition_phase, '0')
    pages = phidippides.fetch_pages_for_dataset(OpenStruct.new(id: 'q77b-s2zi'))[:body]
    assert(pages[:publisher].length > 0, 'expected to find one or more "publisher" in the "pages" response')
    assert(pages[:publisher].all? { |page| page[:id] == 'q77b-s2zi'}, 'expected all pages to belong to the same dataset')

    Phidippides.any_instance.stubs(
      fetch_pages_for_dataset: { status: '200', body: pages_for_dataset }
    )
    stub_feature_flags_with(:metadata_transition_phase, '1')
    pages = phidippides.fetch_pages_for_dataset(OpenStruct.new(id: 'q77b-s2zi'))[:body]
    assert(pages[:publisher].length > 0, 'expected to find one or more "publisher" in the "pages" response')
    assert(pages[:publisher].all? { |page| page[:id] == 'q77b-s2zi'}, 'expected all pages to belong to the same dataset')
  end

  def test_create_dataset_metadata
    prepare_stubs(body: new_dataset_metadata, path: 'datasets', verb: :post, request_body: new_dataset_metadata)
    result = phidippides.create_dataset_metadata(new_dataset_metadata, request_id: 'request_id')
    assert_equal(new_dataset_metadata, result[:body])
  end

  def test_pages_for_dataset_with_id_string_succeeds
    Phidippides.any_instance.stubs(
      fetch_pages_for_dataset: { status: '200', body: pages_for_dataset }
    )
    stub_feature_flags_with(:metadata_transition_phase, '0')
    pages = phidippides.fetch_pages_for_dataset('q77b-s2zi')[:body]
    assert(pages[:publisher].length > 0, 'expected to find one or more "publisher" in the "pages" response')
    assert(pages[:publisher].all? { |page| page[:id] == 'q77b-s2zi'}, 'expected all pages to belong to the same dataset')

    Phidippides.any_instance.stubs(
      fetch_pages_for_dataset: { status: '200', body: pages_for_dataset }
    )
    stub_feature_flags_with(:metadata_transition_phase, '1')
    pages = phidippides.fetch_pages_for_dataset('q77b-s2zi')[:body]
    assert(pages[:publisher].length > 0, 'expected to find one or more "publisher" in the "pages" response')
    assert(pages[:publisher].all? { |page| page[:id] == 'q77b-s2zi'}, 'expected all pages to belong to the same dataset')
  end

  def test_pages_for_dataset_with_id_in_hash_succeeds
    Phidippides.any_instance.stubs(
      fetch_pages_for_dataset: { status: '200', body: pages_for_dataset }
    )
    stub_feature_flags_with(:metadata_transition_phase, '0')
    pages = phidippides.fetch_pages_for_dataset(id: 'q77b-s2zi')[:body]
    assert(pages[:publisher].length > 0, 'expected to find one or more "publisher" in the "pages" response')
    assert(pages[:publisher].all? { |page| page[:id] == 'q77b-s2zi'}, 'expected all pages to belong to the same dataset')

    Phidippides.any_instance.stubs(
      fetch_pages_for_dataset: { status: '200', body: pages_for_dataset }
    )
    stub_feature_flags_with(:metadata_transition_phase, '1')
    pages = phidippides.fetch_pages_for_dataset(id: 'q77b-s2zi')[:body]
    assert(pages[:publisher].length > 0, 'expected to find one or more "publisher" in the "pages" response')
    assert(pages[:publisher].all? { |page| page[:id] == 'q77b-s2zi'}, 'expected all pages to belong to the same dataset')
  end

  def test_fetch_pages_for_dataset_with_invalid_dataset_object_raises
    assert_raises(ArgumentError) do
      phidippides.fetch_pages_for_dataset(OpenStruct.new(id: nil))
    end
    assert_raises(ArgumentError) do
      phidippides.fetch_pages_for_dataset(OpenStruct.new(id: ''))
    end
    assert_raises(ArgumentError) do
      phidippides.fetch_pages_for_dataset(OpenStruct.new)
    end
  end

  def test_fetch_pages_for_dataset_with_invalid_dataset_id_string_raises
    assert_raises(ArgumentError) do
      phidippides.fetch_pages_for_dataset('invalid')
    end
    assert_raises(ArgumentError) do
      phidippides.fetch_pages_for_dataset('')
    end
    assert_raises(ArgumentError) do
      phidippides.fetch_pages_for_dataset(nil)
    end
  end

  def test_fetch_pages_for_dataset_with_invalid_dataset_hash_raises
    assert_raises(ArgumentError) do
      phidippides.fetch_pages_for_dataset(id: nil)
    end
    assert_raises(ArgumentError) do
      phidippides.fetch_pages_for_dataset(id: '')
    end
    assert_raises(ArgumentError) do
      phidippides.fetch_pages_for_dataset({})
    end
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
    @page_metadata ||= JSON.parse(File.read("#{Rails.root}/test/fixtures/page-metadata.json")).with_indifferent_access
  end

  def dataset_metadata
    @dataset_metdata ||= JSON.parse(File.read("#{Rails.root}/test/fixtures/dataset-metadata.json")).with_indifferent_access
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

  def pages_for_dataset
    JSON.parse('{"publisher":[{"id":"q77b-s2zi","pageId":"vwwn-6r7g"}],"user":[]}').with_indifferent_access
  end

  def new_page_metadata
    JSON.parse('{"datasetId":"q77b-s2zi","pageId":"vwwn-6r7g"}').with_indifferent_access
  end

  def v1_dataset_metadata
    @v1_dataset_metdata ||= JSON.parse(File.read("#{Rails.root}/test/fixtures/v1-dataset-metadata.json")).with_indifferent_access
  end

end
