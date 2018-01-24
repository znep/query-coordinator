require 'rails_helper'

describe PageMetadataManager do
  include TestHelperMethods

  before do
    init_current_domain

    allow_any_instance_of(DataLensManager).to receive(:create).and_return('niew-veww')
    allow_any_instance_of(DataLensManager).to receive(:update).and_return(nil)
    allow_any_instance_of(SodaFountain).to receive(:connection_details).and_return({
      'address' => 'localhost',
      'port' => '6010'
    })

    allow(View).to receive(:find).and_return(double(
      :category => 'obe_test_category',
      :migrations => stub_migrations
    ))
    @dataset_copy_stub = stub_dataset_copy_request('thw2-8btq')
  end

  it 'test_show_succeeds_when_migration_happens_without_update_rights' do
    core_stub = double
    allow(core_stub).to receive(:get_request) do |url|
      expect(url).to eq('/views/four-four.json')
      v2_page_metadata.to_json
    end
    allow_any_instance_of(PageMetadataManager).to receive(:fetch_dataset_columns).and_return(v1_dataset_metadata[:columns])
    allow(CoreServer::Base).to receive(:connection).and_return(core_stub)

    manager.show('four-four', options)
  end

  xit 'test_create_ignores_provided_pageId_with_v2_page_metadata' do
    allow_any_instance_of(PageMetadataManager).to receive(:fetch_min_max_in_column).and_return(
      'min' => '1987-08-15T00:00:00.000',
      'max' => '1987-08-15T00:00:00.000'
    )
    allow_any_instance_of(PageMetadataManager).to receive(:update_rollup_table)
    expect_any_instance_of(PageMetadataManager).not_to receive(:request_soda_fountain_secondary_index)
    allow_any_instance_of(PageMetadataManager).to receive(:fetch_dataset_metadata).and_return(v1_dataset_metadata_without_rollup_columns.with_indifferent_access)
    allow_any_instance_of(DataLensManager).to receive(:create) do |category, metadata|
      expect(metadata['name']).to eq(data_lens_page_metadata['name'])
      expect(metadata['description']).to eq(data_lens_page_metadata['description'])
      'data-lens'
    end
    allow_any_instance_of(DataLensManager).to receive(:fetch).and_return({ 'rights' => %(read write) })
    result = manager.create(data_lens_page_metadata, options)
    expect(result.fetch(:body).fetch('pageId')).to eq('data-lens')
  end

  it 'test_create_does_not_create_rollups_or_secondary_indices_for_derived_views' do
    expect_any_instance_of(PageMetadataManager).not_to receive(:update_metadata_rollup_table)
    expect_any_instance_of(PageMetadataManager).not_to receive(:request_soda_fountain_secondary_index)

    manager.create(data_lens_from_derived_view_page_metadata)
  end

  it 'test_update_raises_an_error_if_dataset_id_is_not_present_in_page_metadata' do
    expect_any_instance_of(PageMetadataManager).not_to receive(:update_rollup_table)

    expect { manager.update(data_lens_page_metadata.except('datasetId')) }.to raise_error(PageMetadataManager::NoDatasetIdException)
  end

  it 'test_update_raises_an_error_if_page_id_is_not_present_in_page_metadata' do
    expect_any_instance_of(PageMetadataManager).not_to receive(:update_rollup_table)

    expect { manager.update(data_lens_page_metadata.except('pageId')) }.to raise_error(PageMetadataManager::NoPageIdException)
  end

  it 'test_update_v2_page_metadata_success' do
    allow_any_instance_of(DataLensManager).to receive(:fetch).and_return(v2_page_metadata)
    allow_any_instance_of(PageMetadataManager).to receive(:update_metadata_rollup_table).and_return(nil)
    core_stub = double
    allow(core_stub).to receive(:update_request) do |url, payload|
      expect(url).to eq('/views/mjcb-9cxc.json')
      expect(payload).to match(/"name":"My new page"/)
      expect(payload).to match(/"description":"My page has a fun description"/)
      expect(payload).to match(/"pageId":"mjcb-9cxc"/)
    end
    allow(CoreServer::Base).to receive(:connection).and_return(core_stub)

    manager.update(data_lens_page_metadata)
  end

  it 'test_update_does_not_create_rollups_for_derived_views' do
    allow_any_instance_of(DataLensManager).to receive(:fetch).and_return(v2_page_metadata)
    allow_any_instance_of(DataLensManager).to receive(:update).and_return(nil)
    expect_any_instance_of(PageMetadataManager).not_to receive(:update_metadata_rollup_table)
    stub_request(:put, 'http://localhost:8080/views/mjcb-9cxc.json')

    manager.update(data_lens_from_derived_view_page_metadata)
  end

  xit 'test_delete_deletes_core_and_rollup_representation' do
    allow_any_instance_of(DataLensManager).to receive(:fetch).and_return(v2_page_metadata)

    core_stub = double
    allow(core_stub).to receive(:delete_request) do |url|
      expect(url).to eq('/views.json?id=four-four&method=delete')
      '{ "body": null, "status": "200" }'
    end
    allow(CoreServer::Base).to receive(:connection).and_return(core_stub)

    allow_any_instance_of(SodaFountain).to receive(:delete_rollup_table) do |args|
      expect(args).to eq({dataset_id: 'thw2-8btq', identifier: 'four-four'})
      { status: '200' }
    end

    result = manager.delete('four-four')
    expect(result[:status]).to eq('200')
  end

  it 'test_delete_does_not_delete_rollup_representation_if_from_derived_view' do
    test_page_metadata = v2_page_metadata
    test_page_metadata['displayFormat']['data_lens_page_metadata'] = data_lens_from_derived_view_page_metadata
    allow_any_instance_of(DataLensManager).to receive(:fetch).and_return(test_page_metadata)
    allow(View).to receive(:delete).and_return(nil)
    expect_any_instance_of(SodaFountain).not_to receive(:delete_rollup_table)

    manager.delete('four-four')
  end

  it 'test_time_range_in_column_catches_fetch_min_max_in_column_returning_nil' do
    allow(CoreServer::Base.connection).to receive(:get_request).and_raise(CoreServer::Error.new(nil))
    expect { manager.send(:time_range_in_column, 'four-four', 'fieldName') }.to raise_error(PageMetadataManager::NoMinMaxInColumnException)
  end

  it 'test_date_trunc_function_for_time_range_with_decades_of_days' do
    expect('date_trunc_y').to eq(manager.send(:date_trunc_function_for_time_range, (40 * 365.25).to_i))
  end

  it 'test_date_trunc_function_for_time_range_with_exactly_20_years_of_days' do
    expect('date_trunc_ym').to eq(manager.send(:date_trunc_function_for_time_range, (20 * 365.25).to_i))
  end

  it 'test_date_trunc_function_for_time_range_with_more_than_year_of_days_less_than_20' do
    expect('date_trunc_ym').to eq(manager.send(:date_trunc_function_for_time_range, (15 * 365.25).to_i))
  end

  it 'test_date_trunc_function_for_time_range_with_between_1_and_2_years_of_days' do
    expect('date_trunc_ym').to eq(manager.send(:date_trunc_function_for_time_range, 517))
  end

  it 'test_date_trunc_function_for_time_range_with_exactly_1_year_of_days' do
    expect('date_trunc_ymd').to eq(manager.send(:date_trunc_function_for_time_range, (1 * 365.25).to_i))
  end

  it 'test_date_trunc_function_for_time_range_with_less_than_a_year_of_days' do
    expect('date_trunc_ymd').to eq(manager.send(:date_trunc_function_for_time_range, 20))
  end

  it 'test_date_trunc_function_for_time_range_with_nil_days_returns_year_aggregation' do
    expect('date_trunc_y').to eq(manager.send(:date_trunc_function_for_time_range, nil))
  end

  it 'test_date_trunc_function_for_time_range_with_0_days_returns_year_aggregation' do
    expect('date_trunc_y').to eq(manager.send(:date_trunc_function_for_time_range, 0))
  end

  it 'test_time_range_in_column_dates_equal' do
    allow(manager).to receive(:fetch_min_max_in_column).with('four-four', 'theFieldName').and_return(
      'min' => '1987-08-15T00:00:00.000',
      'max' => '1987-08-15T00:00:00.000'
    )
    result = manager.send(:time_range_in_column, 'four-four', 'theFieldName')
    expect(0).to eq(result)
  end

  it 'test_time_range_in_column_dates_reversed' do
    allow(manager).to receive(:fetch_min_max_in_column).with('four-four', 'theFieldName').and_return(
      'min' => '1987-08-31T00:00:00.000',
      'max' => '1987-08-01T00:00:00.000'
    )
    result = manager.send(:time_range_in_column, 'four-four', 'theFieldName')
    expect(30).to eq(result)
  end

  it 'test_time_range_in_column_pathologically_large_dates' do
    allow(manager).to receive(:fetch_min_max_in_column).with('four-four', 'theFieldName').and_return(
      'min' => '1970-01-01T00:00:00.000',
      'max' => '9999-12-31T23:59:59.999'
    )
    result = manager.send(:time_range_in_column, 'four-four', 'theFieldName')
    expect(2932896).to eq(result)
  end

  it 'test_time_range_in_column_raises_exception_without_min_max' do
    allow(manager).to receive(:fetch_min_max_in_column).with('four-four', 'theFieldName').and_return({})
    expect { manager.send(:time_range_in_column, 'four-four', 'theFieldName') }.to raise_error(PageMetadataManager::NoMinMaxInColumnException)
  end

  it 'test_time_range_in_column_raises_exception_without_min' do
    allow(manager).to receive(:fetch_min_max_in_column).with('four-four', 'theFieldName').and_return(
      'max' => '1984-01-01T00:00:00.000'
    )
    expect { manager.send(:time_range_in_column, 'four-four', 'theFieldName') }.to raise_error(PageMetadataManager::NoMinMaxInColumnException)
  end

  it 'test_time_range_in_column_raises_exception_without_max' do
    allow(manager).to receive(:fetch_min_max_in_column).with('four-four', 'theFieldName').and_return(
      'min' => '1984-01-01T00:00:00.000'
    )
    expect { manager.send(:time_range_in_column, 'four-four', 'theFieldName') }.to raise_error(PageMetadataManager::NoMinMaxInColumnException)
  end

  it 'test_fetch_min_max_in_column_calls_api' do
    fake_field_name = 'live-beef'
    fake_dataset_id = 'five-five'
    allow(CoreServer::Base.connection).to receive(:get_request) do |args|
      expect(args).to match(/min\(#{fake_field_name}\)%20AS%20min/i)
      expect(args).to match(/max\(#{fake_field_name}\)%20AS%20max/i)
      expect(args).to match(/^\/id\/#{fake_dataset_id}/i)
      '[]'
    end
    manager.send(:fetch_min_max_in_column, fake_dataset_id, fake_field_name)
  end

  it 'test_fetch_min_max_in_column_returns_nil' do
    allow(CoreServer::Base.connection).to receive(:get_request).and_raise(CoreServer::Error)
    expect(manager.send(:fetch_min_max_in_column, 'dead-beef', 'human')).to be_falsy
  end

  it 'test_fetch_min_max_in_column_notifies_airbrake_on_error' do
    allow(CoreServer::Base.connection).to receive(:get_request).and_raise(CoreServer::Error)
    allow(Airbrake).to receive(:notify)
    manager.send(:fetch_min_max_in_column, 'dead-beef', 'human')
  end

  it 'test_no_dataset_copy_when_feature_flag_not_set' do
    previous_secondary_group_identifier = APP_CONFIG.secondary_group_identifier
    begin
      APP_CONFIG.secondary_group_identifier = false

      allow(manager).to receive(:fetch_min_max_in_column).and_return({
        'min' => '1987-08-15T00:00:00.000',
        'max' => '1987-08-15T00:00:00.000'
      })
      allow(manager).to receive(:fetch_dataset_metadata).and_return(v1_dataset_metadata.with_indifferent_access)

      allow_any_instance_of(DataLensManager).to receive(fetch: { 'rights' => %(read write) })

      allow_any_instance_of(PageMetadataManager).to receive(:update_rollup_table)

      allow_any_instance_of(DataLensManager).to receive(:create).and_return('data-lens')
      manager.create(data_lens_page_metadata, options)
      assert_not_requested @dataset_copy_stub
    rescue
      APP_CONFIG.secondary_group_identifier = previous_secondary_group_identifier
    end
  end

  it 'test_no_dataset_copy_when_feature_flag_is_blank' do
    previous_secondary_group_identifier = APP_CONFIG.secondary_group_identifier
    begin
      APP_CONFIG.secondary_group_identifier = ''

      allow(manager).to receive(:fetch_min_max_in_column).and_return({
        'min' => '1987-08-15T00:00:00.000',
        'max' => '1987-08-15T00:00:00.000'
      })
      allow(manager).to receive(:fetch_dataset_metadata).and_return(v1_dataset_metadata.with_indifferent_access)

      allow_any_instance_of(DataLensManager).to receive(fetch: { 'rights' => %(read write) })

      allow_any_instance_of(PageMetadataManager).to receive(:update_rollup_table)

      allow_any_instance_of(DataLensManager).to receive(:create).and_return('data-lens')
      manager.create(data_lens_page_metadata, options)
      assert_not_requested @dataset_copy_stub
    rescue
      APP_CONFIG.secondary_group_identifier = previous_secondary_group_identifier
    end
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
    json_fixture('v2-page-metadata.json')
  end

  def data_lens_page_metadata
    v2_page_metadata['displayFormat']['data_lens_page_metadata']
  end

  def data_lens_from_derived_view_page_metadata
    data_lens_page_metadata.merge({ 'isFromDerivedView' => true })
  end

  def v1_dataset_metadata
    json_fixture('v1-dataset-metadata.json')
  end

  def v1_dataset_metadata_without_rollup_columns
    json_fixture("v1-dataset-metadata-without-rollup-columns.json")
  end

  def core_permissions_public
    json_fixture("core-permissions-public.json")
  end

  def core_permissions_private
    json_fixture("core-permissions-private.json")
  end

  def remove_table_card(page_metadata)
    page_metadata.dup.tap do |metadata|
      metadata['cards'].select! { |card| card['fieldName'] != '*' }
    end
  end

  def page_metadata_with_no_cards(page_metadata)
    page_metadata.dup.tap { |metadata| metadata['cards'] = [] }
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
