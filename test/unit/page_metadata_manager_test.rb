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
    PageMetadataManager.any_instance.stubs(:phidippides => Phidippides.new('localhost', 2401))
    Phidippides.any_instance.stubs(connection_details: {
      'address' => 'localhost',
      'port' => '2401'
    })
    SodaFountain.any_instance.stubs(connection_details: {
      'address' => 'localhost',
      'port' => '6010'
    })
    manager.stubs(:largest_time_span_in_days_being_used_in_columns).returns(1000)
    View.stubs(
      :find => stub(
        :category => OBE_CATEGORY_NAME,
        :migrations => stub_migrations
      )
    )
    @dataset_copy_stub = stub_dataset_copy_request('vtvh-wqgq')
  end

  def test_show_returns_data_with_public_permissions_from_phidippides
    Phidippides.any_instance.stubs(
      fetch_page_metadata: {
        status: '200',
        body: v1_page_metadata_without_rollup_columns.merge(core_permissions_public)
      }
    )

    core_stub = mock
    core_stub.stubs(reset_counters: {requests: {}, runtime: 0})
    core_stub.expects(:get_request).times(2).returns(
      '{"grants": [{"flags": ["public"]}]}', # fetch permissions
      '{"displayType": "new_view"}' # fetch page metadata (which is really backed by phiddy)
    )
    CoreServer::Base.stubs(connection: core_stub)

    result = manager.show('four-four')
    assert_equal(%w(
      cards datasetId description name pageId primaryAggregation primaryAmountField
      version largestTimeSpanDays defaultDateTruncFunction permissions displayType moderationStatus
    ).sort, result.keys.sort)
    assert_equal({'isPublic' => true, 'rights' => []}.with_indifferent_access, result['permissions'])
  end

  def test_show_returns_data_with_private_permissions_from_phidippides
    Phidippides.any_instance.stubs(
      fetch_page_metadata: {
        status: '200',
        body: v1_page_metadata_without_rollup_columns.merge(core_permissions_private)
      }
    )

    core_stub = mock
    core_stub.stubs(reset_counters: {requests: {}, runtime: 0})
    core_stub.expects(:get_request).times(2).returns(
      '{"grants": []}', # fetch permissions
      '{"displayType": "new_view"}' # fetch page metadata (which is really backed by phiddy)
    )
    CoreServer::Base.stubs(connection: core_stub)

    result = manager.show('four-four')
    assert_equal(%w(
      cards datasetId description name pageId primaryAggregation primaryAmountField
      version largestTimeSpanDays defaultDateTruncFunction permissions displayType moderationStatus
    ).sort, result.keys.sort)
    assert_equal({'isPublic' => false, 'rights' => []}.with_indifferent_access, result['permissions'])
  end

  def test_show_returns_data_with_public_permissions_from_metadb
    core_stub = mock
    core_stub.stubs(reset_counters: {requests: {}, runtime: 0})
    core_stub.expects(:get_request).times(2).returns(
      '{"grants": [{"flags": ["public"]}]}', # fetch permissions
      %({"displayType": "data_lens", "displayFormat": {"data_lens_page_metadata": #{JSON.generate(v1_page_metadata_without_rollup_columns)}}}) # fetch page metadata
    )
    CoreServer::Base.stubs(connection: core_stub)

    result = manager.show('four-four')
    assert_equal(%w(
      cards datasetId description name pageId primaryAggregation primaryAmountField version
      largestTimeSpanDays defaultDateTruncFunction permissions displayType moderationStatus shares
      rights
    ).sort, result.keys.sort)
    assert_equal({'isPublic' => true, 'rights' => []}.with_indifferent_access, result['permissions'])
  end

  def test_show_returns_data_with_private_permissions_from_metadb
    core_stub = mock
    core_stub.stubs(reset_counters: {requests: {}, runtime: 0})
    core_stub.expects(:get_request).times(2).returns(
      '{"grants": []}', # fetch permissions
      %({"displayType": "data_lens", "displayFormat": {"data_lens_page_metadata": #{JSON.generate(v1_page_metadata_without_rollup_columns)}}}) # fetch page metadata
    )
    CoreServer::Base.stubs(connection: core_stub)

    result = manager.show('four-four')
    assert_equal(%w(
      cards datasetId description name pageId primaryAggregation primaryAmountField version
      largestTimeSpanDays defaultDateTruncFunction permissions displayType moderationStatus shares
      rights
    ).sort, result.keys.sort)
    assert_equal({'isPublic' => false, 'rights' => []}.with_indifferent_access, result['permissions'])
  end

  def test_show_raises_error_if_core_needs_authn
    core_stub = mock
    core_stub.stubs(reset_counters: {requests: {}, runtime: 0})
    core_stub.expects(:get_request).with do |url|
      assert_equal('/views/four-four.json', url)
    end.then.raises(CoreServer::CoreServerError.new(nil, 'authentication_required', nil))
    CoreServer::Base.stubs(connection: core_stub)

    assert_raises(NewViewManager::ViewAuthenticationRequired) do
      manager.show('four-four')
    end
  end

  def test_show_raises_error_if_core_needs_authz
    core_stub = mock
    core_stub.stubs(reset_counters: {requests: {}, runtime: 0})
    core_stub.expects(:get_request).with do |url|
      assert_equal('/views/four-four.json', url)
    end.then.raises(CoreServer::CoreServerError.new(nil, 'permission_denied', nil))
    CoreServer::Base.stubs(connection: core_stub)

    assert_raises(NewViewManager::ViewAccessDenied) do
      manager.show('four-four')
    end
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

    NewViewManager.any_instance.expects(:create).times(1).with do |_, category|
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

    NewViewManager.any_instance.expects(:create).times(1).with do |_, category|
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

  def test_create_ignores_provided_pageId_with_v1_page_metadata
    stub_feature_flags_with(:create_v2_data_lens, false)
    PageMetadataManager.any_instance.expects(:update_rollup_table).times(0)
    NewViewManager.any_instance.expects(:create).times(1).with do |metadata|
      assert_equal(v1_page_metadata['name'], metadata['name'])
      assert_equal(v1_page_metadata['description'], metadata['description'])
    end.returns('data-lens')
    Phidippides.any_instance.stubs(
      fetch_page_metadata: { status: '200', body: v1_page_metadata_without_rollup_columns },
      fetch_dataset_metadata: { status: '200', body: v1_dataset_metadata_without_rollup_columns }
    )
    Phidippides.any_instance.expects(:update_page_metadata).times(1).with do |page_metadata|
      assert_equal(page_metadata['pageId'], 'data-lens')
    end.returns({ body: nil, status: '200' })

    result = manager.create(v1_page_metadata_without_rollup_columns)
    assert_equal('data-lens', result.fetch(:body).fetch('pageId'), 'Expected the new pageId to be returned')
  end

  def test_create_ignores_provided_pageId_with_v2_page_metadata
    metadata = v2_page_metadata['displayFormat']['data_lens_page_metadata']
    stub_feature_flags_with(:create_v2_data_lens, true)
    PageMetadataManager.any_instance.expects(:update_rollup_table).times(1)
    PageMetadataManager.any_instance.expects(:request_soda_fountain_secondary_index).with do |args|
      assert_equal('thw2-8btq', args)
    end.then.returns({ status: '200' })
    NewViewManager.any_instance.expects(:create).times(1).with do |metadata|
      assert_equal(metadata['name'], metadata['name'])
      assert_equal(metadata['description'], metadata['description'])
    end.returns('data-lens')
    Phidippides.any_instance.stubs(
      fetch_dataset_metadata: { status: '200', body: v1_dataset_metadata_without_rollup_columns }
    )
    Phidippides.any_instance.expects(:update_page_metadata).times(0)

    result = manager.create(metadata)
    assert_equal('data-lens', result.fetch(:body).fetch('pageId'), 'Expected the new pageId to be returned')
  end

  def test_update_raises_an_error_if_dataset_id_is_not_present_in_page_metadata
    PageMetadataManager.any_instance.expects(:update_rollup_table).times(0)
    Phidippides.any_instance.stubs(
      update_page_metadata: { body: nil, status: '200' }
    )

    assert_raises(Phidippides::NoDatasetIdException) do
      manager.update(v1_page_metadata.except('datasetId'))
    end
  end

  def test_update_raises_an_error_if_page_id_is_not_present_in_page_metadata
    PageMetadataManager.any_instance.expects(:update_rollup_table).times(0)
    Phidippides.any_instance.stubs(
      update_page_metadata: { body: nil, status: '200' }
    )

    assert_raises(Phidippides::NoPageIdException) do
      manager.update(v1_page_metadata.except('pageId'))
    end
  end

  def test_update_v2_page_metadata_success
    NewViewManager.any_instance.stubs(
      fetch: v2_page_metadata
    )
    core_stub = mock
    core_stub.expects(:update_request).with do |url, payload|
      assert_equal('/views/mjcb-9cxc.json', url)
      assert_match(/"name":"San Francisco 311"/, payload)
      assert_match(/"description":"Cases created since 7\/1\/2008 with location information"/, payload)
      assert_match(/"pageId":"iuya-fxdq"/, payload)
    end
    CoreServer::Base.stubs(connection: core_stub)

    manager.update(v1_page_metadata)
  end

  def test_update_metadata_bypass_to_phiddy_if_v1_metadata
    PageMetadataManager.any_instance.expects(:update_rollup_table)
    Phidippides.any_instance.stubs(
      fetch_dataset_metadata: { body: v1_dataset_metadata, status: '200' },
      update_page_metadata: { body: nil, status: '200' }
    )
    NewViewManager.any_instance.stubs(
      fetch: v1_page_metadata
    )

    manager.update(v1_page_metadata)
  end

  def test_delete_deletes_core_and_phidippides_and_rollup_representation
    NewViewManager.any_instance.stubs(
      fetch: v1_page_metadata
    )
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
    NewViewManager.any_instance.stubs(
      fetch: v1_page_metadata
    )
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
    NewViewManager.any_instance.stubs(
      fetch: v1_page_metadata
    )
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
    NewViewManager.any_instance.stubs(
      fetch: v1_page_metadata
    )
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

  def test_delete_does_not_impact_phidippides_when_metadata_backed_by_metadb
    NewViewManager.any_instance.stubs(
      fetch: v2_page_metadata
    )
    SodaFountain.any_instance.expects(:delete_rollup_table).with do |args|
      assert_equal({dataset_id: 'thw2-8btq', identifier: 'mjcb-9cxc'}, args)
    end.then.returns({ status: '200' })
    core_stub = mock
    core_stub.stubs(reset_counters: {requests: {}, runtime: 0})
    core_stub.expects(:delete_request).with do |url|
      assert_equal('/views.json?id=mjcb-9cxc&method=delete', url)
    end.then.returns('{ "body": null, "status": "200" }')
    CoreServer::Base.stubs(connection: core_stub)

    result = manager.delete('mjcb-9cxc')
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
      logical_datatype_name: 'fred',
      fetch_min_max_in_column: { min: 0, max: 0 }
    )
    columns = v1_dataset_metadata.fetch('columns')
    cards = v1_page_metadata.fetch('cards')
    expected_soql = 'select some_column, some_other_column, date_trunc_y(time_column_fine_granularity), ' <<
      'signed_magnitude_10(some_number_column), signed_magnitude_linear(some_other_number_column, 500), ' <<
      'count(*) as value group by some_column, some_other_column, date_trunc_y(time_column_fine_granularity), ' <<
      'signed_magnitude_10(some_number_column), signed_magnitude_linear(some_other_number_column, 500)'

    soql = manager.build_rollup_soql(v1_page_metadata, columns, cards)
    assert_equal(expected_soql, soql)
  end

  def test_build_rollup_soql_has_date_trunc
    manager.stubs(
      dataset_metadata: { body: v1_dataset_metadata },
      column_field_name: 'fieldName',
      logical_datatype_name: 'fred',
      fetch_min_max_in_column: { min: 0, max: 0 }
    )
    columns = v1_dataset_metadata.fetch('columns')
    cards = v1_page_metadata.fetch('cards')
    soql = manager.build_rollup_soql(v1_page_metadata, columns, cards)
    assert_match(/date_trunc/, soql)
  end

  def test_build_rollup_soql_has_aggregation
    manager.stubs(
      dataset_metadata: { body: v1_dataset_metadata },
      column_field_name: 'some_number_column',
      logical_datatype_name: 'fred',
      fetch_min_max_in_column: { min: 0, max: 0 }
    )
    columns = v1_dataset_metadata.fetch('columns')
    cards = v1_page_metadata.fetch('cards')
    soql = manager.build_rollup_soql(v1_page_metadata_with_aggregation, columns, cards)
    assert_match(/sum\([^\)]+\) as value/, soql)
  end

  def test_fills_in_missing_default_date_trunc_function
    manager.stubs(
      phidippides: stub(fetch_dataset_metadata: { body: v1_dataset_metadata }),
      date_trunc_function: nil,
      column_field_name: 'fieldName',
      logical_datatype_name: 'fred'
    )
    columns = v1_dataset_metadata.fetch('columns')
    cards = v1_page_metadata.fetch('cards')

    manager.build_rollup_soql(v1_page_metadata.except('defaultDateTruncFunction'), columns, cards)

    assert_includes(v1_page_metadata, 'defaultDateTruncFunction')
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

  def test_date_trunc_function_with_between_1_and_2_years_of_days
    assert_equal('date_trunc_ym', manager.send(:date_trunc_function, 517))
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
    APP_CONFIG.secondary_group_identifier = false

    manager.stubs(
      fetch_min_max_in_column: { min: 0, max: 0 }
    )

    PageMetadataManager.any_instance.expects(:update_rollup_table)

    Phidippides.any_instance.stubs(
      update_page_metadata: { status: '200', body: nil },
      fetch_dataset_metadata: { status: '200', body: v1_dataset_metadata }
    )
    NewViewManager.any_instance.expects(:create).returns('data-lens')
    manager.create(v1_page_metadata)
    assert_not_requested @dataset_copy_stub
  end

  def test_no_dataset_copy_when_feature_flag_is_blank
    APP_CONFIG.secondary_group_identifier = ''

    manager.stubs(
      fetch_min_max_in_column: { min: 0, max: 0 }
    )

    PageMetadataManager.any_instance.expects(:update_rollup_table)

    Phidippides.any_instance.stubs(
      update_page_metadata: { status: '200', body: nil },
      fetch_dataset_metadata: { status: '200', body: v1_dataset_metadata }
    )
    NewViewManager.any_instance.expects(:create).returns('data-lens')
    manager.create(v1_page_metadata)
    assert_not_requested @dataset_copy_stub
  end

  private

  def stub_dataset_copy_request(dataset_id)
    secondary_group_identifier = APP_CONFIG.secondary_group_identifier || 'spandex'
    dataset_copy_uri = "http://localhost:6010/dataset-copy/_#{dataset_id}/#{secondary_group_identifier}"
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

  def v1_page_metadata_with_aggregation
    metadata = v1_page_metadata
    metadata['primaryAmountField'] = 'column'
    metadata['primaryAggregation'] = 'sum'
    metadata
  end

  def v2_page_metadata
    JSON.parse(File.read("#{Rails.root}/test/fixtures/v2-page-metadata.json")).with_indifferent_access
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

  def core_permissions_public
    JSON.parse(File.read("#{Rails.root}/test/fixtures/core-permissions-public.json"))
  end

  def core_permissions_private
    JSON.parse(File.read("#{Rails.root}/test/fixtures/core-permissions-private.json"))
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
