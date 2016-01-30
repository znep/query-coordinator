require 'test_helper'

class PageMetadataManagerTest < Test::Unit::TestCase

  OBE_CATEGORY_NAME = 'obe_test_category'
  NBE_CATEGORY_NAME = 'nbe_test_category'
  NBE_DATASET_ID = 'thw2-8btq'
  OBE_DATASET_ID = 'nrhw-r55e'

  def setup
    init_current_domain

    DataLensManager.any_instance.stubs(create: 'niew-veww')
    DataLensManager.any_instance.stubs(update: nil)
    PageMetadataManager.any_instance.stubs(:phidippides => Phidippides.new('localhost', 2401))
    Phidippides.any_instance.stubs(connection_details: {
      'address' => 'localhost',
      'port' => '2401'
    })
    SodaFountain.any_instance.stubs(connection_details: {
      'address' => 'localhost',
      'port' => '6010'
    })
    View.stubs(
      :find => stub(
        :category => OBE_CATEGORY_NAME,
        :migrations => stub_migrations
      )
    )
    stub_feature_flags_with(:enable_data_lens_page_metadata_migrations, false)
    @dataset_copy_stub = stub_dataset_copy_request(NBE_DATASET_ID)
  end

  def test_show_returns_data_with_public_permissions_from_metadb
    core_stub = mock
    core_stub.stubs(reset_counters: {requests: {}, runtime: 0})
    core_stub.expects(:get_request).times(2).returns(
      '{"grants": [{"flags": ["public"]}]}', # fetch permissions
      v2_page_metadata.to_json # fetch page metadata
    )
    CoreServer::Base.stubs(connection: core_stub)

    result = manager.show('mjcb-9cxc')
    assert_equal(%w(
      cards datasetId description name pageId primaryAggregation primaryAmountField version
      permissions displayType moderationStatus shares rights provenance ownerId
    ).sort, result.keys.sort)
    assert_equal({'isPublic' => true, 'rights' => []}.with_indifferent_access, result['permissions'])
  end

  def test_show_returns_data_with_private_permissions_from_metadb
    core_stub = mock
    core_stub.stubs(reset_counters: {requests: {}, runtime: 0})
    core_stub.expects(:get_request).times(2).returns(
      '{"grants": []}', # fetch permissions
      v2_page_metadata.to_json # fetch page metadata
    )
    CoreServer::Base.stubs(connection: core_stub)

    result = manager.show('mjcb-9cxc')
    assert_equal(%w(
      cards datasetId description name pageId primaryAggregation primaryAmountField version
      permissions displayType moderationStatus shares rights provenance ownerId
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

    assert_raises(DataLensManager::ViewAuthenticationRequired) do
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

    assert_raises(DataLensManager::ViewAccessDenied) do
      manager.show('four-four')
    end
  end

  def test_show_succeeds_when_migration_happens_without_update_rights
    stub_feature_flags_with(:enable_data_lens_page_metadata_migrations, true)
    core_stub = mock
    core_stub.expects(:get_request).times(2).with do |url|
      assert_equal('/views/four-four.json', url)
    end.returns(v2_page_metadata.to_json)
    PageMetadataManager.any_instance.expects(:fetch_dataset_columns).returns(v1_dataset_metadata[:columns])
    CoreServer::Base.stubs(connection: core_stub)

    manager.show('four-four')

    stub_feature_flags_with(:enable_data_lens_page_metadata_migrations, false)
  end

  def test_fetch_dataset_columns_does_not_raise_on_success
    manager.expects(:dataset_metadata).returns(:status => '200', :body => v1_dataset_metadata)
    Rails.logger.expects(:error).never
    assert_nothing_raised do
      manager.fetch_dataset_columns('four-four', options)
    end
  end

  def test_fetch_dataset_columns_raises_on_non_success
    manager.expects(:dataset_metadata).returns(:status => '403', :body => v1_dataset_metadata)
    Rails.logger.expects(:error).once
    assert_raises(Phidippides::NoDatasetMetadataException) do
      manager.fetch_dataset_columns('four-four', options)
    end
  end

  def test_create_creates_data_lens_with_category_from_obe_dataset
    manager.expects(:fetch_min_max_in_column).returns(
      'min' => '1987-08-15T00:00:00.000',
      'max' => '1987-08-15T00:00:00.000'
    )
    Phidippides.any_instance.stubs(
      fetch_dataset_metadata: { status: '200', body: v1_dataset_metadata_without_rollup_columns}
    )
    mock_nbe_dataset = stub(:migrations => stub_migrations)
    mock_obe_dataset = stub(:category => OBE_CATEGORY_NAME)
    View.expects(:find).with(NBE_DATASET_ID).returns(mock_nbe_dataset)
    View.expects(:find).with(OBE_DATASET_ID).returns(mock_obe_dataset)

    DataLensManager.any_instance.expects(:create).times(1).with do |category, _|
      assert_equal(OBE_CATEGORY_NAME, category)
    end.returns('fdsa-fdsa')

    SodaFountain.any_instance.expects(:create_or_update_rollup_table).returns({status: 204})
    SodaFountain.any_instance.expects(:issue_request).returns({status: 200})

    manager.create(data_lens_page_metadata)
  end

  def test_create_creates_data_lens_with_category_from_nbe_dataset
    Phidippides.any_instance.stubs(
      fetch_dataset_metadata: { status: '200', body: v1_dataset_metadata_without_rollup_columns}
    )
    manager.stubs(
      fetch_min_max_in_column: {
        'min' => '1987-08-15T00:00:00.000',
        'max' => '1987-08-15T00:00:00.000'
      }
    )
    columns = v1_dataset_metadata.fetch('columns')

    mock_nbe_dataset = stub(
      :migrations => stub_migrations,
      :category => NBE_CATEGORY_NAME
    )
    View.expects(:find).with(NBE_DATASET_ID).returns(mock_nbe_dataset)
    View.expects(:find).with(OBE_DATASET_ID).raises(CoreServer::ResourceNotFound.new(nil))

    DataLensManager.any_instance.expects(:create).times(1).with do |category, _|
      assert_equal(NBE_CATEGORY_NAME, category)
    end.returns('fdsa-fdsa')

    SodaFountain.any_instance.expects(:create_or_update_rollup_table).returns({status: 204})
    SodaFountain.any_instance.expects(:issue_request).returns({status: 200})

    manager.create(data_lens_page_metadata)
  end

  def test_create_ignores_provided_pageId_with_v2_page_metadata
    stub_feature_flags_with(:create_v2_data_lens, true)
    PageMetadataManager.any_instance.expects(:fetch_min_max_in_column).returns(
      'min' => '1987-08-15T00:00:00.000',
      'max' => '1987-08-15T00:00:00.000'
    )
    PageMetadataManager.any_instance.expects(:update_rollup_table).times(1)
    PageMetadataManager.any_instance.expects(:request_soda_fountain_secondary_index).with do |args|
      assert_equal('thw2-8btq', args)
    end.then.returns({ status: '200' })
    DataLensManager.any_instance.expects(:create).times(1).with do |category, metadata|
      assert_equal(metadata['name'], data_lens_page_metadata['name'])
      assert_equal(metadata['description'], data_lens_page_metadata['description'])
    end.returns('data-lens')
    Phidippides.any_instance.stubs(
      fetch_dataset_metadata: { status: '200', body: v1_dataset_metadata_without_rollup_columns }
    )
    Phidippides.any_instance.expects(:update_page_metadata).times(0)

    result = manager.create(data_lens_page_metadata)
    assert_equal('data-lens', result.fetch(:body).fetch('pageId'), 'Expected the new pageId to be returned')
  end

  def test_update_raises_an_error_if_dataset_id_is_not_present_in_page_metadata
    PageMetadataManager.any_instance.expects(:update_rollup_table).times(0)
    Phidippides.any_instance.stubs(
      update_page_metadata: { body: nil, status: '200' }
    )

    assert_raises(Phidippides::NoDatasetIdException) do
      manager.update(data_lens_page_metadata.except('datasetId'))
    end
  end

  def test_update_raises_an_error_if_page_id_is_not_present_in_page_metadata
    PageMetadataManager.any_instance.expects(:update_rollup_table).times(0)
    Phidippides.any_instance.stubs(
      update_page_metadata: { body: nil, status: '200' }
    )

    assert_raises(Phidippides::NoPageIdException) do
      manager.update(data_lens_page_metadata.except('pageId'))
    end
  end

  def test_update_v2_page_metadata_success
    DataLensManager.any_instance.stubs(
      fetch: v2_page_metadata
    )
    PageMetadataManager.any_instance.expects(:update_metadata_rollup_table).times(1).returns(nil)
    core_stub = mock
    core_stub.expects(:update_request).with do |url, payload|
      assert_equal('/views/mjcb-9cxc.json', url)
      assert_match(/"name":"My new page"/, payload)
      assert_match(/"description":"My page has a fun description"/, payload)
      assert_match(/"pageId":"mjcb-9cxc"/, payload)
    end
    CoreServer::Base.stubs(connection: core_stub)

    manager.update(data_lens_page_metadata)
  end

  def test_delete_deletes_core_and_rollup_representation
    DataLensManager.any_instance.stubs(
      fetch: v2_page_metadata
    )

    core_stub = mock
    core_stub.stubs(reset_counters: {requests: {}, runtime: 0})
    core_stub.expects(:delete_request).with do |url|
      assert_equal('/views.json?id=four-four&method=delete', url)
    end.then.returns('{ "body": null, "status": "200" }')
    CoreServer::Base.stubs(connection: core_stub)

    SodaFountain.any_instance.expects(:delete_rollup_table).with do |args|
      assert_equal({dataset_id: 'thw2-8btq', identifier: 'four-four'}, args)
    end.then.returns({ status: '200' })

    result = manager.delete('four-four')
    assert_equal('200', result[:status])
  end

  def test_time_range_in_column_catches_fetch_min_max_in_column_returning_nil
    CoreServer::Base.connection.expects(:get_request).raises(CoreServer::Error.new(nil))
    assert_raises(Phidippides::NoMinMaxInColumnException) do
      manager.send(:time_range_in_column, 'four-four', 'fieldName')
    end
  end

  def test_build_soql
    manager.stubs(
      phidippides: stub(
        fetch_dataset_metadata: { body: v1_dataset_metadata }
      ),
      column_field_name: 'fieldName',
      logical_datatype_name: 'fred',
      fetch_min_max_in_column: {
        'min' => '1987-08-15T00:00:00.000',
        'max' => '1987-08-15T00:00:00.000'
      }
    )
    columns = v1_dataset_metadata.fetch('columns')

    cards = data_lens_page_metadata.fetch('cards')

    expected_soql = 'select some_column, some_other_column, date_trunc_y(time_column_fine_granularity), ' <<
      'some_number_column, signed_magnitude_10(some_number_column), ' <<
      'some_other_number_column, signed_magnitude_linear(some_other_number_column, 500), ' <<
      'count(*) as value group by some_column, some_other_column, date_trunc_y(time_column_fine_granularity), ' <<
      'some_number_column, signed_magnitude_10(some_number_column), ' <<
      'some_other_number_column, signed_magnitude_linear(some_other_number_column, 500)'

    soql = manager.build_rollup_soql(data_lens_page_metadata, columns, cards)
    assert_equal(expected_soql, soql)
  end

  def test_build_rollup_soql_has_date_trunc
    manager.stubs(
      dataset_metadata: { body: v1_dataset_metadata },
      column_field_name: 'fieldName',
      logical_datatype_name: 'fred',
      fetch_min_max_in_column: {
        'min' => '1987-08-15T00:00:00.000',
        'max' => '1987-08-15T00:00:00.000'
      }
    )

    columns = v1_dataset_metadata.fetch('columns')

    cards = data_lens_page_metadata.fetch('cards')

    soql = manager.build_rollup_soql(data_lens_page_metadata, columns, cards)
    assert_match(/date_trunc/, soql)
  end

  def test_build_rollup_soql_has_default_aggregation
    manager.stubs(
      dataset_metadata: { body: v1_dataset_metadata },
      column_field_name: 'some_number_column',
      logical_datatype_name: 'fred',
      fetch_min_max_in_column: {
        'min' => '1987-08-15T00:00:00.000',
        'max' => '1987-08-15T00:00:00.000'
      }
    )

    columns = v1_dataset_metadata.fetch('columns')

    page_metadata = data_lens_page_metadata
    page_metadata['primaryAmountField'] = 'column'
    page_metadata['primaryAggregation'] = 'sum'
    cards = page_metadata.fetch('cards')

    soql = manager.build_rollup_soql(page_metadata, columns, cards)
    assert_match(/sum\([^\)]+\) as value/, soql)
  end

  # card has aggregation field
  def test_build_rollup_soql_for_page_with_card_and_default_aggregation
    manager.stubs(
      dataset_metadata: { body: v1_dataset_metadata },
      column_field_name: 'some_number_column',
      logical_datatype_name: 'fred',
      fetch_min_max_in_column: {
        'min' => '1987-08-15T00:00:00.000',
        'max' => '1987-08-15T00:00:00.000'
      }
    )

    columns = v1_dataset_metadata.fetch('columns')
    page_metadata = data_lens_page_metadata
    page_metadata['primaryAmountField'] = 'default_column'
    page_metadata['primaryAggregation'] = 'default_function'
    page_metadata[:cards][0]['aggregationField'] = 'column'
    page_metadata[:cards][0]['aggregationFunction'] = 'count'
    cards = page_metadata.fetch('cards')

    soql = manager.build_rollup_soql(page_metadata, columns, cards)
    assert_match(/count\(column\), default_function\(default_column\) as value/, soql)
  end

  def test_build_rollup_soql_for_page_with_multiple_cards_aggregations
    manager.stubs(
      dataset_metadata: {body: v1_dataset_metadata },
      column_field_name: 'some_number_column',
      logical_datatype_name: 'fred',
      fetch_min_max_in_column: {
        'min' => '1987-08-15T00:00:00.000',
        'max' => '1987-08-15T00:00:00.000'
      }
    )

    columns = v1_dataset_metadata.fetch('columns')
    page_metadata = data_lens_page_metadata
    page_metadata[:cards][0]['aggregationField'] = 'column'
    page_metadata[:cards][0]['aggregationFunction'] = 'count'
    page_metadata[:cards][1]['aggregationField'] = 'other_column'
    page_metadata[:cards][1]['aggregationFunction'] = 'sum'
    cards = page_metadata.fetch('cards')

    soql = manager.build_rollup_soql(page_metadata, columns, cards)
    assert_match(/count\(column\), sum\(other_column\)/, soql)
  end

  def test_build_rollup_soql_for_page_with_multiple_cards_with_same_aggregation
    manager.stubs(
      dataset_metadata: {body: v1_dataset_metadata },
      column_field_name: 'some_number_column',
      logical_datatype_name: 'fred',
      fetch_min_max_in_column: {
        'min' => '1987-08-15T00:00:00.000',
        'max' => '1987-08-15T00:00:00.000'
      }
    )

    columns = v1_dataset_metadata.fetch('columns')
    page_metadata = data_lens_page_metadata
    page_metadata[:cards][0]['aggregationField'] = 'column'
    page_metadata[:cards][0]['aggregationFunction'] = 'count'
    page_metadata[:cards][1]['aggregationField'] = 'column'
    page_metadata[:cards][1]['aggregationFunction'] = 'count'
    cards = page_metadata.fetch('cards')

    soql = manager.build_rollup_soql(page_metadata, columns, cards)
    assert(soql.scan(/count\(column\)/).length == 1)
  end

  def test_build_rollup_soql_for_page_with_card_with_nil_aggregation_field
    manager.stubs(
      dataset_metadata: {body: v1_dataset_metadata },
      column_field_name: 'some_number_column',
      logical_datatype_name: 'fred',
      fetch_min_max_in_column: {
        'min' => '1987-08-15T00:00:00.000',
        'max' => '1987-08-15T00:00:00.000'
      }
    )

    columns = v1_dataset_metadata.fetch('columns')
    page_metadata = data_lens_page_metadata
    page_metadata[:cards][0]['aggregationField'] = 'column'
    page_metadata[:cards][0]['aggregationFunction'] = 'sum'
    page_metadata[:cards][1]['aggregationField'] = nil
    page_metadata[:cards][1]['aggregationFunction'] = 'count'
    cards = page_metadata.fetch('cards')

    soql = manager.build_rollup_soql(page_metadata, columns, cards)
    assert_match(/sum\(column\)/, soql)
  end

  def test_build_rollup_soql_for_page_with_card_with_nil_aggregation_function
    manager.stubs(
      dataset_metadata: {body: v1_dataset_metadata },
      column_field_name: 'some_number_column',
      logical_datatype_name: 'fred',
      fetch_min_max_in_column: {
        'min' => '1987-08-15T00:00:00.000',
        'max' => '1987-08-15T00:00:00.000'
      }
    )

    columns = v1_dataset_metadata.fetch('columns')
    page_metadata = data_lens_page_metadata
    page_metadata[:cards][0]['aggregationField'] = 'column'
    page_metadata[:cards][0]['aggregationFunction'] = 'sum'
    page_metadata[:cards][1]['aggregationField'] = 'other_column'
    page_metadata[:cards][1]['aggregationFunction'] = nil
    cards = page_metadata.fetch('cards')

    soql = manager.build_rollup_soql(page_metadata, columns, cards)
    assert_match(/sum\(column\)/, soql)
  end

  def test_build_rollup_soql_for_page_with_multiple_nil_card_aggregation_metadata
    manager.stubs(
      dataset_metadata: {body: v1_dataset_metadata },
      column_field_name: 'some_number_column',
      logical_datatype_name: 'fred',
      fetch_min_max_in_column: {
        'min' => '1987-08-15T00:00:00.000',
        'max' => '1987-08-15T00:00:00.000'
      }
    )

    columns = v1_dataset_metadata.fetch('columns')
    page_metadata = data_lens_page_metadata
    page_metadata['primaryAmountField'] = 'column_to_be_defaulted_to'
    page_metadata['primaryAggregation'] = 'function_to_be_defaulted_to'
    page_metadata[:cards][0]['aggregationField'] = nil
    page_metadata[:cards][0]['aggregationFunction'] = 'sum'
    page_metadata[:cards][1]['aggregationField'] = 'other_column'
    page_metadata[:cards][1]['aggregationFunction'] = nil
    cards = page_metadata.fetch('cards')

    soql = manager.build_rollup_soql(page_metadata, columns, cards)
    assert_match(/function_to_be_defaulted_to\(column_to_be_defaulted_to\) as value/, soql)
  end

  def test_build_rollup_soql_for_page_with_nil_default_amount_field
    manager.stubs(
      dataset_metadata: {body: v1_dataset_metadata },
      column_field_name: 'some_number_column',
      logical_datatype_name: 'fred',
      fetch_min_max_in_column: {
        'min' => '1987-08-15T00:00:00.000',
        'max' => '1987-08-15T00:00:00.000'
      }
    )

    columns = v1_dataset_metadata.fetch('columns')
    page_metadata = data_lens_page_metadata
    page_metadata['primaryAmountField'] = nil
    page_metadata['primaryAggregation'] = 'sum'
    page_metadata[:cards][0]['aggregationField'] = nil
    page_metadata[:cards][0]['aggregationFunction'] = 'count'
    page_metadata[:cards][1]['aggregationField'] = 'other_column'
    page_metadata[:cards][1]['aggregationFunction'] = nil
    cards = page_metadata.fetch('cards')

    soql = manager.build_rollup_soql(page_metadata, columns, cards)
    assert_match(/count\(\*\) as value/, soql)
  end

  def test_build_rollup_soql_page_with_nil_default_aggregation
    manager.stubs(
      dataset_metadata: {body: v1_dataset_metadata },
      column_field_name: 'some_number_column',
      logical_datatype_name: 'fred',
      fetch_min_max_in_column: {
        'min' => '1987-08-15T00:00:00.000',
        'max' => '1987-08-15T00:00:00.000'
      }
    )

    columns = v1_dataset_metadata.fetch('columns')
    page_metadata = data_lens_page_metadata
    page_metadata['primaryAmountField'] = 'some_column'
    page_metadata['primaryAggregation'] = nil
    page_metadata[:cards][0]['aggregationField'] = nil
    page_metadata[:cards][0]['aggregationFunction'] = 'sum'
    page_metadata[:cards][1]['aggregationField'] = 'other_column'
    page_metadata[:cards][1]['aggregationFunction'] = nil
    cards = page_metadata.fetch('cards')

    soql = manager.build_rollup_soql(page_metadata, columns, cards)
    assert_match(/count\(\*\) as value/, soql)
  end

  def test_date_trunc_function_for_time_range_with_decades_of_days
    assert_equal('date_trunc_y', manager.send(:date_trunc_function_for_time_range, (40 * 365.25).to_i))
  end

  def test_date_trunc_function_for_time_range_with_exactly_20_years_of_days
    assert_equal('date_trunc_ym', manager.send(:date_trunc_function_for_time_range, (20 * 365.25).to_i))
  end

  def test_date_trunc_function_for_time_range_with_more_than_year_of_days_less_than_20
    assert_equal('date_trunc_ym', manager.send(:date_trunc_function_for_time_range, (15 * 365.25).to_i))
  end

  def test_date_trunc_function_for_time_range_with_between_1_and_2_years_of_days
    assert_equal('date_trunc_ym', manager.send(:date_trunc_function_for_time_range, 517))
  end

  def test_date_trunc_function_for_time_range_with_exactly_1_year_of_days
    assert_equal('date_trunc_ymd', manager.send(:date_trunc_function_for_time_range, (1 * 365.25).to_i))
  end

  def test_date_trunc_function_for_time_range_with_less_than_a_year_of_days
    assert_equal('date_trunc_ymd', manager.send(:date_trunc_function_for_time_range, 20))
  end

  def test_date_trunc_function_for_time_range_with_nil_days_returns_year_aggregation
    assert_equal('date_trunc_y', manager.send(:date_trunc_function_for_time_range, nil))
  end

  def test_date_trunc_function_for_time_range_with_0_days_returns_year_aggregation
    assert_equal('date_trunc_y', manager.send(:date_trunc_function_for_time_range, 0))
  end

  def test_dataset_metadata
    Phidippides.any_instance.expects(:fetch_dataset_metadata).times(1).with(NBE_DATASET_ID, {}).returns(
      status: '200',
      body: v1_dataset_metadata
    )

    result = manager.send(:dataset_metadata, NBE_DATASET_ID, {})
    assert_equal(result.fetch(:body), v1_dataset_metadata)
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

  def test_no_dataset_copy_when_feature_flag_not_set
    APP_CONFIG.secondary_group_identifier = false

    manager.stubs(
      fetch_min_max_in_column: {
        'min' => '1987-08-15T00:00:00.000',
        'max' => '1987-08-15T00:00:00.000'
      }
    )

    PageMetadataManager.any_instance.expects(:update_rollup_table)

    Phidippides.any_instance.stubs(
      update_page_metadata: { status: '200', body: nil },
      fetch_dataset_metadata: { status: '200', body: v1_dataset_metadata }
    )
    DataLensManager.any_instance.expects(:create).returns('data-lens')
    manager.create(data_lens_page_metadata)
    assert_not_requested @dataset_copy_stub
  end

  def test_no_dataset_copy_when_feature_flag_is_blank
    APP_CONFIG.secondary_group_identifier = ''

    manager.stubs(
      fetch_min_max_in_column: {
        'min' => '1987-08-15T00:00:00.000',
        'max' => '1987-08-15T00:00:00.000'
      }
    )

    PageMetadataManager.any_instance.expects(:update_rollup_table)

    Phidippides.any_instance.stubs(
      update_page_metadata: { status: '200', body: nil },
      fetch_dataset_metadata: { status: '200', body: v1_dataset_metadata }
    )
    DataLensManager.any_instance.expects(:create).returns('data-lens')
    manager.create(data_lens_page_metadata)
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

  def v2_page_metadata
    JSON.parse(File.read("#{Rails.root}/test/fixtures/v2-page-metadata.json")).with_indifferent_access
  end

  def data_lens_page_metadata
    v2_page_metadata['displayFormat']['data_lens_page_metadata']
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

  def options
    {
      :request_id => 'request_id',
      :cookies => { :chocolate_chip => 'secretly raisins' }
    }
  end

end
