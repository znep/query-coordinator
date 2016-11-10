require_relative '../test_helper'

class PhidippidesTest < Minitest::Test

  def phidippides
    Phidippides.any_instance.expects(:connection_details).never
    @phidippides ||= Phidippides.new('localhost', 2401)
  end

  def setup
    # noinspection RubyArgCount
    init_current_domain
  end

  def test_phidippides_has_address_and_port_specified_in_constructor
    assert(phidippides.address.present?)
    assert(phidippides.port.present?)
  end

  def test_phidippides_has_address_and_port_specified_in_environment
    ENV.stubs(:[]).with('PHIDIPPIDES_ADDRESS').returns('env-host')
    ENV.stubs(:[]).with('PHIDIPPIDES_PORT').returns('1303')
    env_phidippides = Phidippides.new
    assert_equal('env-host', env_phidippides.address)
    assert_equal(1303, env_phidippides.port)
    ENV.unstub(:[])
  end

  def test_phidippides_has_address_and_port_specified_in_zookeeper_and_only_calls_connection_details_once
    Phidippides.any_instance.expects(:connection_details).once.returns('address' => 'localpost', 'port' => 2402)
    zk_phidippides = Phidippides.new
    assert_equal('localpost', zk_phidippides.address)
    assert_equal(2402, zk_phidippides.port)
  end

  def test_phidippides_raises_on_invalid_address_or_port
    assert_raises(Phidippides::InvalidHostAddressException) { Phidippides.new('b@d_host', 1234) }
    assert_raises(Phidippides::InvalidHostPortException) { Phidippides.new('localhost', '123.0') }
  end

  def test_service_end_point
    assert_equal("http://#{phidippides.address}:#{phidippides.port}", phidippides.end_point)
  end

  def test_includes_request_id_when_present
    prepare_stubs(body: pages_for_dataset, path: 'v1/id/four-four/pages', verb: :get)
    phidippides.fetch_pages_for_dataset('four-four', request_id: 'request_id')
    assert_equal('request_id', @mock_request['X-Socrata-RequestId'])
  end

  def test_does_not_include_request_id_when_absent
    prepare_stubs(body: pages_for_dataset, path: 'v1/id/four-four/pages', verb: :get)
    phidippides.fetch_pages_for_dataset('four-four')
    refute(@mock_request['X-Socrata-RequestId'])
  end

  def test_includes_cookies_when_present
    prepare_stubs(body: pages_for_dataset, path: 'v1/id/four-four/pages', verb: :get)
    phidippides.fetch_pages_for_dataset('four-four', cookies: 'some cookies')
    assert_equal('some cookies', @mock_request['Cookie'])
  end

  def test_does_not_include_cookies_when_absent
    prepare_stubs(body: pages_for_dataset, path: 'v1/id/four-four/pages', verb: :get)
    phidippides.fetch_pages_for_dataset('four-four')
    refute(@mock_request['Cookie'])
  end

  def test_update_dataset_metadata
    prepare_stubs(body: nil, path: 'v1/id/thw2-8btq/dataset', verb: :put, request_body: v1_dataset_metadata)
    result = phidippides.update_dataset_metadata(v1_dataset_metadata, request_id: 'request_id')
    assert_equal('200', result[:status])
  end

  def test_fetch_dataset_metadata
    prepare_stubs(body: v1_dataset_metadata, path: 'v1/id/vtvh-wqgq/dataset', verb: :get)
    Phidippides.any_instance.stubs(
      augment_dataset_metadata!: v1_dataset_metadata
    )
    result = phidippides.fetch_dataset_metadata('vtvh-wqgq', request_id: 'request_id')
    assert_equal(v1_dataset_metadata, result[:body])
    phidippides.unstub(:dataset_view)
  end

  def test_fetch_dataset_metadata_with_error
    error_body_stub = { 'error' => true }
    error_status = '400'

    phidippides.stubs(:dataset_view => {})
    stub_column = { :fieldName => 'fooBar' }.with_indifferent_access
    phidippides.dataset_view.stubs(:columns => [stub_column])
    Phidippides.any_instance.stubs(
      fetch_dataset_metadata: { :body => error_body_stub, :status => error_status },
      augment_dataset_metadata!: v1_dataset_metadata
    )

    result = phidippides.fetch_dataset_metadata('vtvh-wqgq', request_id: 'request_id')
    assert_equal(error_body_stub, result[:body])
    assert_equal(error_status, result[:status])

    phidippides.unstub(:dataset_view)
  end

  def test_set_default_and_available_card_types_to_columns_calls_airbrake_when_it_cannot_find_a_dataset_id
    v1_dataset_metadata_without_dataset_id = {
      status: '200',
      body: v1_dataset_metadata.deep_dup.tap { |metadata| metadata.delete(:id) }
    }

    Airbrake.expects(:notify).with do |airbrake|
      assert_equal(true, airbrake[:error_message].include?('Could not compute default and available card types for dataset: unable to determine dataset id'))
    end
    phidippides.set_default_and_available_card_types_to_columns!(v1_dataset_metadata_without_dataset_id)
  end

  def test_set_default_and_available_card_types_to_columns_calls_airbrake_when_it_cannot_find_any_columns
    v1_dataset_metadata_without_columns = {
      status: '200',
      body: v1_dataset_metadata.deep_dup.tap { |metadata| metadata.delete(:columns) }
    }

    Airbrake.expects(:notify).with do |airbrake|
      assert_equal(true, airbrake[:error_message].include?('Could not compute default and available card types for dataset: no columns found'))
    end
    phidippides.set_default_and_available_card_types_to_columns!(v1_dataset_metadata_without_columns)
  end

  def test_set_default_and_available_card_types_to_columns_succeeds
    connection_stub = stub.tap do |stub|
      stub.stubs(get_request: '[{"count_0": "34"}]',
                 reset_counters: {requests: {}, runtime: 0})
    end

    v1_dataset_metadata_response = {
      status: '200',
      body: v1_dataset_metadata
    }
    CoreServer::Base.stubs(connection: connection_stub)

    phidippides.set_default_and_available_card_types_to_columns!(v1_dataset_metadata_response)

    assert_equal(
      'histogram',
      v1_dataset_metadata_response[:body][:columns][:some_column][:defaultCardType]
    )
    assert_equal(
      ['histogram', 'column', 'search'],
      v1_dataset_metadata_response[:body][:columns][:some_column][:availableCardTypes]
    )
    assert_equal(
      'histogram',
      v1_dataset_metadata_response[:body][:columns][:some_other_column][:defaultCardType]
    )
    assert_equal(
      ['histogram', 'column', 'search'],
      v1_dataset_metadata_response[:body][:columns][:some_other_column][:availableCardTypes]
    )
  end

  def test_set_default_and_available_card_types_to_columns_passes_federation_header_to_core
    connection_stub = mock
    connection_stub.expects(:get_request).times(1).with do |url, options|
      assert_equal({ 'X-Socrata-Federation' => 'Honey Badger' }, options)
    end.returns('[{ "count_0": 10 }]')

    CoreServer::Base.stubs(connection: connection_stub)

    v1_dataset_metadata_response = {
      status: '200',
      body: v1_dataset_metadata
    }

    phidippides.set_default_and_available_card_types_to_columns!(v1_dataset_metadata_response)
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

  def test_issue_request_temporary_redirect_response
    prepare_stubs(
      code: '307',
      location: 'dataset/anot-hrpl',
      body: nil,
      path: 'datasets/four-four',
      verb: :get,
      response_class: Net::HTTPTemporaryRedirect
    )

    options = {
      verb: :get,
      path: 'datasets/four-four',
      request_id: 'request_id'
    }

    phidippides.
      expects(:on_redirect).
      with(@mock_response, 'dataset/anot-hrpl', options).
      returns({
        body: {'key' => 'value'}
      })

    result = phidippides.issue_request(options)
    assert_equal({'key' => 'value'}, result[:body])
  end

  def test_issue_request_failure_response
    prepare_stubs(code: '405', path: 'datasets/four-four', verb: :get, response_class: Net::HTTPMethodNotAllowed)
    result = phidippides.issue_request(verb: :get, path: 'datasets/four-four', request_id: 'request_id')
    assert_equal({'status' => '405', 'body' => nil, 'error' => nil}, result)
  end

  def test_issue_request_invalid_response
    prepare_stubs(body: 'junk', path: 'datasets/four-four', verb: :get)
    result = phidippides.issue_request(verb: :get, path: 'datasets/four-four', request_id: 'request_id')
    assert_equal({'status' => '500', 'body' => '"junk"', 'error' => '784: unexpected token at \'"junk"\''}, result)
  end

  def test_augment_dataset_metadata_with_nbe_dataset
    stub_migrations = JSON.parse(
      '{"nbeId": "newb-newb", "obeId": "olds-kool", "syncedAt": 1425592085}'
    ).with_indifferent_access
    mock_nbe_dataset = stub(:migrations => stub_migrations)
    mock_dataset_metadata = {}
    phidippides.expects(:dataset_view).with('newb-newb').returns(mock_nbe_dataset)
    phidippides.expects(:dataset_view).with('olds-kool').raises(CoreServer::ResourceNotFound.new(nil))
    phidippides.expects(:mirror_nbe_column_metadata!).with(mock_nbe_dataset, mock_dataset_metadata)
    phidippides.augment_dataset_metadata!('newb-newb', mock_dataset_metadata)
  end

  def test_augment_dataset_metadata_with_obe_dataset
    stub_migrations = JSON.parse(
      '{"nbeId": "newb-newb", "obeId": "olds-kool", "syncedAt": 1425592085}'
    ).with_indifferent_access
    mock_nbe_dataset = stub(:migrations => stub_migrations)
    mock_obe_dataset = stub
    mock_dataset_metadata = {}
    phidippides.expects(:dataset_view).with('newb-newb').returns(mock_nbe_dataset)
    phidippides.expects(:dataset_view).with('olds-kool').returns(mock_obe_dataset)
    phidippides.expects(:mirror_nbe_column_metadata!).with(mock_obe_dataset, mock_dataset_metadata)
    phidippides.augment_dataset_metadata!('newb-newb', mock_dataset_metadata)
  end

  def test_mirror_nbe_column_metadata
    obe_dataset = View.new(old_backend_columns)
    nbe_dataset = new_backend_columns

    result = phidippides.mirror_nbe_column_metadata!(obe_dataset, nbe_dataset)

    assert_equal(nbe_dataset, result, 'Should return the nbe_dataset')
    result[:columns].each do |key, column|
      obe_column = obe_dataset.columns.detect { |obe_column| obe_column.fieldName == key }
      assert_equal(obe_column.position, column[:position])
      assert_equal(key == 'primary_type', column[:hideInTable])
    end
    assert_equal(true, result[:columns]['thing_without_commas']['format']['noCommas'])
    assert_equal('percent', result[:columns]['voice_roughness']['dataTypeName'])
    assert_equal('percent', result[:columns]['voice_roughness']['renderTypeName'])
  end

  def test_mirror_nbe_column_metadata_with_row_label
    obe_dataset = View.new(old_backend_columns)
    nbe_dataset = new_backend_columns

    # Define rowLabel in a new metadata blob
    rowLabel = OpenStruct.new('rowLabel' => 'testLabel')
    obe_dataset.stubs(:metadata => rowLabel)
    result = phidippides.mirror_nbe_column_metadata!(obe_dataset, nbe_dataset)
    assert_equal('testLabel', nbe_dataset[:rowDisplayUnit])
  end

  private

  # noinspection RubyArgCount
  def prepare_stubs(options)
    @mock_response = stub(
      code: options[:code] || '200',
      body: options[:body].try(:to_json)
    )

    @mock_response.expects(:[]).with('location').returns(options[:location]) if options[:location].present?

    response_class = options.fetch(:response_class, Net::HTTPSuccess)

    @mock_response.stubs(:kind_of?).returns(false)
    @mock_response.stubs(:kind_of?).with do |klass|
      response_class <= klass
    end.returns(true)

    @mock_response.stubs(:to_hash).returns({})

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

  def pages_for_dataset
    JSON.parse('{"vwwn-6r7g":{"datasetId":"q77b-s2zi","pageId":"vwwn-6r7g"}, "test-page":{"datasetId":"q77b-s2zi","pageId":"test-page"}}').with_indifferent_access
  end

  def normalized_pages_for_dataset
    JSON.parse('{"publisher":[{"datasetId":"q77b-s2zi","pageId":"vwwn-6r7g"}, {"datasetId":"q77b-s2zi","pageId":"test-page"}], "user":[]}').with_indifferent_access
  end

  def old_backend_columns
    JSON.parse(File.read("#{Rails.root}/test/fixtures/old-backend-columns.json"))
  end

  def v1_dataset_metadata
    @v1_dataset_metdata ||= JSON.parse(File.read("#{Rails.root}/test/fixtures/v1-dataset-metadata.json")).with_indifferent_access
  end

  def new_backend_columns
    JSON.parse(File.read("#{Rails.root}/test/fixtures/new-backend-columns-v1.json")).with_indifferent_access
  end

end