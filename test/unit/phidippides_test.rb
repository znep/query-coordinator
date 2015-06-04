require_relative '../test_helper'

class PhidippidesTest < Test::Unit::TestCase

  def phidippides
    @phidippides ||= Phidippides.new
  end

  def setup
    # noinspection RubyArgCount
    init_current_domain
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
    prepare_stubs(body: v0_pages_for_dataset, path: 'datasets/four-four/pages', verb: :get)
    phidippides.fetch_pages_for_dataset('four-four', request_id: 'request_id')
    assert_equal('request_id', @mock_request['X-Socrata-RequestId'])
  end

  def test_does_not_include_request_id_when_absent
    prepare_stubs(body: v0_pages_for_dataset, path: 'datasets/four-four/pages', verb: :get)
    phidippides.fetch_pages_for_dataset('four-four')
    refute(@mock_request['X-Socrata-RequestId'])
  end

  def test_includes_cookies_when_present
    prepare_stubs(body: v0_pages_for_dataset, path: 'datasets/four-four/pages', verb: :get)
    phidippides.fetch_pages_for_dataset('four-four', cookies: 'some cookies')
    assert_equal('some cookies', @mock_request['Cookie'])
  end

  def test_does_not_include_cookies_when_absent
    prepare_stubs(body: v0_pages_for_dataset, path: 'datasets/four-four/pages', verb: :get)
    phidippides.fetch_pages_for_dataset('four-four')
    refute(@mock_request['Cookie'])
  end

  def test_update_dataset_metadata
    prepare_stubs(body: v0_dataset_metadata, path: 'datasets/q77b-s2zi', verb: :put, request_body: v0_dataset_metadata)
    stub_feature_flags_with(:metadata_transition_phase, '0')
    result = phidippides.update_dataset_metadata(v0_dataset_metadata, request_id: 'request_id')
    assert_equal(v0_dataset_metadata, result[:body])

    prepare_stubs(body: nil, path: 'v1/id/vtvh-wqgq/dataset', verb: :put, request_body: v1_dataset_metadata)
    stub_feature_flags_with(:metadata_transition_phase, '1')
    result = phidippides.update_dataset_metadata(v1_dataset_metadata, request_id: 'request_id')
    assert_equal('200', result[:status])

    prepare_stubs(body: nil, path: 'v1/id/vtvh-wqgq/dataset', verb: :put, request_body: v1_dataset_metadata)
    stub_feature_flags_with(:metadata_transition_phase, '2')
    result = phidippides.update_dataset_metadata(v1_dataset_metadata, request_id: 'request_id')
    assert_equal('200', result[:status])
  end

  def test_fetch_page_metadata
    prepare_stubs(body: v0_page_metadata, path: 'pages/four-four', verb: :get)
    stub_feature_flags_with(:metadata_transition_phase, '0')
    result = phidippides.fetch_page_metadata('four-four', request_id: 'request_id')
    assert_equal(v0_page_metadata, result[:body])

    prepare_stubs(body: v0_page_metadata, path: 'pages/four-four', verb: :get)
    stub_feature_flags_with(:metadata_transition_phase, '1')
    result = phidippides.fetch_page_metadata('four-four', request_id: 'request_id')
    assert_equal(v0_page_metadata, result[:body])

    prepare_stubs(body: v1_page_metadata, path: 'v1/pages/iuya-fxdq', verb: :get)
    stub_feature_flags_with(:metadata_transition_phase, '2')
    result = phidippides.fetch_page_metadata('iuya-fxdq', request_id: 'request_id')
    assert_equal(v1_page_metadata, result[:body])
  end

  def test_update_page_metadata
    prepare_stubs(body: v0_page_metadata, path: 'pages/desk-chek', verb: :put, request_body: v0_page_metadata)
    stub_feature_flags_with(:metadata_transition_phase, '0')
    result = phidippides.update_page_metadata(v0_page_metadata, request_id: 'request_id')
    assert_equal(v0_page_metadata, result[:body])

    prepare_stubs(body: v0_page_metadata, path: 'pages/desk-chek', verb: :put, request_body: v0_page_metadata)
    stub_feature_flags_with(:metadata_transition_phase, '1')
    result = phidippides.update_page_metadata(v0_page_metadata, request_id: 'request_id')
    assert_equal(v0_page_metadata, result[:body])

    prepare_stubs(body: nil, path: 'v1/id/vtvh-wqgq/pages/iuya-fxdq', verb: :put, request_body: v1_page_metadata)
    stub_feature_flags_with(:metadata_transition_phase, '2')
    result = phidippides.update_page_metadata(v1_page_metadata, request_id: 'request_id')
    assert_equal('200', result[:status])
  end

  def test_delete_page_metadata
    prepare_stubs(body: nil, path: 'v1/pages/iuya-fxdq', verb: :delete, request_body: nil)
    stub_feature_flags_with(:metadata_transition_phase, '2')
    result = phidippides.delete_page_metadata('iuya-fxdq', request_id: 'request_id')
    assert_equal('200', result[:status])
  end

  def test_fetch_pages_for_dataset
    prepare_stubs(body: v0_pages_for_dataset, path: 'datasets/four-four/pages', verb: :get)
    stub_feature_flags_with(:metadata_transition_phase, '0')
    result = phidippides.fetch_pages_for_dataset('four-four', request_id: 'request_id')
    assert_equal(v0_pages_for_dataset, result[:body])

    prepare_stubs(body: v0_pages_for_dataset, path: 'datasets/four-four/pages', verb: :get)
    stub_feature_flags_with(:metadata_transition_phase, '1')
    result = phidippides.fetch_pages_for_dataset('four-four', request_id: 'request_id')
    assert_equal(v0_pages_for_dataset, result[:body])

    prepare_stubs(body: v1_pages_for_dataset, path: 'v1/id/four-four/pages', verb: :get)
    stub_feature_flags_with(:metadata_transition_phase, '2')
    result = phidippides.fetch_pages_for_dataset('four-four', request_id: 'request_id')
    assert_equal(normalized_v1_pages_for_dataset, result[:body])
  end

  def test_fetch_dataset_metadata
    phidippides.stubs(:dataset_view => nil)
    prepare_stubs(body: v0_dataset_metadata, path: 'datasets/four-four', verb: :get)
    stub_feature_flags_with(:metadata_transition_phase, '0')
    result = phidippides.fetch_dataset_metadata('four-four', request_id: 'request_id')
    assert_equal(v0_dataset_metadata, result[:body])

    prepare_stubs(body: v1_dataset_metadata, path: 'v1/id/vtvh-wqgq/dataset', verb: :get)
    stub_feature_flags_with(:metadata_transition_phase, '1')
    result = phidippides.fetch_dataset_metadata('vtvh-wqgq', request_id: 'request_id')
    assert_equal(v1_dataset_metadata, result[:body])

    prepare_stubs(body: v1_dataset_metadata, path: 'v1/id/vtvh-wqgq/dataset', verb: :get)
    stub_feature_flags_with(:metadata_transition_phase, '2')
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
    prepare_stubs(body: error_body_stub, path: 'datasets/four-four', verb: :get, code: error_status)

    stub_feature_flags_with(:metadata_transition_phase, '0')
    result = phidippides.fetch_dataset_metadata('four-four', request_id: 'request_id')
    assert_equal(error_body_stub, result[:body])
    assert_equal(error_status, result[:status])

    prepare_stubs(body: error_body_stub, path: 'v1/id/vtvh-wqgq/dataset', verb: :get, code: error_status)
    stub_feature_flags_with(:metadata_transition_phase, '1')
    result = phidippides.fetch_dataset_metadata('vtvh-wqgq', request_id: 'request_id')
    assert_equal(error_body_stub, result[:body])
    assert_equal(error_status, result[:status])

    prepare_stubs(body: error_body_stub, path: 'v1/id/vtvh-wqgq/dataset', verb: :get, code: error_status)
    stub_feature_flags_with(:metadata_transition_phase, '2')
    result = phidippides.fetch_dataset_metadata('vtvh-wqgq', request_id: 'request_id')
    assert_equal(error_body_stub, result[:body])
    assert_equal(error_status, result[:status])

    phidippides.unstub(:dataset_view)
  end

  def test_set_default_and_available_card_types_to_columns_in_phase_3_calls_airbrake_when_it_cannot_find_a_dataset_id
    v1_dataset_metadata_without_dataset_id = {
      status: '200',
      body: v1_dataset_metadata.deep_dup.tap { |metadata| metadata.delete(:id) }
    }
    stub_feature_flags_with(:metadata_transition_phase, '3')

    Airbrake.expects(:notify).with do |airbrake|
      assert_equal(true, airbrake[:error_message].include?('Could not compute default and available card types for dataset: unable to determine dataset id'))
    end
    phidippides.set_default_and_available_card_types_to_columns!(v1_dataset_metadata_without_dataset_id)
  end

  def test_set_default_and_available_card_types_to_columns_in_phase_3_calls_airbrake_when_it_cannot_find_any_columns
    v1_dataset_metadata_without_columns = {
      status: '200',
      body: v1_dataset_metadata.deep_dup.tap { |metadata| metadata.delete(:columns) }
    }
    stub_feature_flags_with(:metadata_transition_phase, '3')

    Airbrake.expects(:notify).with do |airbrake|
      assert_equal(true, airbrake[:error_message].include?('Could not compute default and available card types for dataset: no columns found'))
    end
    phidippides.set_default_and_available_card_types_to_columns!(v1_dataset_metadata_without_columns)
  end

  def test_set_default_and_available_card_types_to_columns_in_phase_3_succeeds
    connection_stub = stub.tap do |stub|
      stub.stubs(get_request: '[{"count_0": "34"}]',
                 reset_counters: {requests: {}, runtime: 0})
    end

    v1_dataset_metadata_response = {
      status: '200',
      body: v1_dataset_metadata
    }
    stub_multiple_feature_flags_with({ :metadata_transition_phase => '3', :odux_enable_histogram => true })
    CoreServer::Base.stubs(connection: connection_stub)

    phidippides.set_default_and_available_card_types_to_columns!(v1_dataset_metadata_response)

    assert_equal(
      'histogram',
      v1_dataset_metadata_response[:body][:columns][:some_column][:defaultCardType]
    )
    assert_equal(
      ['histogram', 'search'],
      v1_dataset_metadata_response[:body][:columns][:some_column][:availableCardTypes]
    )
    assert_equal(
      'histogram',
      v1_dataset_metadata_response[:body][:columns][:some_other_column][:defaultCardType]
    )
    assert_equal(
      ['histogram', 'search'],
      v1_dataset_metadata_response[:body][:columns][:some_other_column][:availableCardTypes]
    )
  end

  def test_pages_for_dataset_with_dataset_object_succeeds
    Phidippides.any_instance.stubs(
      fetch_pages_for_dataset: { status: '200', body: v0_pages_for_dataset }
    )
    stub_feature_flags_with(:metadata_transition_phase, '0')
    pages = phidippides.fetch_pages_for_dataset(OpenStruct.new(id: 'q77b-s2zi'))[:body]
    assert(pages[:publisher].length > 0, 'expected to find one or more "publisher" in the "pages" response')
    assert(pages[:publisher].all? { |page| page[:id] == 'q77b-s2zi' }, 'expected all pages to belong to the same dataset')

    Phidippides.any_instance.stubs(
      fetch_pages_for_dataset: { status: '200', body: v0_pages_for_dataset }
    )
    stub_feature_flags_with(:metadata_transition_phase, '1')
    pages = phidippides.fetch_pages_for_dataset(OpenStruct.new(id: 'q77b-s2zi'))[:body]
    assert(pages[:publisher].length > 0, 'expected to find one or more "publisher" in the "pages" response')
    assert(pages[:publisher].all? { |page| page[:id] == 'q77b-s2zi' }, 'expected all pages to belong to the same dataset')

    Phidippides.any_instance.stubs(
      fetch_pages_for_dataset: { status: '200', body: normalized_v1_pages_for_dataset }
    )
    stub_feature_flags_with(:metadata_transition_phase, '2')
    pages = phidippides.fetch_pages_for_dataset(OpenStruct.new(id: 'q77b-s2zi'))[:body]
    assert(pages[:publisher].length > 0, 'expected to find one or more "publisher" in the "pages" response')
    assert(pages[:publisher].all? { |page| page[:datasetId] == 'q77b-s2zi' }, 'expected all pages to belong to the same dataset')
  end

  def test_create_dataset_metadata
    prepare_stubs(body: new_v0_dataset_metadata, path: 'datasets', verb: :post, request_body: new_v0_dataset_metadata)
    stub_feature_flags_with(:metadata_transition_phase, '0')
    result = phidippides.create_dataset_metadata(new_v0_dataset_metadata, request_id: 'request_id')
    assert_equal(new_v0_dataset_metadata, result[:body])
  end

  def test_pages_for_dataset_with_id_string_succeeds
    Phidippides.any_instance.stubs(
      fetch_pages_for_dataset: { status: '200', body: v0_pages_for_dataset }
    )
    stub_feature_flags_with(:metadata_transition_phase, '0')
    pages = phidippides.fetch_pages_for_dataset('q77b-s2zi')[:body]
    assert(pages[:publisher].length > 0, 'expected to find one or more "publisher" in the "pages" response')
    assert(pages[:publisher].all? { |page| page[:id] == 'q77b-s2zi' }, 'expected all pages to belong to the same dataset')

    Phidippides.any_instance.stubs(
      fetch_pages_for_dataset: { status: '200', body: v0_pages_for_dataset }
    )
    stub_feature_flags_with(:metadata_transition_phase, '1')
    pages = phidippides.fetch_pages_for_dataset('q77b-s2zi')[:body]
    assert(pages[:publisher].length > 0, 'expected to find one or more "publisher" in the "pages" response')
    assert(pages[:publisher].all? { |page| page[:id] == 'q77b-s2zi' }, 'expected all pages to belong to the same dataset')

    Phidippides.any_instance.stubs(
      fetch_pages_for_dataset: { status: '200', body: normalized_v1_pages_for_dataset }
    )
    stub_feature_flags_with(:metadata_transition_phase, '2')
    pages = phidippides.fetch_pages_for_dataset('q77b-s2zi')[:body]
    assert(pages[:publisher].length > 0, 'expected to find one or more "publisher" in the "pages" response')
    assert(pages[:publisher].all? { |page| page[:datasetId] == 'q77b-s2zi' }, 'expected all pages to belong to the same dataset')
  end

  def test_pages_for_dataset_with_id_in_hash_succeeds
    Phidippides.any_instance.stubs(
      fetch_pages_for_dataset: { status: '200', body: v0_pages_for_dataset }
    )
    stub_feature_flags_with(:metadata_transition_phase, '0')
    pages = phidippides.fetch_pages_for_dataset(id: 'q77b-s2zi')[:body]
    assert(pages[:publisher].length > 0, 'expected to find one or more "publisher" in the "pages" response')
    assert(pages[:publisher].all? { |page| page[:id] == 'q77b-s2zi' }, 'expected all pages to belong to the same dataset')

    Phidippides.any_instance.stubs(
      fetch_pages_for_dataset: { status: '200', body: v0_pages_for_dataset }
    )
    stub_feature_flags_with(:metadata_transition_phase, '1')
    pages = phidippides.fetch_pages_for_dataset(id: 'q77b-s2zi')[:body]
    assert(pages[:publisher].length > 0, 'expected to find one or more "publisher" in the "pages" response')
    assert(pages[:publisher].all? { |page| page[:id] == 'q77b-s2zi' }, 'expected all pages to belong to the same dataset')

    Phidippides.any_instance.stubs(
      fetch_pages_for_dataset: { status: '200', body: normalized_v1_pages_for_dataset }
    )
    stub_feature_flags_with(:metadata_transition_phase, '2')
    pages = phidippides.fetch_pages_for_dataset(id: 'q77b-s2zi')[:body]
    assert(pages[:publisher].length > 0, 'expected to find one or more "publisher" in the "pages" response')
    assert(pages[:publisher].all? { |page| page[:datasetId] == 'q77b-s2zi' }, 'expected all pages to belong to the same dataset')
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

  def test_simulated_pages_for_dataset_returns_all_pages_in_phase_0
    stub_feature_flags_with(:metadata_transition_phase, '0')
    filtered_pages = phidippides.send(:exclude_non_v1_or_above_pages_in_phase_3!, { status: '200', body: old_mixed_v0_and_v1_pages_for_dataset })
    normalized_pages = phidippides.send(:normalize_pages_for_dataset_response!, filtered_pages)
    assert(normalized_pages[:body][:publisher].any? { |page| !page.has_key?('version') }, 'expected some non-v1 pages')
  end

  def test_simulated_pages_for_dataset_returns_all_pages_in_phase_1
    stub_feature_flags_with(:metadata_transition_phase, '1')
    filtered_pages = phidippides.send(:exclude_non_v1_or_above_pages_in_phase_3!, { status: '200', body: old_mixed_v0_and_v1_pages_for_dataset })
    normalized_pages = phidippides.send(:normalize_pages_for_dataset_response!, filtered_pages)
    assert(normalized_pages[:body][:publisher].any? { |page| !page.has_key?('version') }, 'expected some non-v1 pages')
  end

  def test_simulated_pages_for_dataset_returns_all_pages_in_phase_2
    stub_feature_flags_with(:metadata_transition_phase, '2')
    filtered_pages = phidippides.send(:exclude_non_v1_or_above_pages_in_phase_3!, { status: '200', body: new_mixed_v0_and_v1_pages_for_dataset })
    normalized_pages = phidippides.send(:normalize_pages_for_dataset_response!, filtered_pages)
    assert(normalized_pages[:body][:publisher].any? { |page| !page.has_key?('version') }, 'expected some non-v1 pages')
  end

  def test_simulated_pages_for_dataset_returns_only_v1_or_above_pages_in_phase_3
    stub_feature_flags_with(:metadata_transition_phase, '3')
    filtered_pages = phidippides.send(:exclude_non_v1_or_above_pages_in_phase_3!, { status: '200', body: new_mixed_v0_and_v1_pages_for_dataset })
    normalized_pages = phidippides.send(:normalize_pages_for_dataset_response!, filtered_pages)
    assert(normalized_pages[:body][:publisher].all? { |page| page['version'].to_i > 0 }, 'expected only v1 pages')
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
    assert_equal({'status' => '500', 'body' => '"junk"', 'error' => '757: unexpected token at \'"junk"\''}, result)
  end

  def test_mirror_nbe_column_metadata_phase0
    stub_feature_flags_with(:metadata_transition_phase, '0')

    obe_dataset = View.new(old_backend_columns)
    nbe_dataset = v0_dataset_metadata.deep_dup

    result = phidippides.mirror_nbe_column_metadata!(obe_dataset, nbe_dataset)

    assert_equal(nbe_dataset, result, 'Should return the nbe_dataset')
    result[:columns].each do |column|
      obe_column = obe_dataset.columns.detect { |obe_column| obe_column.fieldName == column[:name] }
      assert_equal(obe_column.position, column[:position])
      assert_equal(column[:name] == 'primary_type', column[:hideInTable])
    end
  end

  def test_mirror_nbe_column_metadata_phase1
    stub_feature_flags_with(:metadata_transition_phase, '1')

    run_test_with_obe_and_v1_nbe
  end

  def test_mirror_nbe_column_metadata_phase2
    stub_feature_flags_with(:metadata_transition_phase, '2')

    run_test_with_obe_and_v1_nbe
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

  private

  def run_test_with_obe_and_v1_nbe
    obe_dataset = View.new(old_backend_columns)
    nbe_dataset = new_backend_columns

    result = phidippides.mirror_nbe_column_metadata!(obe_dataset, nbe_dataset)

    assert_equal(nbe_dataset, result, 'Should return the nbe_dataset')
    result[:columns].each do |key, column|
      obe_column = obe_dataset.columns.detect { |obe_column| obe_column.fieldName == key }
      assert_equal(obe_column.position, column[:position])
      assert_equal(key == 'primary_type', column[:hideInTable])
    end
  end

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

  def v0_page_metadata
    @page_metadata ||= JSON.parse(File.read("#{Rails.root}/test/fixtures/v0-page-metadata.json")).with_indifferent_access
  end

  def v0_dataset_metadata
    @dataset_metdata ||= JSON.parse(File.read("#{Rails.root}/test/fixtures/v0-dataset-metadata.json")).with_indifferent_access
  end

  def new_v0_dataset_metadata
    {
      'columns' => [],
      'defaultAggregateColumn' => ':count',
      'description' => 'Cases created since 7/1/2008',
      'domain' => 'dataspace-demo.test-socrata.com',
      'id' => 'vtvh-wqgq',
      'name' => 'Case Data from San Francisco 311',
      'ownerId' => '8ueb-zucv',
      'rowDisplayUnit' => 'Case',
      'updatedAt' => '2014-08-17T04:07:03.000Z'
    }
  end

  def v0_pages_for_dataset
    JSON.parse('{"publisher":[{"id":"q77b-s2zi","pageId":"vwwn-6r7g"}, {"id":"q77b-s2zi","pageId":"test-page"}],"user":[]}').with_indifferent_access
  end

  def v1_pages_for_dataset
    JSON.parse('{"vwwn-6r7g":{"datasetId":"q77b-s2zi","pageId":"vwwn-6r7g"}, "test-page":{"datasetId":"q77b-s2zi","pageId":"test-page"}}').with_indifferent_access
  end

  def normalized_v1_pages_for_dataset
    JSON.parse('{"publisher":[{"datasetId":"q77b-s2zi","pageId":"vwwn-6r7g"}, {"datasetId":"q77b-s2zi","pageId":"test-page"}], "user":[]}').with_indifferent_access
  end

  def old_mixed_v0_and_v1_pages_for_dataset
    JSON.parse('{"publisher":[{"datasetId":"q77b-s2zi","pageId":"vwwn-6r7g"}, {"datasetId":"q77b-s2zi","pageId":"test-page","version":"1"}], "user":[]}').with_indifferent_access
  end

  def new_mixed_v0_and_v1_pages_for_dataset
    JSON.parse('{"vwwn-6r7g":{"datasetId":"q77b-s2zi","pageId":"vwwn-6r7g"}, "test-page":{"datasetId":"q77b-s2zi","pageId":"test-page","version":"1"}}').with_indifferent_access
  end

  def new_v0_page_metadata
    JSON.parse('{"datasetId":"q77b-s2zi","pageId":"vwwn-6r7g"}').with_indifferent_access
  end

  def new_v1_page_metadata
    JSON.parse('{"datasetId":"q77b-s2zi","pageId":"vwwn-6r7g"}').with_indifferent_access
  end

  def old_backend_columns
    JSON.parse(File.read("#{Rails.root}/test/fixtures/old-backend-columns.json"))
  end

  def v1_dataset_metadata
    @v1_dataset_metdata ||= JSON.parse(File.read("#{Rails.root}/test/fixtures/v1-dataset-metadata.json")).with_indifferent_access
  end

  def v1_page_metadata
    @v1_dataset_metdata ||= JSON.parse(File.read("#{Rails.root}/test/fixtures/v1-page-metadata.json")).with_indifferent_access
  end

  def new_backend_columns
    JSON.parse(File.read("#{Rails.root}/test/fixtures/new-backend-columns-v1.json")).with_indifferent_access
  end

end
