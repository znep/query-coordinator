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

  def test_request_new_page_id
    prepare_stubs(body: { id: 'iuya-fxdq' }, path: 'v1/idgen', verb: :post, request_body: nil)
    stub_feature_flags_with(:metadata_transition_phase, '2')
    result = phidippides.request_new_page_id
    assert_equal('200', result[:status])
  end

  def test_create_page_metadata
    prepare_stubs(body: new_v0_page_metadata, path: 'pages', verb: :post, request_body: new_v0_page_metadata)
    stub_feature_flags_with(:metadata_transition_phase, '0')
    result = phidippides.create_page_metadata(new_v0_page_metadata, request_id: 'request_id')
    assert_equal(new_v0_page_metadata, result[:body])

    prepare_stubs(body: new_v0_page_metadata, path: 'pages', verb: :post, request_body: new_v0_page_metadata)
    stub_feature_flags_with(:metadata_transition_phase, '1')
    result = phidippides.create_page_metadata(new_v0_page_metadata, request_id: 'request_id')
    assert_equal(new_v0_page_metadata, result[:body])

    prepare_stubs(body: nil, path: 'v1/id/q77b-s2zi/pages/vwwn-6r7g', verb: :put, request_body: new_v1_page_metadata)
    stub_feature_flags_with(:metadata_transition_phase, '2')
    result = phidippides.create_page_metadata(new_v1_page_metadata, request_id: 'request_id')
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
    assert_equal(v1_pages_for_dataset, result[:body])
  end

  def test_fetch_dataset_metadata
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
  end

  def test_migrate_dataset_metadata_to_v1_in_phase_1_generates_default_page_if_none_exists
    v1_dataset_metadata_without_default_page = {
      status: '200',
      body: v1_dataset_metadata.deep_dup.tap { |metadata| metadata.delete(:defaultPage) }
    }
    Phidippides.any_instance.stubs(
      fetch_pages_for_dataset: { status: '200', body: v0_pages_for_dataset }
    )
    stub_feature_flags_with(:metadata_transition_phase, '1')

    Phidippides.any_instance.expects(:update_dataset_metadata).times(1).then.with do |json, options|
      assert_equal(JSON.parse(json)['defaultPage'], 'vwwn-6r7g')
    end.then.returns(
      status: '200',
      body: nil
    )
    phidippides.migrate_dataset_metadata_to_v1(v1_dataset_metadata_without_default_page)
  end

  def test_migrate_dataset_metadata_to_v1_in_phase_1_calls_airbrake_when_it_cannot_determine_the_dataset_id
    stub_feature_flags_with(:metadata_transition_phase, '1')

    Phidippides.any_instance.stubs(
      fetch_pages_for_dataset: { status: '200', body: nil }
    )
    Airbrake.expects(:notify).with do |airbrake|
      assert_equal(airbrake[:error_message], 'Could not migrate dataset to v1: could not determine dataset id.')
    end
    phidippides.migrate_dataset_metadata_to_v1(nil)
  end

  def test_migrate_dataset_metadata_to_v1_in_phase_1_calls_airbrake_when_it_cannot_get_the_page_id_of_the_first_publisher_page
    v1_dataset_metadata_without_default_page = {
      status: '200',
      body: v1_dataset_metadata.deep_dup.tap { |metadata| metadata.delete(:defaultPage) }
    }
    stub_feature_flags_with(:metadata_transition_phase, '1')

    Phidippides.any_instance.stubs(
      fetch_pages_for_dataset: { status: '200', body: nil }
    )
    Airbrake.expects(:notify).with do |airbrake|
      assert_equal(airbrake[:error_message], 'Could not migrate dataset to v1: no valid publisher pageId found.')
    end
    phidippides.migrate_dataset_metadata_to_v1(v1_dataset_metadata_without_default_page)

    Phidippides.any_instance.stubs(
      fetch_pages_for_dataset: { status: '200', body: {} }
    )
    Airbrake.expects(:notify).with do |airbrake|
      assert_equal(airbrake[:error_message], 'Could not migrate dataset to v1: no valid publisher pageId found.')
    end
    phidippides.migrate_dataset_metadata_to_v1(v1_dataset_metadata_without_default_page)

    Phidippides.any_instance.stubs(
      fetch_pages_for_dataset: { status: '200', body: { :publisher => [] } }
    )
    Airbrake.expects(:notify).with do |airbrake|
      assert_equal(airbrake[:error_message], 'Could not migrate dataset to v1: no valid publisher pageId found.')
    end
    phidippides.migrate_dataset_metadata_to_v1(v1_dataset_metadata_without_default_page)

    Phidippides.any_instance.stubs(
      fetch_pages_for_dataset: { status: '200', body: { :publisher => [ {} ] } }
    )
    Airbrake.expects(:notify).with do |airbrake|
      assert_equal(airbrake[:error_message], 'Could not migrate dataset to v1: no valid publisher pageId found.')
    end
    phidippides.migrate_dataset_metadata_to_v1(v1_dataset_metadata_without_default_page)
  end

  def test_migrate_dataset_metadata_to_v1_in_phase_2_generates_default_page_if_none_exists
    v1_dataset_metadata_without_default_page = {
      status: '200',
      body: v1_dataset_metadata.deep_dup.tap { |metadata| metadata.delete(:defaultPage) }
    }
    Phidippides.any_instance.stubs(
      fetch_pages_for_dataset: { status: '200', body: v1_pages_for_dataset }
    )
    stub_feature_flags_with(:metadata_transition_phase, '2')

    Phidippides.any_instance.expects(:update_dataset_metadata).times(1).then.with do |json, options|
      assert_equal(JSON.parse(json)['defaultPage'], 'vwwn-6r7g')
    end.then.returns(
      status: '200',
      body: nil
    )
    phidippides.migrate_dataset_metadata_to_v1(v1_dataset_metadata_without_default_page)
  end

  def test_migrate_dataset_metadata_to_v1_in_phase_2_calls_airbrake_when_it_cannot_determine_the_dataset_id
    stub_feature_flags_with(:metadata_transition_phase, '2')

    Phidippides.any_instance.stubs(
      fetch_pages_for_dataset: { status: '200', body: nil }
    )
    Airbrake.expects(:notify).with do |airbrake|
      assert_equal(airbrake[:error_message], 'Could not migrate dataset to v1: could not determine dataset id.')
    end
    phidippides.migrate_dataset_metadata_to_v1(nil)
  end

  def test_migrate_dataset_metadata_to_v1_in_phase_2_calls_airbrake_when_it_cannot_get_the_page_id_of_the_first_publisher_page
    v1_dataset_metadata_without_default_page = {
      status: '200',
      body: v1_dataset_metadata.deep_dup.tap { |metadata| metadata.delete(:defaultPage) }
    }
    stub_feature_flags_with(:metadata_transition_phase, '2')

    Phidippides.any_instance.stubs(
      fetch_pages_for_dataset: { status: '200', body: nil }
    )
    Airbrake.expects(:notify).with do |airbrake|
      assert_equal(airbrake[:error_message], 'Could not migrate dataset to v1: no valid publisher pageId found.')
    end
    phidippides.migrate_dataset_metadata_to_v1(v1_dataset_metadata_without_default_page)

    Phidippides.any_instance.stubs(
      fetch_pages_for_dataset: { status: '200', body: {} }
    )
    Airbrake.expects(:notify).with do |airbrake|
      assert_equal(airbrake[:error_message], 'Could not migrate dataset to v1: no valid publisher pageId found.')
    end
    phidippides.migrate_dataset_metadata_to_v1(v1_dataset_metadata_without_default_page)

    Phidippides.any_instance.stubs(
      fetch_pages_for_dataset: { status: '200', body: { :publisher => [] } }
    )
    Airbrake.expects(:notify).with do |airbrake|
      assert_equal(airbrake[:error_message], 'Could not migrate dataset to v1: no valid publisher pageId found.')
    end
    phidippides.migrate_dataset_metadata_to_v1(v1_dataset_metadata_without_default_page)

    Phidippides.any_instance.stubs(
      fetch_pages_for_dataset: { status: '200', body: { :publisher => [ {} ] } }
    )
    Airbrake.expects(:notify).with do |airbrake|
      assert_equal(airbrake[:error_message], 'Could not migrate dataset to v1: no valid publisher pageId found.')
    end
    phidippides.migrate_dataset_metadata_to_v1(v1_dataset_metadata_without_default_page)
  end

  def test_add_default_and_available_card_types_to_columns_in_phase_3_calls_airbrake_when_it_cannot_find_any_columns
    v1_dataset_metadata_without_dataset_id = {
      status: '200',
      body: v1_dataset_metadata.deep_dup.tap { |metadata| metadata.delete(:datasetId) }
    }
    stub_feature_flags_with(:metadata_transition_phase, '3')

    Airbrake.expects(:notify).with do |airbrake|
      assert_equal(
        "Could not compute default and available card types for dataset: unable to determine dataset id.",
        airbrake[:error_message]
      )
    end
    phidippides.add_default_and_available_card_types_to_columns(v1_dataset_metadata_without_dataset_id)
  end

  def test_add_default_and_available_card_types_to_columns_in_phase_3_calls_airbrake_when_it_cannot_find_any_columns
    v1_dataset_metadata_without_columns = {
      status: '200',
      body: v1_dataset_metadata.deep_dup.tap { |metadata| metadata.delete(:columns) }
    }
    stub_feature_flags_with(:metadata_transition_phase, '3')

    Airbrake.expects(:notify).with do |airbrake|
      assert_equal(
        "Could not compute default and available card types for dataset: no columns found.",
        airbrake[:error_message]
      )
    end
    phidippides.add_default_and_available_card_types_to_columns(v1_dataset_metadata_without_columns)
  end

  def test_add_default_and_available_card_types_to_columns_in_phase_3_succeeds
    connection_stub = stub.tap do |stub|
      stub.stubs(get_request: '[{"count_0": "34"}]',
                 reset_counters: {requests: {}, runtime: 0})
    end

    v1_dataset_metadata_response = {
      status: '200',
      body: v1_dataset_metadata
    }
    stub_feature_flags_with(:metadata_transition_phase, '3')
    CoreServer::Base.stubs(connection: connection_stub)

    phidippides.add_default_and_available_card_types_to_columns(v1_dataset_metadata_response)

    assert_equal(
      'column',
      v1_dataset_metadata_response[:body][:columns][:some_column][:defaultCardType]
    )
    assert_equal(
      ['column', 'histogram'],
      v1_dataset_metadata_response[:body][:columns][:some_column][:availableCardTypes]
    )
    assert_equal(
      'column',
      v1_dataset_metadata_response[:body][:columns][:some_other_column][:defaultCardType]
    )
    assert_equal(
      ['column', 'histogram'],
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
      fetch_pages_for_dataset: { status: '200', body: v1_pages_for_dataset }
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
      fetch_pages_for_dataset: { status: '200', body: v1_pages_for_dataset }
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
      fetch_pages_for_dataset: { status: '200', body: v1_pages_for_dataset }
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
      body: options[:body].try(:to_json)
    )

    @mock_response.expects(:[]).with('location').returns(options[:location]) if options[:location].present?

    response_class = options.fetch(:response_class, Net::HTTPSuccess)

    @mock_response.stubs(:kind_of?).returns(false)
    @mock_response.stubs(:kind_of?).with do |klass|
      response_class <= klass
    end.returns(true)

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
      "columns" => [],
      "defaultAggregateColumn" => ":count",
      "description" => "Cases created since 7/1/2008",
      "domain" => "dataspace-demo.test-socrata.com",
      "id" => "vtvh-wqgq",
      "name" => "Case Data from San Francisco 311",
      "ownerId" => "8ueb-zucv",
      "rowDisplayUnit" => "Case",
      "updatedAt" => "2014-08-17T04:07:03.000Z"
    }
  end

  def v0_pages_for_dataset
    JSON.parse('{"publisher":[{"id":"q77b-s2zi","pageId":"vwwn-6r7g"}, {"id":"q77b-s2zi","pageId":"test-page"}],"user":[]}').with_indifferent_access
  end

  def v1_pages_for_dataset
    JSON.parse('{"publisher":[{"datasetId":"q77b-s2zi","pageId":"vwwn-6r7g"}, {"datasetId":"q77b-s2zi","pageId":"test-page"}],"user":[]}').with_indifferent_access
  end

  def new_v0_page_metadata
    JSON.parse('{"datasetId":"q77b-s2zi","pageId":"vwwn-6r7g"}').with_indifferent_access
  end

  def new_v1_page_metadata
    JSON.parse('{"datasetId":"q77b-s2zi","pageId":"vwwn-6r7g"}').with_indifferent_access
  end

  def v1_dataset_metadata
    @v1_dataset_metdata ||= JSON.parse(File.read("#{Rails.root}/test/fixtures/v1-dataset-metadata.json")).with_indifferent_access
  end

  def v1_page_metadata
    @v1_dataset_metdata ||= JSON.parse(File.read("#{Rails.root}/test/fixtures/v1-page-metadata.json")).with_indifferent_access
  end

end
