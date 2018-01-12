require 'rails_helper'

# This file is a port of the MiniTest file that was contemporaneous with the
# RSpec file for the same class, for some reason. It was deemed easier to have a
# second test file than to merge the two files into one.

describe View do
  include TestHelperMethods

  let(:view) { View.new(json_fixture('sample-data.json')) }

  before do
    init_current_domain
    init_feature_flag_signaller
  end

  it 'test_find_has_valid_custom_headers' do
    expect {
      View.find('test-data', 'Cookie' => { 'test_key' => 'random value' })
    }.to raise_error(ArgumentError)

    expect {
      View.find('test-data', 'Cookie' => 234234)
    }.to raise_error(ArgumentError)

    # The positive case for this test only disproves one type of error, which
    # RSpec cautions against. Preserving existing test implementation.

    RSpec::Expectations.configuration.on_potential_false_positives = :nothing

    expect {
      View.find('test-data', 'Cookie' => 'key1=value1;key2=value2')
    }.not_to raise_error(ArgumentError)

    RSpec::Expectations.configuration.on_potential_false_positives = :warn
  end

  it 'test_prefetch' do
    expect(view).to receive(:make_rows_request_using_soda1).and_return({
      'meta' => { 'totalRows' => 1, 'view' => { 'columns' => [] } },
      'data' => ['a single row']
    }).once
    view.prefetch(300)

    expect(view.sodacan).to receive(:get_rows).once
    expect(view).not_to receive(:make_rows_request_using_soda1)
    view.get_rows(1)
  end

  it 'test_multiple_queries_same_prefetched_data' do
    expect(view).to receive(:make_rows_request_using_soda1).and_return({
      'meta' => { 'totalRows' => 1, 'view' => { 'columns' => [] } },
      'data' => ['a single row']
    }).once
    view.prefetch(300)

    expect(view.sodacan).to receive(:get_rows).once
    expect(view).not_to receive(:make_rows_request_using_soda1)
    result = view.get_rows(2)
    expect(result).to be_truthy

    john_filter = {
      "filterCondition" => {
        "type" => "operator",
        "value" => "EQUALS",
        "children" => [
          { "type" => "literal", "value" => "John" },
          { "type" => "column", "columnFieldName" => "name" }
        ]
      }
    }
    sarah_filter = {
      "filterCondition" => {
        "type" => "operator",
        "value" => "EQUALS",
        "children" => [
          { "type" => "literal", "value" => "Sarah" },
          { "type" => "column", "columnFieldName" => "name" }
        ]
      }
    }

    expect(view.sodacan).to receive(:get_rows).once
    expect(view).not_to receive(:make_rows_request_using_soda1)
    allow(view.sodacan).to receive(:can_query?).and_return(true).once
    result = view.get_rows(2, 1, john_filter)
    expect(result).to be_truthy

    expect(view.sodacan).to receive(:get_rows).once
    expect(view).not_to receive(:make_rows_request_using_soda1)
    allow(view.sodacan).to receive(:can_query?).and_return(true).once
    result = view.get_rows(2, 1, sarah_filter)
    expect(result).to be_truthy
  end

  it 'test_find_in_store_does_not_raise_on_valid_store_ids' do
    allow_any_instance_of(CoreServer::Connection).to receive(:get_request).and_return({}.to_json)
    expect { View.find_in_store(1, 'pg.primus') }.not_to raise_error
    expect { View.find_in_store(1, 'pg2.primus') }.not_to raise_error
    expect { View.find_in_store(1, 'es.omega') }.not_to raise_error
    expect { View.find_in_store(1, 'es0.omega1') }.not_to raise_error
  end

  it 'test_find_in_store_raises_on_invalid_store_ids' do
    allow_any_instance_of(CoreServer::Connection).to receive(:get_request).and_return({}.to_json)
    expect { View.find_in_store(1, 'pg_primus') }.to raise_error(RuntimeError)
    expect { View.find_in_store(1, 'pg2-primus') }.to raise_error(RuntimeError)
    expect { View.find_in_store(1, 'es+omega') }.to raise_error(RuntimeError)
    expect { View.find_in_store(1, 'es0[omega1]') }.to raise_error(RuntimeError)
  end

  it 'test_has_mutation_rights' do
    test_view = View.new({ 'rights' => [ViewRights::WRITE, ViewRights::ADD, ViewRights::DELETE] })
    expect(test_view.mutation_rights?).to be(true)
    test_view = View.new({ 'rights' => [ViewRights::WRITE] })
    expect(test_view.mutation_rights?).to be(true)
    test_view = View.new({ 'rights' => [ViewRights::ADD, ViewRights::DELETE] })
    expect(test_view.mutation_rights?).to be(true)
    test_view = View.new({ 'rights' => [ViewRights::DELETE] })
    expect(test_view.mutation_rights?).to be(true)
    test_view = View.new({ 'rights' => [ViewRights::ADD] })
    expect(test_view.mutation_rights?).to be(true)
    test_view = View.new({ 'rights' => [] })
    expect(test_view.mutation_rights?).to be(false)
    test_view = View.new({ 'rights' => [ViewRights::READ] })
    expect(test_view.mutation_rights?).to be(false)
  end

  it 'test_rights_include' do
    test_view = View.new({ 'rights' => [ViewRights::WRITE, ViewRights::ADD, ViewRights::DELETE] })
    expect(test_view.rights_include?(ViewRights::ADD)).to be(true)
    expect(test_view.rights_include?(ViewRights::DELETE)).to be(true)
    expect(test_view.rights_include?(ViewRights::WRITE)).to be(true)
    expect(test_view.rights_include?(ViewRights::READ)).to be(false)
  end

  it 'test_modern_display_type_returns_match' do
    allow(view).to receive(:displayType).and_return('barchart')
    expect(view.modern_display_type).to eq('chart')
    allow(view).to receive(:displayType).and_return('geomap')
    expect(view.modern_display_type).to eq('map')
    allow(view).to receive(:displayType).and_return('otherchart')
    expect(view.modern_display_type).to eq('otherchart')
  end

  it 'test_user_granted' do
    user = double(User, id: 1)

    allow(view).to receive(:user_role).and_return(true)
    expect(view.user_granted?(user)).to be(true)

    allow(view).to receive(:user_role).and_return(false)
    expect(view.user_granted?(user)).to be(false)
  end

  it 'test_email_raises_with_empty_recipient' do
    expect { View.new.email(nil) }.to raise_error(ArgumentError)
    expect { View.new.email('') }.to raise_error(ArgumentError)
  end

  it 'test_is_official_returns_true_by_default_if_provenance_is_disabled_for_data_lenses' do
    stub_feature_flags_with(:enable_data_lens_provenance => false)
    allow(view).to receive(:data_lens?).and_return(true)
    expect(view.is_official?).not_to be_nil
  end

  it 'test_is_official_returns_false_by_default_if_provenance_is_enabled' do
    stub_feature_flags_with(:enable_data_lens_provenance => true)
    test_view = View.new
    expect(test_view.is_official?).to be(false)
  end

  it 'test_is_official_returns_true' do
    test_view = View.new('provenance' => 'OFFICIAL')
    expect(test_view.is_official?).to be(true)
  end

  it 'test_is_community_returns_false_by_default' do
    test_view = View.new
    expect(test_view.is_community?).to be(false)
  end

  it 'test_is_community_returns_true' do
    test_view = View.new('provenance' => 'COMMUNITY')
    expect(test_view.is_community?).to be(true)
  end

  it 'test_has_rights_returns_true' do
    test_view = View.new({ 'rights' => [ViewRights::READ, ViewRights::WRITE] })
    expect(test_view.has_rights?(ViewRights::READ)).to be(true)
    expect(test_view.has_rights?(ViewRights::WRITE)).to be(true)
    expect(test_view.has_rights?(ViewRights::READ, ViewRights::WRITE)).to be(true)
    expect(test_view.has_rights?([ViewRights::READ, ViewRights::WRITE])).to be(true)
    expect(test_view.has_rights?(ViewRights::DELETE, ViewRights::GRANT)).to be(false)
    expect(test_view.has_rights?([ViewRights::DELETE, ViewRights::GRANT])).to be(false)
  end

  it 'test_dataset_predicate_method' do
    allow(view).to receive(:is_blist?).and_return(true)
    expect(view.dataset?).to be(true)
    allow(view).to receive(:is_api?).and_return(true)
    expect(view.dataset?).to be(false)
  end

  it 'test_can_see_private_meta' do
    test_view = View.new({ 'rights' => [ViewRights::READ, ViewRights::WRITE] })
    expect(test_view.can_see_private_meta?).to be(false)
    test_view = View.new({ 'rights' => [ViewRights::READ, ViewRights::WRITE, ViewRights::UPDATE_VIEW] })
    expect(test_view.can_see_private_meta?).to be(true)
  end

  it 'test_merged_metadata' do
    allow(view).to receive(:can_see_private_meta?).and_return(true) # Signed user.
    expect(view.merged_metadata.dig('custom_fields', 'fieldset_foo', 'field_baz')).to eq('some private custom metadata')
    expect(view.merged_metadata.dig('custom_fields', 'fieldset_foo', 'field_bar')).to eq('some public custom metadata')

    allow(view).to receive(:can_see_private_meta?).and_return(false) # Unsigned user.
    expect(view.merged_metadata.dig('custom_fields', 'fieldset_foo', 'field_baz')).to be_nil
    expect(view.merged_metadata.dig('custom_fields', 'fieldset_foo', 'field_bar')).to eq('some public custom metadata')
  end

  it 'test_migrations' do
    # This is hitting core for migration info, which is at /migrations. Not /api/migrations
    allow_any_instance_of(CoreServer::Connection).to receive(:get_request).
      with('/migrations/test-data').
      and_return({migrations: "data"}.to_json)
    expect(view.migrations).to eq({ 'migrations' => 'data' })
  end

  it 'test_row_count' do
    allow_any_instance_of(CoreServer::Connection).to receive(:get_request).
      with('/id/test-data?%24query=select+count%28%2A%29+as+COLUMN_ALIAS_GUARD__count').
      and_return('[{"COLUMN_ALIAS_GUARD__count": 123}]')

    allow(view).to receive(:new_backend?).and_return(false)
    expect(view).to receive(:get_total_rows).and_return('123').once
    expect(view.row_count).to eq(123)

    allow(view).to receive(:new_backend?).and_return(true)
    expect(view).not_to receive(:get_total_rows)
    expect(view.row_count).to eq(123)
  end

  it 'test_find_related' do
    test_view = View.new('tableId' => 1234)

    allow_any_instance_of(CoreServer::Connection).to receive(:get_request).
      with('/views.json?count=10&method=getByTableId&page=1&sortBy=most_accessed&tableId=1234').
      and_return('[{"id" : "test-data", "name" : "Wombats in Space"}]')

    expect(test_view.find_related(1).first.name).to eq('Wombats in Space')
  end

  it 'test_find_dataset_landing_page_related_content' do
    obe_view = View.new('id' => 'abcd-abcd', 'tableId' => 123)
    nbe_view = View.new('id' => 'efgh-efgh', 'tableId' => 456)

    obe_endpoint = '/views.json?count=&method=getByTableId&page=&sortBy=most_accessed&tableId=123'
    nbe_endpoint = '/views.json?count=&method=getByTableId&page=&sortBy=most_accessed&tableId=456'

    test_view = View.new('id' => 'abcd-abcd')

    # NBE && OBE
    allow(test_view).to receive(:nbe_view).and_return(nbe_view)
    allow(test_view).to receive(:obe_view).and_return(obe_view)

    allow_any_instance_of(CoreServer::Connection).to receive(:get_request).
      with(obe_endpoint).
      and_return('[{"id" : "abcd-abcd", "name" : "Requesting View"}, {"id" : "abcd-1234", "name" : "Related OBE View"}]')
    allow_any_instance_of(CoreServer::Connection).to receive(:get_request).
      with(nbe_endpoint).
      and_return('[{"id" : "efgh-efgh", "name" : "Requesting View"}, {"id" : "abcd-1234", "name" : "Related Data Lens", "displayType": "data_lens"}]')

    expect(test_view.find_dataset_landing_page_related_content.map(&:name)).to eq(['Related Data Lens', 'Related OBE View'])

    # Only OBE
    allow(test_view).to receive(:nbe_view).and_return(nil)
    allow(test_view).to receive(:obe_view).and_return(obe_view)

    expect(test_view.find_dataset_landing_page_related_content.map(&:name)).to eq(['Related OBE View'])

    # Only NBE
    allow(test_view).to receive(:nbe_view).and_return(nbe_view)
    allow(test_view).to receive(:obe_view).and_return(nil)

    expect(test_view.find_dataset_landing_page_related_content.map(&:name)).to eq(['Related Data Lens'])

    # Neither NBE nor OBE (just in case)
    allow(test_view).to receive(:nbe_view).and_return(nil)
    allow(test_view).to receive(:obe_view).and_return(nil)

    expect(test_view.find_dataset_landing_page_related_content.map(&:name)).to eq([])
  end

  it 'test_classic_visualization?' do
    allow(view).to receive(:classic_chart?).and_return(true)
    allow(view).to receive(:classic_map?).and_return(true)
    expect(view.classic_visualization?).to be(true)

    allow(view).to receive(:classic_chart?).and_return(false)
    allow(view).to receive(:classic_map?).and_return(true)
    expect(view.classic_visualization?).to be(true)

    allow(view).to receive(:classic_chart?).and_return(true)
    allow(view).to receive(:classic_map?).and_return(false)
    expect(view.classic_visualization?).to be(true)

    allow(view).to receive(:classic_chart?).and_return(false)
    allow(view).to receive(:classic_map?).and_return(false)
    expect(view.classic_visualization?).to be(false)
  end

  it 'test_classic_chart?' do
    allow(view).to receive(:is_tabular?).and_return(true)
    allow(view).to receive(:displayType).and_return('chart')
    expect(view.classic_chart?).to be(true)

    allow(view).to receive(:is_tabular?).and_return(false)
    allow(view).to receive(:displayType).and_return('chart')
    expect(view.classic_chart?).to be(false)

    allow(view).to receive(:is_tabular?).and_return(true)
    allow(view).to receive(:displayType).and_return('notchart')
    expect(view.classic_chart?).to be(false)

    allow(view).to receive(:is_tabular?).and_return(false)
    allow(view).to receive(:displayType).and_return('notchart')
    expect(view.classic_chart?).to be(false)
  end

  it 'test_classic_map?' do
    allow(view).to receive(:is_tabular?).and_return(true)
    allow(view).to receive(:displayType).and_return('map')
    expect(view.classic_map?).to be(true)

    allow(view).to receive(:is_tabular?).and_return(false)
    allow(view).to receive(:displayType).and_return('map')
    expect(view.classic_map?).to be(false)

    allow(view).to receive(:is_tabular?).and_return(true)
    allow(view).to receive(:displayType).and_return('notmap')
    expect(view.classic_map?).to be(false)

    allow(view).to receive(:is_tabular?).and_return(false)
    allow(view).to receive(:displayType).and_return('notmap')
    expect(view.classic_map?).to be(false)
  end

  it 'test_display_format_columns' do
    test_view = View.new(
      'viewType' => 'tabular',
      'displayType' => 'data_lens_chart',
      'displayFormat' => {
        'valueColumns' => ['fieldName' => '1'],
        'fixedColumns' => ['2'],
        'seriesColumns' => ['fieldName' => '3']
      }
    )

    expect(test_view.display_format_columns).to eq(['1', '2', '3'])

    test_view = View.new(
      'viewType' => 'tabular',
      'displayType' => 'data_lens_chart',
      'displayFormat' => {
        'valueColumns' => ['fieldName' => '1'],
        'fixedColumns' => ['2'],
        'seriesColumns' => ['fieldName' => '2']
      }
    )

    expect(test_view.display_format_columns).to eq(['1', '2'])

    test_view = View.new(
      'viewType' => 'tabular',
      'displayType' => 'data_lens_chart',
      'displayFormat' => {
        'valueColumns' => nil,
        'fixedColumns' => nil,
        'seriesColumns' => nil
      }
    )

    expect(test_view.display_format_columns).to eq([])

    test_view = View.new(json_fixture('classic-map-with-multiple-layers.json'))

    expect(test_view.display_format_columns).to eq(['location_1', 'location_2'])
  end

  it 'test_to_visualization_embed_blob' do
    json = {
      'id' => 'sooo-oldd',
      'name' => 'SOOO OLD!',
      'description' => 'get off my lawn',
      'viewType' => 'tabular',
      'displayType' => 'chart',
      'displayFormat' => {
        'chartType' => 'someChartType'
      },
      'metadata' => {
        'renderTypeConfig' => {
          'visible' => {
            'table' => true,
            'chart' => true
          }
        }
      }
    }
    # this is needed because of the re-parse inside the method under test
    allow_any_instance_of(View).to receive(:display_format_columns).and_return([ 'source_col_1', 'source_col_2' ])

    test_view = View.new(json)
    allow(test_view).to receive(:fetch_json).and_return(json)

    expected_json = json.merge(
      'metadata' => {
        'renderTypeConfig' => {
          'visible' => {
            'table' => false,
            'chart' => true
          }
        }
      }
    )

    expect(test_view.to_visualization_embed_blob).to eq({
      :originalUid => 'sooo-oldd',
      :title => 'SOOO OLD!',
      :description => 'get off my lawn',
      :data => expected_json,
      :format => 'classic',
      :type => 'someChartType',
      :columns => [ 'source_col_1', 'source_col_2' ],
    })
  end

  it 'test_is_multi_layered?' do
    allow_any_instance_of(View).to receive(:is_geospatial?).and_return(true)

    view_without_keys = View.new
    expect(view_without_keys.is_multi_layered?).to be(false)

    json = {'metadata' => {'geo' => {'layers' => '4444-4444'}}}
    view_with_single_layer = View.new(json)
    expect(view_with_single_layer.is_multi_layered?).to be(false)

    json = {'metadata' => {'geo' => {'layers' => '4444-4444,5555-5555'}}}
    view_with_multiple_layers = View.new(json)
    expect(view_with_multiple_layers.is_multi_layered?).to be(true)

    json = {'displayFormat' => {'viewDefinitions' => [{'uid' => 'self'}]}}
    derived_view_from_single_dataset = View.new(json)
    expect(derived_view_from_single_dataset.is_multi_layered?).to be(false)

    json = {'displayFormat' => {'viewDefinitions' =>
       [ {'uid' => 'self'}, {'uid' => '4444-4444'} ]}}
    derived_view_from_multiple_datasets = View.new(json)
    expect(derived_view_from_multiple_datasets.is_multi_layered?).to be(true)
  end

  it 'test_is_api_geospatial' do
    # when the view has not yet been saved
    test_view = View.new(
      'displayType' => nil,
      'viewType' => 'tabular',
      'columns' => [Hashie::Mash.new({ 'dataTypeName' => 'point' })]
    )
    allow(test_view).to receive(:new_backend?).and_return(true)
    allow(test_view).to receive(:obe_view).and_return(nil)
    allow(test_view).to receive(:migrations).and_return({})
    allow(test_view).to receive(:merged_metadata).and_return({ 'custom_fields' => { 'Geospatial API Pre-release' => { 'Enabled' => 'true' } } })
    expect(test_view.is_api_geospatial?).to be(true)

    # when the view has been saved
    test_view = View.new(
      'displayType' => 'map',
      'viewType' => 'tabular',
      'columns' => [Hashie::Mash.new({ 'dataTypeName' => 'point' })]
    )
    allow(test_view).to receive(:new_backend?).and_return(true)
    allow(test_view).to receive(:obe_view).and_return(nil)
    allow(test_view).to receive(:migrations).and_return({})
    allow(test_view).to receive(:merged_metadata).and_return({ 'custom_fields' => { 'Geospatial API Pre-release' => { 'Enabled' => 'true' } } })
    expect(test_view.is_api_geospatial?).to be(true)
  end

  it 'test_geospatial_child_layers' do
    allow(View).to receive(:find_multiple).and_return(['giraffes'])

    test_view = View.new('id' => '1234-1234', 'metadata' => {'geo' => {}})
    allow(test_view).to receive(:is_geospatial?).and_return(true)
    expect(test_view.geospatial_child_layers).to eq([])

    test_view = View.new('id' => '1234-1234', 'metadata' => {'geo' => {'layers' => '4444-4444'}})
    allow(test_view).to receive(:is_geospatial?).and_return(true)
    expect(test_view.geospatial_child_layers).to eq(['giraffes'])

    test_view = View.new('id' => '1234-1234', 'metadata' => {'geo' => {'layers' => '4444-4444'}})
    allow(test_view).to receive(:is_geospatial?).and_return(false)
    expect(test_view.geospatial_child_layers).to eq([])
  end

  it 'test_api_foundry_url' do
    allow(CurrentDomain).to receive(:cname).and_return('giraffes')

    allow(view).to receive(:preferred_id).and_return('test-data')
    expect(view.api_foundry_url).to eq('https://dev.socrata.com/foundry/giraffes/test-data')

    test_view = View.new(json_fixture('sample-data.json').merge(domainCName: 'wombats'))
    allow(test_view).to receive(:preferred_id).and_return('test-data')
    allow(test_view).to receive(:federated?).and_return(true)
    expect(test_view.api_foundry_url).to eq('https://dev.socrata.com/foundry/wombats/test-data')
  end

  it 'test_canonical_domain_name' do
    allow(CurrentDomain).to receive(:cname).and_return('giraffes')

    allow(view).to receive(:federated?).and_return(false)
    expect(view.canonical_domain_name).to eq('giraffes')

    test_view = View.new(json_fixture('sample-data.json').merge(domainCName: 'wombats'))
    allow(test_view).to receive(:federated?).and_return(true)
    expect(test_view.canonical_domain_name).to eq('wombats')
  end

  it 'test_resource_url_uses_proper_scheme' do
    allow(view).to receive(:preferred_id).and_return('test-data')

    expect(view.resource_url).to eq('https://localhost/resource/test-data.json')

    req = double(Net::HTTPRequest, scheme: 'https')
    expect(view.resource_url(req)).to eq('https://localhost/resource/test-data.json')

    req = double(Net::HTTPRequest, scheme: 'http')
    expect(view.resource_url(req)).to eq('http://localhost/resource/test-data.json')
  end

  it 'test_odata_url_uses_proper_scheme' do
    expect(view.odata_url).to eq('https://localhost/OData.svc/test-data')

    req = double(Net::HTTPRequest, scheme: 'https')
    expect(view.odata_url(req)).to eq('https://localhost/OData.svc/test-data')

    req = double(Net::HTTPRequest, scheme: 'http')
    expect(view.odata_url(req)).to eq('http://localhost/OData.svc/test-data')
  end

  # EN-5634: Don't prefer NBE id for OData endpoint as it truncates rows
  it 'test_odata_url_does_not_use_nbe_id' do
    allow(view).to receive(:migrations).and_return({ obeId: 'test-data', nbeId: 'abcd-abcd' })
    allow(view).to receive(:new_backend?).and_return(true)
    expect(view.odata_url).to eq('https://localhost/OData.svc/test-data')
  end

end
