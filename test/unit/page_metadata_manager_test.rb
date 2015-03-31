require 'test_helper'

class PageMetadataManagerTest < Test::Unit::TestCase

  def setup
    CurrentDomain.stubs(domain: stub(cname: 'localhost'))
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
  end

  def test_create_succeeds
    PageMetadataManager.any_instance.expects(:update_rollup_table).times(3)

    Phidippides.any_instance.stubs(
      update_page_metadata: { status: '200', body: v0_page_metadata },
      fetch_dataset_metadata: { status: '200', body: v0_dataset_metadata },
    )

    stub_feature_flags_with(:metadata_transition_phase, '0')
    result = manager.create(v0_page_metadata)
    assert(result.fetch(:status) == '200', 'Expected create result status to be 200')
    assert(result.fetch(:body).fetch('pageId'), 'Expected a non-nil pageId to be created')

    Phidippides.any_instance.stubs(
      fetch_dataset_metadata: { status: '200', body: v1_dataset_metadata }
    )
    stub_feature_flags_with(:metadata_transition_phase, '1')
    result = manager.create(v1_page_metadata_as_v0)
    assert(result.fetch(:status) == '200', 'Expected create result status to be 200')
    assert(result.fetch(:body).fetch('pageId'), 'Expected a non-nil pageId to be created')

    Phidippides.any_instance.stubs(
      update_page_metadata: { status: '200', body: nil }
    )
    stub_feature_flags_with(:metadata_transition_phase, '2')
    NewViewManager.any_instance.expects(:create).times(1).with do |name, description|
      assert_equal(v1_page_metadata['name'], name)
      assert_equal(v1_page_metadata['description'], description)
    end.then.returns('data-lens')
    result = manager.create(v1_page_metadata)
    assert_equal('200', result.fetch(:status), 'Expected create result status to be 200')
    assert_equal('data-lens', result.fetch(:body).fetch('pageId'), 'Expected the new pageId to be returned')
    assert_equal(1000, result.fetch(:body).fetch('largestTimeSpanDays'), 'Expected the value for the largest time span to be set')
    assert_match(/date_trunc_\w+/, result.fetch(:body).fetch('defaultDateTruncFunction'), 'Includes date_trunc function')
  end

  def test_create_creates_data_lens_with_reference_v1
    Phidippides.any_instance.stubs(
      fetch_dataset_metadata: { status: '200', body: v1_dataset_metadata_without_rollup_columns},
    )
    stub_feature_flags_with(:metadata_transition_phase, '0')
    Phidippides.any_instance.expects(:update_page_metadata).times(1).with do |page_metadata|
      # Make sure the page_metadata includes the correct id
      assert_equal('fdsa-fdsa', page_metadata['pageId'])
    end.then.returns(status: '200', body: {})

    NewViewManager.any_instance.expects(:create).times(1).with do |name, description|
      # Make sure it's creating the new view pointing to the correct page-id
      assert_match(/^Chicago Crimes Loves/, name)
      assert_match(/^This dataset reflects/, description)
    end.then.returns('fdsa-fdsa')

    manager.create(v0_page_metadata)
  end

  def test_create_raises_no_dataset_metadata_exception_when_phiddy_craps_out_v0
    stub_feature_flags_with(:metadata_transition_phase, '0')
    manager.stubs(:dataset_metadata => { status: '500', body: nil })
    assert_raises(Phidippides::NoDatasetMetadataException) do
      manager.create(v0_page_metadata)
    end
  end

  def test_create_raises_no_dataset_metadata_exception_when_phiddy_craps_out_v1
    stub_feature_flags_with(:metadata_transition_phase, '3')
    manager.stubs(:dataset_metadata => { status: '500', body: nil })
    assert_raises(Phidippides::NoDatasetMetadataException) do
      manager.create(v1_page_metadata)
    end
  end

  def test_create_ignores_provided_pageId
    PageMetadataManager.any_instance.expects(:update_rollup_table).times(0)
    NewViewManager.any_instance.expects(:create).times(1).with do |name, description|
      assert_equal(v1_page_metadata['name'], name)
      assert_equal(v1_page_metadata['description'], description)
    end.then.returns('data-lens')
    Phidippides.any_instance.stubs(
      fetch_dataset_metadata: { status: '200', body: v1_dataset_metadata_without_rollup_columns }
    )
    Phidippides.any_instance.expects(:update_page_metadata).times(1).with do |page_metadata|
      assert_equal(page_metadata['pageId'], 'data-lens')
    end.then.returns({ body: nil, status: '200' })

    stub_feature_flags_with(:metadata_transition_phase, '2')

    result = manager.create(v1_page_metadata)
    assert_equal('data-lens', result.fetch(:body).fetch('pageId'), 'Expected the new pageId to be returned')
  end

  def test_create_raises_an_error_if_dataset_id_is_not_present_in_new_page_metadata
    PageMetadataManager.any_instance.expects(:update_rollup_table).times(0)
    Phidippides.any_instance.stubs(
      update_page_metadata: { body: nil, status: '200' }
    )

    stub_feature_flags_with(:metadata_transition_phase, '0')
    assert_raises(Phidippides::NoDatasetIdException) do
      manager.create(v1_page_metadata.except('datasetId').except('pageId'))
    end

    stub_feature_flags_with(:metadata_transition_phase, '1')
    assert_raises(Phidippides::NoDatasetIdException) do
      manager.create(v1_page_metadata.except('datasetId').except('pageId'))
    end

    stub_feature_flags_with(:metadata_transition_phase, '2')
    assert_raises(Phidippides::NoDatasetIdException) do
      manager.create(v1_page_metadata.except('datasetId').except('pageId'))
    end
  end

  def test_create_does_not_try_to_create_rollup_table_when_not_given_eligible_columns_in_phase_0
    PageMetadataManager.any_instance.expects(:update_rollup_table).times(0)
    Phidippides.any_instance.stubs(
      update_page_metadata: { status: '200', body: v0_page_metadata },
      fetch_dataset_metadata: { status: '200', body: v0_dataset_metadata_without_rollup_columns }
    )
    stub_feature_flags_with(:metadata_transition_phase, '0')

    # Make sure our assumptions about the dataset we're using are true
    rollup_column_doesnt_exist = v0_dataset_metadata_without_rollup_columns['columns'].none? do |column|
      column['logicalDatatype'] == 'category'
    end
    assert(rollup_column_doesnt_exist)
    rollup_column_exists = v0_dataset_metadata['columns'].find do |column|
      column['logicalDatatype'] == 'category'
    end
    assert(rollup_column_exists)

    result = manager.create(v0_page_metadata)

    assert(result.fetch(:status) == '200', 'Expected create result status to be 200')
    assert(result.fetch(:body).fetch('pageId'), 'Expected a non-nil pageId to be created')
  end

  def test_create_does_not_try_to_create_rollup_table_when_not_given_eligible_columns_in_phase_1
    PageMetadataManager.any_instance.expects(:update_rollup_table).times(0)
    Phidippides.any_instance.stubs(
      update_page_metadata: { status: '200', body: v0_page_metadata },
      fetch_dataset_metadata: { status: '200', body: v1_dataset_metadata_without_rollup_columns }
    )
    stub_feature_flags_with(:metadata_transition_phase, '1')

    # Make sure our assumptions about the dataset we're using are true
    rollup_column_doesnt_exist = v1_dataset_metadata_without_rollup_columns['columns'].none? do |field_name, column|
      column['fred'] == 'category'
    end
    assert(rollup_column_doesnt_exist)
    rollup_column_exists = v1_dataset_metadata['columns'].find do |field_name, column|
      column['fred'] == 'category'
    end
    assert(rollup_column_exists)

    result = manager.create(v0_page_metadata)

    assert(result.fetch(:status) == '200', 'Expected create result status to be 200')
    assert(result.fetch(:body).fetch('pageId'), 'Expected a non-nil pageId to be created')
  end

  def test_create_does_not_try_to_create_rollup_table_when_not_given_eligible_columns_in_phase_2
    PageMetadataManager.any_instance.expects(:update_rollup_table).times(0)
    Phidippides.any_instance.stubs(
      update_page_metadata: { status: '200', body: nil },
      fetch_dataset_metadata: { status: '200', body: v1_dataset_metadata_without_rollup_columns }
    )
    stub_feature_flags_with(:metadata_transition_phase, '2')

    # Make sure our assumptions about the dataset we're using are true
    rollup_column_doesnt_exist = v1_dataset_metadata_without_rollup_columns['columns'].none? do |field_name, column|
      column['fred'] == 'category'
    end
    assert(rollup_column_doesnt_exist)
    rollup_column_exists = v1_dataset_metadata['columns'].find do |field_name, column|
      column['fred'] == 'category'
    end
    assert(rollup_column_exists)

    result = manager.create(v1_page_metadata.except('pageId'))

    assert_equal('200', result.fetch(:status))
    assert_not_nil(result.fetch(:body).fetch('pageId'))
  end

  def test_create_ensures_table_card_phase0
    PageMetadataManager.any_instance.expects(:update_rollup_table).times(1)

    stub_fetch_dataset_metadata(v0_dataset_metadata)
    stub_feature_flags_with(:metadata_transition_phase, '0')
    stub_update_page_metadata(v0_page_metadata).
      with { |page, _| assert_page_has_table_card(page) }

    result = manager.create(remove_table_card(v0_page_metadata))
    assert_equal('200', result.fetch(:status), 'Expected create result status to be 200')
  end

  def test_create_ensures_table_card_phase1
    PageMetadataManager.any_instance.expects(:update_rollup_table).times(1)

    stub_fetch_dataset_metadata(v1_dataset_metadata)
    stub_feature_flags_with(:metadata_transition_phase, '1')
    stub_update_page_metadata(v1_page_metadata_as_v0).
      with { |page, _| assert_page_has_table_card(page) }

    result = manager.create(remove_table_card(v1_page_metadata_as_v0))
    assert_equal('200', result.fetch(:status), 'Expected create result status to be 200')
  end

  def test_create_ensures_table_card_phase2
    PageMetadataManager.any_instance.expects(:update_rollup_table).times(1)

    stub_fetch_dataset_metadata(v1_dataset_metadata)
    stub_feature_flags_with(:metadata_transition_phase, '2')
    stub_update_page_metadata(v1_page_metadata).
      with { |page, _| assert_page_has_table_card(page) }

    result = manager.create(remove_table_card(v1_page_metadata).except('pageId'))
    assert_equal('200', result.fetch(:status))
  end

  def test_create_ensures_table_card_when_no_cards_phase0
    stub_fetch_dataset_metadata(v0_dataset_metadata)
    stub_feature_flags_with(:metadata_transition_phase, '0')
    stub_update_page_metadata(v0_page_metadata).
      with { |page, _| assert_page_has_table_card(page) }

    result = manager.create(page_metadata_with_no_cards(v1_page_metadata).except('pageId'))
    assert_equal('200', result.fetch(:status), 'Expected create result status to be 200')
  end

  def test_create_ensures_table_card_when_no_cards_phase1
    stub_fetch_dataset_metadata(v1_dataset_metadata)
    stub_feature_flags_with(:metadata_transition_phase, '1')
    stub_update_page_metadata(v1_page_metadata_as_v0).
      with { |page, _| assert_page_has_table_card(page) }

    result = manager.create(page_metadata_with_no_cards(v1_page_metadata).except('pageId'))
    assert_equal('200', result.fetch(:status), 'Expected create result status to be 200')
  end

  def test_create_ensures_table_card_when_no_cards_phase2
    stub_fetch_dataset_metadata(v1_dataset_metadata)
    stub_feature_flags_with(:metadata_transition_phase, '2')
    stub_update_page_metadata(v1_page_metadata).
      with { |page, _| assert_page_has_table_card(page) }

    result = manager.create(page_metadata_with_no_cards(v1_page_metadata).except('pageId'))
    assert_equal('200', result.fetch(:status), 'Expected create result status to be 200')
  end

  def test_update_succeeds_phase_0
    PageMetadataManager.any_instance.expects(:update_rollup_table).times(2)

    # Phase 0
    Phidippides.any_instance.stubs(
      update_page_metadata: { status: '200', body: v0_page_metadata },
      fetch_dataset_metadata: { status: '200', body: v0_dataset_metadata },
      fetch_page_metadata: { status: '200', body: v0_page_metadata },
    )
    stub_feature_flags_with(:metadata_transition_phase, '0')
    manager.create(v0_page_metadata)
    Phidippides.any_instance.expects(:update_page_metadata).times(1).with do |json, options|
      assert(json.fetch('bunch'))
      assert(json.fetch('foo'))
      assert_equal({}, options)
    end.then.returns(
      status: '200',
      body: v0_page_metadata
    )

    manager.update(v0_page_metadata.merge('bunch' => 'other stuff', 'foo' => 'bar'))
  end

  def test_update_creates_data_lens_with_reference_v0
    stub_feature_flags_with(:metadata_transition_phase, '0')
    manager.stubs(
      build_rollup_soql: nil,
      dataset_metadata: { status: '200', body: v0_dataset_metadata }
    )
    Phidippides.any_instance.expects(:update_page_metadata).times(1).with do |page_metadata|
      # Make sure the page_metadata includes the correct data lens id
      assert_equal('page-eyed', page_metadata['pageId'])
    end.then.returns(status: '200', body: {})

    NewViewManager.any_instance.expects(:update).times(1).with do |lens_id, name, description|
      # Make sure it's creating the new view pointing to the correct page-id
      assert_equal('page-eyed', lens_id)
      assert_equal('new name', name)
      assert_equal('new description', description)
    end.then.returns('fdsa-fdsa')

    manager.update({
      'datasetId' => 'data-eyed',
      'pageId' => 'page-eyed',
      'name' => 'new name',
      'description' => 'new description'
    })
  end

  def test_update_succeeds_phase_1
    PageMetadataManager.any_instance.expects(:update_rollup_table).times(2)

    Phidippides.any_instance.stubs(
      fetch_dataset_metadata: { status: '200', body: v1_dataset_metadata },
      update_page_metadata: { status: '200', body: v1_page_metadata },
      fetch_page_metadata: { status: '200', body: v1_page_metadata },
    )

    stub_feature_flags_with(:metadata_transition_phase, '1')
    manager.create(v1_page_metadata_as_v0)
    Phidippides.any_instance.expects(:update_page_metadata).times(1).with do |json, options|
      assert(json.fetch('bunch'))
      assert(json.fetch('foo'))
      assert_equal({}, options)
    end.then.returns(
      status: '200',
      body: v1_page_metadata_as_v0
    )
    manager.update(v1_page_metadata_as_v0.merge('bunch' => 'other stuff', 'foo' => 'bar'))
  end

  def test_update_succeeds_phase_2
    PageMetadataManager.any_instance.expects(:update_rollup_table).times(2)

    Phidippides.any_instance.stubs(
      fetch_dataset_metadata: { status: '200', body: v1_dataset_metadata },
      update_page_metadata: { status: '200', body: nil },
      fetch_page_metadata: { status: '200', body: {} },
    )
    stub_feature_flags_with(:metadata_transition_phase, '2')
    manager.create(v1_page_metadata.except('pageId'))
    Phidippides.any_instance.expects(:update_page_metadata).times(1).with do |json, options|
      assert(json.fetch('bunch'))
      assert(json.fetch('foo'))
      assert_equal({}, options)
    end.then.returns(
      status: '200',
      body: v1_page_metadata.merge('bunch' => 'other stuff', 'foo' => 'bar')
    )

    manager.update(v1_page_metadata.merge('bunch' => 'other stuff', 'foo' => 'bar'))
  end

  def test_update_raises_an_error_if_dataset_id_is_not_present_in_page_metadata
    PageMetadataManager.any_instance.expects(:update_rollup_table).times(0)
    Phidippides.any_instance.stubs(
      update_page_metadata: { body: nil, status: '200' }
    )

    stub_feature_flags_with(:metadata_transition_phase, '0')
    assert_raises(Phidippides::NoDatasetIdException) do
      manager.update(v1_page_metadata.except('datasetId'))
    end

    stub_feature_flags_with(:metadata_transition_phase, '1')
    assert_raises(Phidippides::NoDatasetIdException) do
      manager.update(v1_page_metadata.except('datasetId'))
    end

    stub_feature_flags_with(:metadata_transition_phase, '2')
    assert_raises(Phidippides::NoDatasetIdException) do
      manager.update(v1_page_metadata.except('datasetId'))
    end
  end

  def test_update_raises_an_error_if_page_id_is_not_present_in_page_metadata
    PageMetadataManager.any_instance.expects(:update_rollup_table).times(0)
    Phidippides.any_instance.stubs(
      update_page_metadata: { body: nil, status: '200' }
    )

    stub_feature_flags_with(:metadata_transition_phase, '0')
    assert_raises(Phidippides::NoPageIdException) do
      manager.update(v1_page_metadata.except('pageId'))
    end

    stub_feature_flags_with(:metadata_transition_phase, '1')
    assert_raises(Phidippides::NoPageIdException) do
      manager.update(v1_page_metadata.except('pageId'))
    end

    stub_feature_flags_with(:metadata_transition_phase, '2')
    assert_raises(Phidippides::NoPageIdException) do
      manager.update(v1_page_metadata.except('pageId'))
    end
  end

  def test_update_does_not_delete_rollup_first
    SodaFountain.any_instance.expects(:delete_rollup_table).never
    SodaFountain.any_instance.stubs(create_or_update_rollup_table: { status: 204 })

    # Phase 0
    Phidippides.any_instance.stubs(
      update_page_metadata: { status: '200', body: v0_page_metadata },
      fetch_dataset_metadata: { status: '200', body: v0_dataset_metadata },
      fetch_page_metadata: { status: '200', body: v0_page_metadata },
      update_page_metadata: { status: '200', body: v0_page_metadata }
    )
    stub_feature_flags_with(:metadata_transition_phase, '0')
    result = manager.update(v0_page_metadata)
    assert(result[:status] == '200', 'Expected create result status to be 200')
    # Call update a second time to try to trick it into deleting and
    # re-creating the rollup table(?)
    manager.update(v0_page_metadata)

    # Phase 1
    Phidippides.any_instance.stubs(
      fetch_dataset_metadata: { status: '200', body: v1_dataset_metadata }
    )
    stub_feature_flags_with(:metadata_transition_phase, '1')
    result = manager.update(v0_page_metadata)
    assert(result[:status] == '200', 'Expected create result status to be 200')
    manager.update(v0_page_metadata)

    # Phase 2
    Phidippides.any_instance.stubs(
      update_page_metadata: { status: '200', body: nil },
      fetch_page_metadata: { status: '200', body: v1_page_metadata },
      update_page_metadata: { status: '200', body: nil }
    )
    stub_feature_flags_with(:metadata_transition_phase, '2')
    result = manager.update(v1_page_metadata)
    assert(result[:status] == '200', 'Expected create result status to be 200')
    manager.update(v1_page_metadata)
  end

  # Yes, this is a private method, but it warranted at least some unit testing
  def test_build_soql_v0
    manager.stubs(
      phidippides: stub(fetch_dataset_metadata: { body: v0_dataset_metadata }),
      date_trunc_function: 'my_date_trunc_func',
      column_field_name: 'name',
      logical_datatype_name: 'logicalDatatype'
    )
    stub_feature_flags_with(:metadata_transition_phase, '0')
    columns = v0_dataset_metadata.fetch('columns')
    cards = v0_page_metadata.fetch('cards')
    soql = manager.send(:build_rollup_soql, v0_page_metadata, columns, cards)
    expected = 'select location_description, primary_type, count(*) as value ' <<
      'group by location_description, primary_type'
    assert_equal(expected, soql)
  end

  def test_build_soql_v1
    stub_feature_flags_with(:metadata_transition_phase, '2')
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
    expected_soql = 'select some_column, date_trunc_y(time_column_fine_granularity), count(*) as value ' <<
      'group by some_column, date_trunc_y(time_column_fine_granularity)'

    soql = manager.send(:build_rollup_soql, v1_page_metadata, columns, cards)
    assert_equal(expected_soql, soql)
  end

  def test_build_rollup_soql_for_phase_0_does_not_have_date_trunc
    manager.stubs(
      phidippides: stub(fetch_dataset_metadata: { body: v0_dataset_metadata }),
      column_field_name: 'name',
      logical_datatype_name: 'logicalDatatype'
    )
    stub_feature_flags_with(:metadata_transition_phase, '0')
    columns = v0_dataset_metadata.fetch('columns')
    cards = v0_page_metadata.fetch('cards')
    soql = manager.send(:build_rollup_soql, v0_page_metadata, columns, cards)
    refute_match(/date_trunc/, soql)
  end

  def test_build_rollup_soql_has_date_trunc
    manager.stubs(
      dataset_metadata: { body: v1_dataset_metadata },
      column_field_name: 'fieldName',
      logical_datatype_name: 'fred'
    )
    stub_feature_flags_with(:metadata_transition_phase, '2')
    columns = v1_dataset_metadata.fetch('columns')
    cards = v1_page_metadata.fetch('cards')
    soql = manager.send(:build_rollup_soql, v1_page_metadata, columns, cards)
    assert_match(/date_trunc/, soql)
  end

  def test_raise_when_missing_default_date_trunc_function
    manager.stubs(
      phidippides: stub(fetch_dataset_metadata: { body: v1_dataset_metadata }),
      date_trunc_function: nil,
      column_field_name: 'fieldName',
      logical_datatype_name: 'fred'
)
    columns = v1_dataset_metadata.fetch('columns')
    cards = v1_page_metadata.fetch('cards')
    stub_feature_flags_with(:metadata_transition_phase, '2')

    assert_raises(Phidippides::NoDefaultDateTruncFunction) do
      manager.send(:build_rollup_soql, v1_page_metadata.except('defaultDateTruncFunction'), columns, cards)
    end
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

  def test_date_trunc_function_with_nil_days_returns_nil
    refute(manager.send(:date_trunc_function, nil), 'Expect nil when days nil')
  end

  def test_dataset_metadata
    Phidippides.any_instance.expects(:fetch_dataset_metadata).times(1).with('vtvh-wqgq', {}).then.returns(
      status: '200',
      body: v1_page_metadata
    )
    result = manager.send(:dataset_metadata, v1_page_metadata['datasetId'], {})
    assert_equal(result.fetch(:body), v1_page_metadata)
  end

  def test_largest_time_span_in_days_being_used_in_columns
    stub_feature_flags_with(:metadata_transition_phase, '3')
    manager.stubs(column_field_name: 'fieldName', logical_datatype_name: 'fred')
    fake_dataset_id = 'four-four'
    manager.unstub(:largest_time_span_in_days_being_used_in_columns)
    time_columns = v1_dataset_metadata.fetch('columns').select do |_, values|
      values['physicalDatatype'] == 'floating_timestamp'
    end
    assert(time_columns.any?, 'Expected time columns in dataset')
    manager.expects(:time_range_in_column).with(fake_dataset_id, 'time_column_large_granularity').returns(300)
    manager.expects(:time_range_in_column).with(fake_dataset_id, 'time_column_fine_granularity').returns(3)
    result = manager.send(:largest_time_span_in_days_being_used_in_columns, manager.send(:transformed_columns, time_columns), fake_dataset_id)
    assert_equal(300, result)
  end

  def test_largest_time_span_in_days_being_used_in_columns_equal
    stub_feature_flags_with(:metadata_transition_phase, '3')
    manager.stubs(column_field_name: 'fieldName', logical_datatype_name: 'fred')
    fake_dataset_id = 'four-four'
    manager.unstub(:largest_time_span_in_days_being_used_in_columns)
    time_columns = v1_dataset_metadata.fetch('columns').select do |_, values|
      values['physicalDatatype'] == 'floating_timestamp'
    end
    assert(time_columns.any?, 'Expected time columns in dataset')
    manager.expects(:time_range_in_column).with(fake_dataset_id, 'time_column_large_granularity').returns(300)
    manager.expects(:time_range_in_column).with(fake_dataset_id, 'time_column_fine_granularity').returns(300)
    result = manager.send(:largest_time_span_in_days_being_used_in_columns, manager.send(:transformed_columns, time_columns), fake_dataset_id)
    assert_equal(300, result)
  end

  def test_time_range_in_column_dates_equal
    manager.expects(:fetch_min_max_date_in_column).with('four-four', 'theFieldName').returns(
      'start' => '1987-08-15T00:00:00.000',
      'end' => '1987-08-15T00:00:00.000'
    )
    result = manager.send(:time_range_in_column, 'four-four', 'theFieldName')
    assert_equal(0, result)
  end

  def test_time_range_in_column_dates_reversed
    manager.expects(:fetch_min_max_date_in_column).with('four-four', 'theFieldName').returns(
      'start' => '1987-08-31T00:00:00.000',
      'end' => '1987-08-01T00:00:00.000'
    )
    result = manager.send(:time_range_in_column, 'four-four', 'theFieldName')
    assert_equal(30, result)
  end

  def test_time_range_in_column_pathologically_large_dates
    manager.expects(:fetch_min_max_date_in_column).with('four-four', 'theFieldName').returns(
      'start' => '1970-01-01T00:00:00.000',
      'end' => '9999-12-31T23:59:59.999'
    )
    result = manager.send(:time_range_in_column, 'four-four', 'theFieldName')
    assert_equal(2932896, result)
  end

  def test_fetch_min_max_date_in_column_calls_api
    fake_field_name = 'live-beef'
    fake_dataset_id = 'five-five'
    CoreServer::Base.connection.expects(:get_request).with do |args|
      assert_match(/min\(#{fake_field_name}\)%20AS%20start/i, args)
      assert_match(/max\(#{fake_field_name}\)%20AS%20end/i, args)
      assert_match(/^\/id\/#{fake_dataset_id}/i, args)
    end.returns('[]')
    manager.send(:fetch_min_max_date_in_column, fake_dataset_id, fake_field_name)
  end

  def test_fetch_min_max_date_in_column_returns_nil
    CoreServer::Base.connection.expects(:get_request).raises(CoreServer::Error)
    refute(manager.send(:fetch_min_max_date_in_column, 'dead-beef', 'human'), 'Expects nil when error')
  end

  def test_fetch_min_max_date_in_column_notifies_airbrake_on_error
    CoreServer::Base.connection.expects(:get_request).raises(CoreServer::Error)
    Airbrake.expects(:notify)
    manager.send(:fetch_min_max_date_in_column, 'dead-beef', 'human')
  end

  def test_update_date_trunc_function
    stub_feature_flags_with(:metadata_transition_phase, '3')
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

  private

  def manager
    @manager ||= PageMetadataManager.new
  end

  def v0_page_metadata
    JSON.parse(File.read("#{Rails.root}/test/fixtures/v0-page-metadata.json"))
  end

  def v1_page_metadata
    JSON.parse(File.read("#{Rails.root}/test/fixtures/v1-page-metadata.json"))
  end

  # We need this because some tests in metadata transition phase 1 match
  # cards in the page metadata to columns in the dataset metadata. The
  # cards in the v0 page metadata stub do not match the columns in the
  # v1 dataset metadata stub, so we provide a version of the stubbed v1
  # page metadata that has been 'backported' to the v0 page metadata format.
  def v1_page_metadata_as_v0
    v1_page_metadata_as_v0 = v0_page_metadata.deep_dup
    v1_page_metadata_as_v0['pageId'] = 'iuya-fxdq'
    v1_page_metadata_as_v0['datasetId'] = 'vtvh-wqgq'
    v1_page_metadata_as_v0['description'] = v1_dataset_metadata['description']
    v1_page_metadata_as_v0['cards'] = [
      {
        'description' => 'Test Card',
        'fieldName' => 'some_column',
        'cardSize' => 2,
        'cardType' => 'Column',
        'appliedFilters' => [],
        'expanded' => false
      },
      {
        'description' => 'Test Card',
        'fieldName' => 'some_other_column',
        'cardSize' => 2,
        'cardType' => 'Column',
        'appliedFilters' => [],
        'expanded' => false
      },
      {
        'description' => 'Test Card',
        'fieldName' => '*',
        'cardSize' => 3,
        'cardType' => 'Table',
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

end
