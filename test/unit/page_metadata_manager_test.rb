require 'test_helper'

class PageMetadataManagerTest < Test::Unit::TestCase

  OBE_CATEGORY_NAME = 'obe_test_category'
  NBE_CATEGORY_NAME = 'nbe_test_category'
  NBE_DATASET_ID = 'vtvh-wqgq'
  OBE_DATASET_ID = 'nrhw-r55e'

  def setup
    init_current_domain
    NewViewManager.any_instance.stubs(create: 'niew-veww')
    NewViewManager.any_instance.stubs(update: nil)
    Phidippides.any_instance.stubs(connection_details: {
      'address' => 'localhost',
      'port' => '2401'
    })
    SodaFountain.any_instance.stubs(connection_details: {
      'address' => 'localhost',
      'port' => '6010'
    })
    manager.stubs(:largest_time_span_in_days_being_used_in_columns).returns(1000)
    manager.stubs(:magnitude_function_for_column).returns('signed_magnitude_10')
    View.stubs(
      :find => stub(
        :category => OBE_CATEGORY_NAME,
        :migrations => stub_migrations
      )
    )
    @dataset_copy_stub = stub_dataset_copy_request('vtvh-wqgq')
  end


  def test_create_creates_data_lens_with_category_from_obe_dataset
    Phidippides.any_instance.stubs(
      fetch_dataset_metadata: { status: '200', body: v1_dataset_metadata_without_rollup_columns},
      fetch_page_metadata: { status: '200', body: v1_page_metadata_without_rollup_columns },
      update_page_metadata: { status: '200', body: {} }
    )
    mock_nbe_dataset = stub(:migrations => stub_migrations)
    mock_obe_dataset = stub(:category => OBE_CATEGORY_NAME)
    View.expects(:find).with(NBE_DATASET_ID).returns(mock_nbe_dataset)
    View.expects(:find).with(OBE_DATASET_ID).returns(mock_obe_dataset)

    NewViewManager.any_instance.expects(:create).times(1).with do |_, _, category|
      assert_equal(OBE_CATEGORY_NAME, category)
    end.returns('fdsa-fdsa')

    manager.create(v1_page_metadata_without_rollup_columns)
  end

  def test_create_creates_data_lens_with_category_from_nbe_dataset
    Phidippides.any_instance.stubs(
      fetch_dataset_metadata: { status: '200', body: v1_dataset_metadata_without_rollup_columns},
      fetch_page_metadata: { status: '200', body: v1_page_metadata_without_rollup_columns },
      update_page_metadata: { status: '200', body: {} }
    )
    mock_nbe_dataset = stub(
      :migrations => stub_migrations,
      :category => NBE_CATEGORY_NAME
    )
    View.expects(:find).with(NBE_DATASET_ID).returns(mock_nbe_dataset)
    View.expects(:find).with(OBE_DATASET_ID).raises(CoreServer::ResourceNotFound.new(nil))

    NewViewManager.any_instance.expects(:create).times(1).with do |_, _, category|
      assert_equal(NBE_CATEGORY_NAME, category)
    end.returns('fdsa-fdsa')

    manager.create(v1_page_metadata_without_rollup_columns)
  end

  def test_create_raises_no_dataset_metadata_exception_when_phiddy_craps_out_v1
    manager.stubs(:dataset_metadata => { status: '500', body: nil })
    assert_raises(Phidippides::NoDatasetMetadataException) do
      manager.create(v1_page_metadata)
    end
  end

  def test_delete_deletes_core_and_phidippides_and_rollup_representation
    Phidippides.any_instance.expects(:fetch_page_metadata).returns(
      status: '200',
      body: { datasetId: 'data-eyed' }
    )
    Phidippides.any_instance.expects(:delete_page_metadata).with do |id, options|
      assert_equal(id, 'four-four')
    end.then.returns({ body: nil, status: '200' })

    core_stub = mock
    core_stub.stubs(reset_counters: {requests: {}, runtime: 0})
    core_stub.expects(:delete_request).with do |url|
      assert_equal('/views.json?id=four-four&method=delete', url)
    end.then.returns('{ "body": null, "status": "200" }')
    CoreServer::Base.stubs(connection: core_stub)

    SodaFountain.any_instance.expects(:delete_rollup_table).with do |args|
      assert_equal({dataset_id: 'data-eyed', identifier: 'four-four'}, args)
    end.then.returns({ status: '200' })

    result = manager.delete('four-four')
    assert_equal('200', result[:status])
  end

  def test_delete_doesnt_delete_phidippides_if_core_fails_for_some_reason
    Phidippides.any_instance.expects(:delete_page_metadata).never

    core_stub = mock
    core_stub.stubs(reset_counters: {requests: {}, runtime: 0})
    core_stub.expects(:delete_request).with do |url|
      assert_equal('/views.json?id=four-four&method=delete', url)
    end.then.raises(CoreServer::CoreServerError.new(nil, nil, nil))
    CoreServer::Base.stubs(connection: core_stub)

    result = manager.delete('four-four')
    assert_equal(result[:status], '500')
  end

  # This test is mainly here to document a known issue. It's not great that this happens, but it's
  # more important during a delete that the catalog entry is deleted (so users don't see something
  # to click on), than the actual metadata is deleted.
  def test_delete_leaves_things_in_an_inconsistent_state_if_phidippides_fails_for_some_reason
    Phidippides.any_instance.expects(:fetch_page_metadata).returns(
      status: '200',
      body: { datasetId: 'data-eyed' }
    )
    Phidippides.any_instance.expects(:delete_page_metadata).with do |id, options|
      assert_equal(id, 'four-four')
    end.then.returns({ body: nil, status: '500' })

    core_stub = mock
    core_stub.stubs(reset_counters: {requests: {}, runtime: 0})
    core_stub.expects(:delete_request).with do |url|
      assert_equal('/views.json?id=four-four&method=delete', url)
    end.then.returns('{ "body": null, "status": "200" }')
    CoreServer::Base.stubs(connection: core_stub)

    result = manager.delete('four-four')
    assert_equal(result[:status], '500')
  end

  def test_delete_deletes_phidippides_if_core_doesnt_exist
    Phidippides.any_instance.expects(:delete_page_metadata).with do |id, options|
      assert_equal(id, 'four-four')
    end.then.returns({ body: nil, status: '200' })
    Phidippides.any_instance.expects(:fetch_page_metadata).returns(
      status: '200',
      body: { datasetId: 'data-eyed' }
    )

    core_stub = mock
    core_stub.stubs(reset_counters: {requests: {}, runtime: 0})
    core_stub.expects(:delete_request).with do |url|
      assert_equal('/views.json?id=four-four&method=delete', url)
    end.then.raises(CoreServer::ResourceNotFound.new(nil))
    CoreServer::Base.stubs(connection: core_stub)

    SodaFountain.any_instance.expects(:delete_rollup_table).with do |args|
      assert_equal({dataset_id: 'data-eyed', identifier: 'four-four'}, args)
    end.then.returns({ status: '200' })

    result = manager.delete('four-four')
    assert_equal(result[:status], '200')
  end

  def test_time_range_in_column_catches_fetch_min_max_in_column_returning_nil
    CoreServer::Base.connection.expects(:get_request).raises(CoreServer::Error.new(nil))
    assert_raises(Phidippides::NoMinMaxInColumnException) do
      manager.send(:time_range_in_column, 'four-four', 'fieldName')
    end
  end

  def test_build_soql_v1
    manager.stubs(
      phidippides: stub(
        fetch_dataset_metadata: { body: v1_dataset_metadata },
        fetch_page_metadata: { status: '200', body: v1_page_metadata }
      ),
      column_field_name: 'fieldName',
      logical_datatype_name: 'fred'
    )
    columns = v1_dataset_metadata.fetch('columns')
    cards = v1_page_metadata.fetch('cards')
    expected_soql = 'select some_column, some_other_column, date_trunc_y(time_column_fine_granularity), ' <<
      'signed_magnitude_10(some_number_column), count(*) as value group by some_column, some_other_column, ' <<
      'date_trunc_y(time_column_fine_granularity), signed_magnitude_10(some_number_column)'

    soql = manager.send(:build_rollup_soql, v1_page_metadata, columns, cards)
    assert_equal(expected_soql, soql)
  end

  def test_date_trunc_function_with_decades_of_days
    assert_equal('date_trunc_y', manager.send(:date_trunc_function, (40 * 365.25).to_i))
  end

  def test_date_trunc_function_with_exactly_20_years_of_days
    assert_equal('date_trunc_ym', manager.send(:date_trunc_function, (20 * 365.25).to_i))
  end

  def test_date_trunc_function_with_more_than_year_of_days_less_than_20
    assert_equal('date_trunc_ym', manager.send(:date_trunc_function, (15 * 365.25).to_i))
  end

  def test_date_trunc_function_with_exactly_1_year_of_days
    assert_equal('date_trunc_ymd', manager.send(:date_trunc_function, (1 * 365.25).to_i))
  end

  def test_date_trunc_function_with_less_than_a_year_of_days
    assert_equal('date_trunc_ymd', manager.send(:date_trunc_function, 20))
  end

  def test_date_trunc_function_with_nil_days_returns_year_aggregation
    assert_equal('date_trunc_y', manager.send(:date_trunc_function, nil))
  end

  def test_date_trunc_function_with_0_days_returns_year_aggregation
    assert_equal('date_trunc_y', manager.send(:date_trunc_function, 0))
  end

  def test_dataset_metadata
    Phidippides.any_instance.expects(:fetch_dataset_metadata).times(1).with(NBE_DATASET_ID, {}).returns(
      status: '200',
      body: v1_page_metadata
    )
    result = manager.send(:dataset_metadata, v1_page_metadata['datasetId'], {})
    assert_equal(result.fetch(:body), v1_page_metadata)
  end

  def test_largest_time_span_in_days_being_used_in_columns
    manager.stubs(column_field_name: 'fieldName', logical_datatype_name: 'fred')
    fake_dataset_id = 'four-four'
    manager.unstub(:largest_time_span_in_days_being_used_in_columns)
    time_columns = v1_dataset_metadata.fetch('columns').select do |_, values|
      values['physicalDatatype'] == 'floating_timestamp'
    end
    assert(time_columns.any?, 'Expected time columns in dataset')
    manager.expects(:time_range_in_column).with(fake_dataset_id, 'time_column_large_granularity').returns(300)
    manager.expects(:time_range_in_column).with(fake_dataset_id, 'time_column_fine_granularity').returns(3)
    result = manager.send(:largest_time_span_in_days_being_used_in_columns, time_columns.keys, fake_dataset_id)
    assert_equal(300, result)
  end

  def test_largest_time_span_in_days_being_used_in_columns_equal
    manager.stubs(column_field_name: 'fieldName', logical_datatype_name: 'fred')
    fake_dataset_id = 'four-four'
    manager.unstub(:largest_time_span_in_days_being_used_in_columns)
    time_columns = v1_dataset_metadata.fetch('columns').select do |_, values|
      values['physicalDatatype'] == 'floating_timestamp'
    end
    assert(time_columns.any?, 'Expected time columns in dataset')
    manager.expects(:time_range_in_column).with(fake_dataset_id, 'time_column_large_granularity').returns(300)
    manager.expects(:time_range_in_column).with(fake_dataset_id, 'time_column_fine_granularity').returns(300)
    result = manager.send(:largest_time_span_in_days_being_used_in_columns, time_columns.keys, fake_dataset_id)
    assert_equal(300, result)
  end

  def test_time_range_in_column_dates_equal
    manager.expects(:fetch_min_max_in_column).with('four-four', 'theFieldName').returns(
      'min' => '1987-08-15T00:00:00.000',
      'max' => '1987-08-15T00:00:00.000'
    )
    result = manager.send(:time_range_in_column, 'four-four', 'theFieldName')
    assert_equal(0, result)
  end

  def test_time_range_in_column_dates_reversed
    manager.expects(:fetch_min_max_in_column).with('four-four', 'theFieldName').returns(
      'min' => '1987-08-31T00:00:00.000',
      'max' => '1987-08-01T00:00:00.000'
    )
    result = manager.send(:time_range_in_column, 'four-four', 'theFieldName')
    assert_equal(30, result)
  end

  def test_time_range_in_column_pathologically_large_dates
    manager.expects(:fetch_min_max_in_column).with('four-four', 'theFieldName').returns(
      'min' => '1970-01-01T00:00:00.000',
      'max' => '9999-12-31T23:59:59.999'
    )
    result = manager.send(:time_range_in_column, 'four-four', 'theFieldName')
    assert_equal(2932896, result)
  end

  def test_time_range_in_column_raises_exception_without_min_max
    manager.expects(:fetch_min_max_in_column).with('four-four', 'theFieldName').returns({})
    assert_raises(Phidippides::NoMinMaxInColumnException) do
      manager.send(:time_range_in_column, 'four-four', 'theFieldName')
    end
  end

  def test_time_range_in_column_raises_exception_without_min
    manager.expects(:fetch_min_max_in_column).with('four-four', 'theFieldName').returns(
      'max' => '1984-01-01T00:00:00.000'
    )
    assert_raises(Phidippides::NoMinMaxInColumnException) do
      manager.send(:time_range_in_column, 'four-four', 'theFieldName')
    end
  end

  def test_time_range_in_column_raises_exception_without_max
    manager.expects(:fetch_min_max_in_column).with('four-four', 'theFieldName').returns(
      'min' => '1984-01-01T00:00:00.000'
    )
    assert_raises(Phidippides::NoMinMaxInColumnException) do
      manager.send(:time_range_in_column, 'four-four', 'theFieldName')
    end
  end

  def test_magnitude_function_for_column_returns_smaglin_if_column_range_is_small
    manager.expects(:fetch_min_max_in_column).with('four-four', 'some_number_column').returns(
      'min' => -1000,
      'max' => 1000
    )
    manager.unstub(:magnitude_function_for_column)
    result = manager.send(:magnitude_function_for_column, 'four-four', 'some_number_column')
    assert_equal(result, 'signed_magnitude_lin')
  end

  def test_magnitude_function_for_column_returns_smag_if_column_max_is_large
    manager.expects(:fetch_min_max_in_column).with('four-four', 'some_number_column').returns(
      'min' => -1000,
      'max' => 3000
    )
    manager.unstub(:magnitude_function_for_column)
    result = manager.send(:magnitude_function_for_column, 'four-four', 'some_number_column')
    assert_equal(result, 'signed_magnitude_10')
  end

  def test_magnitude_function_for_column_returns_smag_if_column_min_is_large
    manager.expects(:fetch_min_max_in_column).with('four-four', 'some_number_column').returns(
      'min' => -3000,
      'max' => 1000
    )
    manager.unstub(:magnitude_function_for_column)
    result = manager.send(:magnitude_function_for_column, 'four-four', 'some_number_column')
    assert_equal(result, 'signed_magnitude_10')
  end

  def test_magnitude_function_for_column_raises_exception_without_min_max
    manager.expects(:fetch_min_max_in_column).with('four-four', 'some_number_column').returns({})
    manager.unstub(:magnitude_function_for_column)
    assert_raises(Phidippides::NoMinMaxInColumnException) do
      manager.send(:magnitude_function_for_column, 'four-four', 'some_number_column')
    end
  end

  def test_magnitude_function_for_column_raises_exception_without_min
    manager.expects(:fetch_min_max_in_column).with('four-four', 'some_number_column').returns(
      'max' => 0
    )
    manager.unstub(:magnitude_function_for_column)
    assert_raises(Phidippides::NoMinMaxInColumnException) do
      manager.send(:magnitude_function_for_column, 'four-four', 'some_number_column')
    end
  end

  def test_magnitude_function_for_column_raises_exception_without_max
    manager.expects(:fetch_min_max_in_column).with('four-four', 'some_number_column').returns(
      'min' => 0
    )
    manager.unstub(:magnitude_function_for_column)
    assert_raises(Phidippides::NoMinMaxInColumnException) do
      manager.send(:magnitude_function_for_column, 'four-four', 'some_number_column')
    end
  end

  def test_fetch_min_max_in_column_calls_api
    fake_field_name = 'live-beef'
    fake_dataset_id = 'five-five'
    CoreServer::Base.connection.expects(:get_request).with do |args|
      assert_match(/min\(#{fake_field_name}\)%20AS%20min/i, args)
      assert_match(/max\(#{fake_field_name}\)%20AS%20max/i, args)
      assert_match(/^\/id\/#{fake_dataset_id}/i, args)
    end.returns('[]')
    manager.send(:fetch_min_max_in_column, fake_dataset_id, fake_field_name)
  end

  def test_fetch_min_max_in_column_returns_nil
    CoreServer::Base.connection.expects(:get_request).raises(CoreServer::Error)
    refute(manager.send(:fetch_min_max_in_column, 'dead-beef', 'human'), 'Expects nil when error')
  end

  def test_fetch_min_max_in_column_notifies_airbrake_on_error
    CoreServer::Base.connection.expects(:get_request).raises(CoreServer::Error)
    Airbrake.expects(:notify)
    manager.send(:fetch_min_max_in_column, 'dead-beef', 'human')
  end

  def test_update_date_trunc_function
    manager.stubs(
      largest_time_span_in_days_being_used_in_columns: 12345678,
      date_trunc_function: 'my_date_trunc_func',
      columns_to_roll_up_by_date_trunc: [],
      column_field_name: 'fieldName',
      logical_datatype_name: 'fred'
    )
    page_metadata = {}
    manager.send(:update_date_trunc_function, page_metadata, [], [], {})
    assert_equal(12345678, page_metadata['largestTimeSpanDays'])
    assert_equal('my_date_trunc_func', page_metadata['defaultDateTruncFunction'])
  end

  def test_no_dataset_copy_when_feature_flag_not_set

    APP_CONFIG['secondary_group_identifier'] = false

    PageMetadataManager.any_instance.expects(:update_rollup_table)

    Phidippides.any_instance.stubs(
      update_page_metadata: { status: '200', body: nil },
      fetch_dataset_metadata: { status: '200', body: v1_dataset_metadata }
    )
    stub_feature_flags_with(:metadata_transition_phase, '2')
    NewViewManager.any_instance.expects(:create).returns('data-lens')
    manager.create(v1_page_metadata)
    assert_not_requested @dataset_copy_stub
  end

  def test_no_dataset_copy_when_feature_flag_is_blank
    APP_CONFIG['secondary_group_identifier'] = ''

    PageMetadataManager.any_instance.expects(:update_rollup_table)

    Phidippides.any_instance.stubs(
      update_page_metadata: { status: '200', body: nil },
      fetch_dataset_metadata: { status: '200', body: v1_dataset_metadata }
    )
    stub_feature_flags_with(:metadata_transition_phase, '2')
    NewViewManager.any_instance.expects(:create).returns('data-lens')
    manager.create(v1_page_metadata)
    assert_not_requested @dataset_copy_stub
  end

  private

  def stub_dataset_copy_request(dataset_id)
    dataset_copy_uri = "http://localhost:6010/dataset-copy/_#{dataset_id}/spandex3"
    stub_request(:post, dataset_copy_uri).
      with(
        :headers => {
          'Accept' => '*/*',
          'Content-Type' => 'application/json',
          'User-Agent' => 'Ruby',
          'X-Socrata-Federation' => 'Honey Badger',
          'X-Socrata-Host' => 'localhost'
        }
      ).
      to_return(:status => 200, :body => '', :headers => {})
  end

  def manager
    @manager ||= PageMetadataManager.new
  end

  def v0_page_metadata
    JSON.parse(File.read("#{Rails.root}/test/fixtures/v0-page-metadata.json"))
  end

  def v1_page_metadata
    JSON.parse(File.read("#{Rails.root}/test/fixtures/v1-page-metadata.json"))
  end

  def v1_page_metadata_without_rollup_columns
    JSON.parse(File.read("#{Rails.root}/test/fixtures/v1-page-metadata-without-rollup-columns.json"))
  end

  # We need this because some tests in metadata transition phase 1 match
  # cards in the page metadata to columns in the dataset metadata. The
  # cards in the v0 page metadata stub do not match the columns in the
  # v1 dataset metadata stub, so we provide a version of the stubbed v1
  # page metadata that has been 'backported' to the v0 page metadata format.
  def v1_page_metadata_as_v0
    v1_page_metadata_as_v0 = v0_page_metadata.deep_dup
    v1_page_metadata_as_v0['pageId'] = 'iuya-fxdq'
    v1_page_metadata_as_v0['datasetId'] = NBE_DATASET_ID
    v1_page_metadata_as_v0['description'] = v1_dataset_metadata['description']
    v1_page_metadata_as_v0['cards'] = [
      {
        'description' => 'Test Card',
        'fieldName' => 'some_column',
        'cardSize' => 2,
        'cardType' => 'column',
        'appliedFilters' => [],
        'expanded' => false
      },
      {
        'description' => 'Test Card',
        'fieldName' => 'some_other_column',
        'cardSize' => 2,
        'cardType' => 'column',
        'appliedFilters' => [],
        'expanded' => false
      },
      {
        'description' => 'Test Card',
        'fieldName' => '*',
        'cardSize' => 3,
        'cardType' => 'table',
        'appliedFilters' => [],
        'expanded' => false
      }
    ]

    v1_page_metadata_as_v0.delete('version')

    v1_page_metadata_as_v0
  end

  def v0_dataset_metadata
    JSON.parse(File.read("#{Rails.root}/test/fixtures/v0-dataset-metadata.json"))
  end

  def v0_dataset_metadata_without_rollup_columns
    v0_dataset_metadata.dup.tap do |dataset_md|
      dataset_md['columns'] = dataset_md['columns'].reject do |column|
        %w(category location).include?(column['logicalDatatype'])
      end
    end
  end

  def v1_dataset_metadata
    JSON.parse(File.read("#{Rails.root}/test/fixtures/v1-dataset-metadata.json"))
  end

  def v1_dataset_metadata_without_rollup_columns
    JSON.parse(File.read("#{Rails.root}/test/fixtures/v1-dataset-metadata-without-rollup-columns.json"))
  end

  def remove_table_card(page_metadata)
    page_metadata.dup.tap do |metadata|
      metadata['cards'].select! { |card| card['fieldName'] != '*' }
    end
  end

  def page_metadata_with_no_cards(page_metadata)
    page_metadata.dup.tap { |metadata| metadata['cards'] = [] }
  end

  def stub_fetch_dataset_metadata(body)
    Phidippides.any_instance.stubs(
      fetch_dataset_metadata: { status: '200', body: body }
    )
  end

  def stub_update_page_metadata(body)
    Phidippides.any_instance.
      expects(:update_page_metadata).
      times(1).
      returns(
        status: '200',
        body: body
      )
  end

  def assert_page_has_table_card(page_metadata)
    has_table_card = page_metadata['cards'].pluck('cardType').any? { |cardType| cardType == 'table' }
    assert(has_table_card, 'Page metadata should have table card')
  end

  def stub_migrations
    JSON.parse(
      '{
        "lastSyncJobId" : "acd092ee-008d-4473-8776-7d3e26ddc061",
        "nbeId" : "up67-qs3z",
        "obeId" : "nrhw-r55e",
        "syncedAt" : 1426732353
      }'
    )
  end

end
