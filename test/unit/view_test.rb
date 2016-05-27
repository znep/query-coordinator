require 'test_helper'

class ViewTest < Test::Unit::TestCase

  def test_find_has_valid_custom_headers
    load_sample_data('test/fixtures/sample-data.json')
    invalid_cookies_1 = {
      'test_key' => 'random value'
    }
    assert_raise ArgumentError do
      view = View.find('does-not-matter', 'Cookie' => invalid_cookies_1)
    end

    invalid_cookies_2 = 234234
    assert_raise ArgumentError do
      view = View.find('does-not-matter', 'Cookie' => invalid_cookies_2)
    end

    valid_cookies = 'key1=value1;key2=value2'
    assert_nothing_raised do
      view = View.find('does-not-matter', 'Cookie' => valid_cookies)
    end
  end

  def test_prefetch
    load_sample_data("test/fixtures/sample-data.json")
    view = View.find("does-not-matter")
    view.prefetch(300)
    assert view.get_rows(1)
    can = view.sodacan
    assert can.metrics["cache_size"] == 2
    assert can.metrics["num_results"] == 1
    assert can.metrics["num_calls"] == 1
  end

  def test_multiple_queries_same_prefetched_data
    init_current_domain
    load_sample_data("test/fixtures/sample-data.json")
    view = View.find("does-not-matter")
    view.prefetch(300)
    all = view.get_rows(2)
    assert all
    can = view.sodacan
    assert can.metrics["cache_size"] == 2
    assert can.metrics["num_results"] == 2
    assert can.metrics["num_calls"] == 1
    john_filter = JSON::parse('{ "filterCondition": { "type" : "operator", "value" : "EQUALS",
                                    "children" : [
                                    { "type": "literal","value": "John"},
                                    { "type" : "column", "columnFieldName" : "name"}]}}')
    sarah_filter = JSON::parse('{ "filterCondition": { "type" : "operator", "value" : "EQUALS",
                                    "children" : [
                                    { "type": "literal","value": "Sarah"},
                                    { "type" : "column", "columnFieldName" : "name"}]}}')
    johns = view.get_rows(1, 1, john_filter)
    assert johns
    can = view.sodacan
    assert can.metrics["num_calls"] == 2
    assert can.metrics["num_results"] == 3, "Unexpected result, got #{johns} because #{can.hints}"
    sarahs = view.get_rows(1, 1, sarah_filter)
    assert sarahs
    can = view.sodacan
    assert can.metrics["num_results"] == 4
    assert can.metrics["num_calls"] == 3
  end

  def test_find_in_store_does_not_raise_on_valid_store_ids
    stub_core_server_connection
    assert_nothing_raised { View.find_in_store(1, 'pg.primus') }
    assert_nothing_raised { View.find_in_store(1, 'es.omega') }
    assert_nothing_raised { View.find_in_store(1, 'pg2.primus') }
    assert_nothing_raised { View.find_in_store(1, 'es0.omega1') }
  end

  def test_find_in_store_raises_on_invalid_store_ids
    stub_core_server_connection
    assert_raises(RuntimeError) { View.find_in_store(1, 'pg_primus') }
    assert_raises(RuntimeError) { View.find_in_store(1, 'es+omega') }
    assert_raises(RuntimeError) { View.find_in_store(1, 'pg2-primus') }
    assert_raises(RuntimeError) { View.find_in_store(1, 'es0[omega1]') }
  end

  def test_has_mutation_rights_returns_true
    stub_core_server_connection
    View.any_instance.stubs(:data => {'rights' => %w(write add delete)})
    assert View.new.mutation_rights?, 'Should have mutation rights'
    View.any_instance.stubs(:data => {'rights' => %w(write)})
    assert View.new.mutation_rights?, 'Should have mutation rights'
    View.any_instance.stubs(:data => {'rights' => %w(add delete)})
    assert View.new.mutation_rights?, 'Should have mutation rights'
    View.any_instance.stubs(:data => {'rights' => %w(delete)})
    assert View.new.mutation_rights?, 'Should have mutation rights'
    View.any_instance.stubs(:data => {'rights' => %w(add)})
    assert View.new.mutation_rights?, 'Should have mutation rights'
  end

  def test_rights_include_returns_true
    stub_core_server_connection
    View.any_instance.stubs(:data => {'rights' => %w(add delete write)})
    view = View.new
    assert view.rights_include?(ViewRights::ADD), 'Should return true when rights include "add"'
    assert view.rights_include?(ViewRights::DELETE), 'Should return true when rights include "delete"'
    assert view.rights_include?(ViewRights::WRITE), 'Should return true when rights include "write"'
    refute view.rights_include?('nonce'), 'Should return false when non-matching right requested'
  end

  def test_rights_include_returns_false
    stub_core_server_connection
    View.any_instance.stubs(:data => nil)
    refute View.new.rights_include?('nonce'), 'Should return false when non-matching right requested'
    View.any_instance.stubs(:data => {})
    view = View.new
    refute view.rights_include?('nonce'), 'Should return false when non-matching right requested'
    refute view.rights_include?(ViewRights::ADD), 'Should return false when non-matching right requested'
    refute view.rights_include?(ViewRights::DELETE), 'Should return false when non-matching right requested'
    refute view.rights_include?(ViewRights::WRITE), 'Should return false when non-matching right requested'
  end

  def test_has_mutation_rights_returns_false
    stub_core_server_connection
    View.any_instance.stubs(:data => { 'rights' => [] })
    refute View.new.mutation_rights?, 'Should not have mutation rights'
  end

  def test_can_edit_is_false_if_new_backend_is_true
    stub_core_server_connection
    View.any_instance.stubs(:new_backend? => true)
    refute View.new.can_edit?, 'Should not be able to edit if newBackend is true'
  end

  def test_can_edit_is_true_if_new_backend_is_false
    stub_core_server_connection
    View.any_instance.stubs(:new_backend? => false, :is_grouped => false, :is_api => false, :mutation_rights? => true)
    assert View.new.can_edit?, 'Should be able to edit if newBackend is false'
  end

  def test_can_add_returns_true_if_new_backend_is_false
    stub_core_server_connection
    mock_data = mock.tap { |mock| mock.stubs(:[]).with('rights').returns(ViewRights::ADD) }
    View.any_instance.stubs(:data => mock_data, :new_backend? => false, :rights_include? => true)
    assert View.new.can_add?, 'Should be able to add if newBackend is false'
  end

  def test_can_add_returns_true_if_new_backend_is_true
    stub_core_server_connection
    mock_data = mock.tap { |mock| mock.stubs(:[]).with('rights').returns(ViewRights::ADD) }
    View.any_instance.stubs(:data => mock_data, :new_backend? => true, :rights_include? => true)
    assert View.new.can_add?, 'Should be able to add if newBackend is true'
  end

  def test_immutable_is_false_if_new_backend_is_true
    stub_core_server_connection
    View.any_instance.stubs(:new_backend? => true)
    refute View.new.is_immutable?, 'Expected View instance to be mutable'
  end

  def test_immutable_is_false_if_new_backend_is_false
    stub_core_server_connection
    View.any_instance.stubs(:new_backend? => false)
    refute View.new.is_immutable?, 'Expected View instance to be immutable'
  end

  def test_modern_display_type_returns_match
    stub_core_server_connection
    view = View.new
    view.stubs(:displayType => 'barchart')
    assert_equal 'chart', view.modern_display_type, 'Should return chart that matches display_type'
    view.stubs(:displayType => 'geomap')
    assert_equal 'map', view.modern_display_type, 'Expected matching chart for display_type'
  end

  def test_modern_display_type_returns_default
    stub_core_server_connection
    view = View.new
    view.stubs(:displayType => 'otherchart')
    assert_equal 'otherchart', view.modern_display_type, 'Expected default value for displayType'
  end

  def test_user_granted_returns_true
    stub_core_server_connection
    View.any_instance.stubs(:user_role => true)
    view = View.new
    mock_user = mock.tap { |mock| mock.stubs(:id => 1) }
    assert view.user_granted?(mock_user), 'Expected user_granted? to be true'
  end

  def test_user_granted_returns_false
    stub_core_server_connection
    View.any_instance.stubs(:user_role => false)
    view = View.new
    mock_user = mock.tap { |mock| mock.stubs(:id => 1) }
    refute view.user_granted?(mock_user), 'Expected user_granted? to be false'
  end

  def test_users_with_grant_returns_user_email
    stub_core_server_connection
    mock_user_grant = mock.tap { |mock| mock.stubs(
      :flag? => false,
      :type => 'can',
      :userId => nil,
      :userEmail => 'bob@valve.com'
    )}
    View.any_instance.stubs(:grants => [mock_user_grant])
    view = View.new
    assert_equal ['bob@valve.com'], view.users_with_grant('can'), 'Expected users_with_grant to include mock_user_grant email'
  end

  def test_users_with_grant_returns_user_email_with_nil_grant_type
    stub_core_server_connection
    mock_user_grant = mock.tap { |mock| mock.stubs(
      :flag? => false,
      :type => nil,
      :userId => nil,
      :userEmail => 'bob@valve.com'
    )}
    View.any_instance.stubs(:grants => [mock_user_grant])
    view = View.new
    assert_equal ['bob@valve.com'], view.users_with_grant(''), 'Expected users_with_grant to include mock_user_grant email'
  end

  def test_users_with_grant_returns_user_id
    stub_core_server_connection
    mock_user_grant = mock.tap { |mock| mock.stubs(
      :flag? => false,
      :type => 'can',
      :userId => 1,
      :userEmail => nil
    )}
    View.any_instance.stubs(:grants => [mock_user_grant])
    view = View.new
    assert_equal [1], view.users_with_grant('can'), 'Expected users_with_grant to include mock_user_grant id'
  end

  def test_users_with_grant_returns_user_id_with_empty_grant_type
    stub_core_server_connection
    mock_user_grant = mock.tap { |mock| mock.stubs(
      :flag? => false,
      :type => '',
      :userId => 1,
      :userEmail => nil
    )}
    View.any_instance.stubs(:grants => [mock_user_grant])
    view = View.new
    assert_equal [1], view.users_with_grant(''), 'Expected users_with_grant to include mock_user_grant id'
  end

  def test_users_with_ungranted_right_returns_empty_set
    stub_core_server_connection
    mock_user_grant = mock.tap { |mock| mock.stubs(
      :flag? => false,
      :type => 'cannot',
      :userId => 1,
      :userEmail => nil
    )}
    View.any_instance.stubs(:grants => [mock_user_grant])
    view = View.new
    assert_equal [], view.users_with_grant('can'), 'Expected users_with_grant to include mock_user_grant id'
  end

  def test_users_with_public_flag_grant_returns_empty_set
    stub_core_server_connection
    mock_user_grant = mock.tap { |mock| mock.stubs(
      :flag? => true,
      :type => 'can',
      :userId => 1,
      :userEmail => nil
    )}
    View.any_instance.stubs(:grants => [mock_user_grant])
    view = View.new
    assert_equal [], view.users_with_grant('can'), 'Expected users_with_grant to include mock_user_grant id'
  end

  def test_is_official_returns_true_by_default_if_provenance_is_disabled
    init_current_domain
    stub_feature_flags_with(:enable_data_lens_provenance, false)
    view = View.new
    assert_not_nil(view.is_official?)
  end

  def test_is_official_returns_false_by_default_if_provenance_is_enabled
    init_current_domain
    stub_feature_flags_with(:enable_data_lens_provenance, true)
    view = View.new
    assert_nil(view.is_official?)
  end

  def test_is_official_returns_true
    view = View.new
    view.provenance = 'OFFICIAL'
    assert_not_nil(view.is_official?)
  end

  def test_is_community_returns_false_by_default
    view = View.new
    assert_nil(view.is_community?)
  end

  def test_is_community_returns_true
    view = View.new
    view.provenance = 'COMMUNITY'
    assert_not_nil(view.is_community?)
  end

  def test_has_rights_returns_true
    stub_core_server_connection
    View.any_instance.stubs(:data => {'rights' => %w(read write)})
    view = View.new
    assert view.has_rights?(ViewRights::READ), 'Should have right to read'
    assert view.has_rights?(ViewRights::WRITE), 'Should have right to write'
    assert view.has_rights?(ViewRights::READ, ViewRights::WRITE), 'Should have both read/write rights'
    assert view.has_rights?([ViewRights::READ, ViewRights::WRITE]), 'should have both read/write rights'
  end

  def test_has_rights_returns_false
    stub_core_server_connection
    View.any_instance.stubs(:data => {'rights' => %w(read write)})
    view = View.new
    refute view.has_rights?('fart'), 'Should not have flatulence right'
    refute view.has_rights?('burp'), 'Should not have eructation right'
    refute view.has_rights?('urinate', 'pee'), 'Should not have micturition rights'
    refute view.has_rights?(['explode', 'implode']), 'Should not have dangerous rights'
  end

  def test_overridable_features_includes_cell_comments_when_new_backend_is_false
    stub_core_server_connection
    view = View.new
    view.stubs(:new_backend? => false, :is_tabular? => true, :is_form? => false)
    assert view.overridable_features.map(&:values).flatten.include?('cell_comments')
  end

  def test_overridable_features_excludes_cell_comments_when_new_backend_is_true
    stub_core_server_connection
    view = View.new
    view.stubs(:new_backend? => true, :is_tabular? => true, :is_form? => false)
    refute view.overridable_features.map(&:values).flatten.include?('cell_comments')
  end

  def test_dataset_predicate_method
    stub_core_server_connection
    view = View.new
    view.stubs(:is_blist? => true)
    assert view.dataset?, 'dataset? should return true when dataset is a "table"'
    view.stubs(:is_api? => true)
    refute view.dataset?, 'dataset? should return false when dataset is any other non-table'
  end

  def test_can_see_private_meta
    view = View.new
    view.stubs(:data => {'rights' => [ViewRights::READ, ViewRights::WRITE, ViewRights::UPDATE_VIEW]})
    assert view.can_see_private_meta?, 'can_see_private_meta? should return true if you have update_view right'
    view.stubs(:data => {'rights' => [ViewRights::READ, ViewRights::WRITE]})
    refute view.can_see_private_meta?, 'can_see_private_meta? should return false if you don\'t have update_view right'
  end

  def test_merged_metadata
    load_sample_data("test/fixtures/sample-data.json")
    view = View.find("test-data")

    # private metadata field
    CurrentDomain.stubs(property: [
      'name' => 'fieldset_foo',
      'fields' => [ 'name' => 'field_bar', 'private' => true ]
    ])
    view.stubs(can_see_private_meta?: true) # Signed user.
    assert_equal 'some private custom metadata', view.merged_metadata.fetch('custom_fields', {}).fetch('fieldset_foo', {}).fetch('field_bar', nil), 'Signed user should see private metadata'
    view.stubs(can_see_private_meta?: false) # Unsigned user.
    assert_equal nil, view.merged_metadata.fetch('custom_fields', {}).fetch('fieldset_foo', {}).fetch('field_bar', nil), 'Unsigned user should not see private metadata'

    # public metadata field
    CurrentDomain.stubs(property: [
      'name' => 'fieldset_foo',
      'fields' => [ 'name' => 'field_bar' ]
    ])
    view.stubs(can_see_private_meta?: true) # Signed user.
    assert_equal 'some public custom metadata', view.merged_metadata.fetch('custom_fields', {}).fetch('fieldset_foo', {}).fetch('field_bar', nil), 'Signed user should see public metadata'
    view.stubs(can_see_private_meta?: false) # Unsigned user.
    assert_equal 'some public custom metadata', view.merged_metadata.fetch('custom_fields', {}).fetch('fieldset_foo', {}).fetch('field_bar', nil), 'Unsigned user should see public metadata'
  end

  def test_migrations
    load_sample_data('test/fixtures/sample-data.json')
    view = View.find('test-data')
    # This is hitting core for migration info, which is at /migrations. Not /api/migrations
    CoreServer::Base.connection.expects(:get_request).with('/migrations/test-data').
      returns('{"migrations": "data"}')
    assert_equal('data', view.migrations['migrations'])
  end

  def test_row_count
    load_sample_data('test/fixtures/sample-data.json')
    view = View.find('test-data')
    view.stubs(:new_backend? => true)
    CoreServer::Base.connection.expects(:get_request).with('/id/test-data?%24query=select+count%28%2A%29+as+COLUMN_ALIAS_GUARD__count').
      returns('[{"COLUMN_ALIAS_GUARD__count": 123}]')
    view.expects(:get_total_rows).never
    assert_equal(123, view.row_count)
    view.stubs(:new_backend? => false)
    view.expects(:get_total_rows).once.returns('123')
    assert_equal(123, view.row_count)
  end

  def test_find_related
    view = View.new('tableId' => 1234)

    CoreServer::Base.connection.expects(:get_request).with('/views.json?count=10&method=getByTableId&page=1&sortBy=most_accessed&tableId=1234').
      returns('[{"id" : "test-data", "name" : "Wombats in Space"}]')

    related_views = view.find_related(1)
    assert_equal('Wombats in Space', related_views[0].name)
  end

  def test_find_dataset_landing_page_related_content
    # NBE && OBE
    obe_view = View.new('id' => 'abcd-abcd', 'tableId' => 123)
    obe_endpoint = '/views.json?count=10&method=getByTableId&page=1&sortBy=most_accessed&tableId=123'

    nbe_view = View.new('id' => 'efgh-efgh', 'tableId' => 456)
    nbe_endpoint = '/views.json?count=10&method=getByTableId&page=1&sortBy=most_accessed&tableId=456'

    view = View.new('id' => 'abcd-abcd')
    view.stubs(:nbe_view => nbe_view, :obe_view => obe_view)

    CoreServer::Base.connection.expects(:get_request).with(obe_endpoint).
      returns('[{"id" : "abcd-abcd", "name" : "Requesting View"}, {"id" : "abcd-1234", "name" : "Related OBE View"}]')
    CoreServer::Base.connection.expects(:get_request).with(nbe_endpoint).
      returns('[{"id" : "efgh-efgh", "name" : "Requesting View"}, {"id" : "abcd-1234", "name" : "Related Data Lens", "displayType": "data_lens"}]')

    actual_view_titles = view.find_dataset_landing_page_related_content.map(&:name)
    expected_views_titles = ['Related Data Lens', 'Related OBE View']
    assert_equal(expected_views_titles, actual_view_titles)

    # Only OBE
    view.stubs(:nbe_view => nil, :obe_view => obe_view)

    CoreServer::Base.connection.expects(:get_request).with(obe_endpoint).
      returns('[{"id" : "abcd-abcd", "name" : "Requesting View"}, {"id" : "abcd-1234", "name" : "Related OBE View"}]')

    actual_view_titles = view.find_dataset_landing_page_related_content.map(&:name)
    expected_views_titles = ['Related OBE View']
    assert_equal(expected_views_titles, actual_view_titles)

    # Only NBE
    view.stubs(:nbe_view => nbe_view, :obe_view => nil)

    CoreServer::Base.connection.expects(:get_request).with(nbe_endpoint).
      returns('[{"id" : "efgh-efgh", "name" : "Requesting View"}, {"id" : "abcd-1234", "name" : "Related Data Lens", "displayType": "data_lens"}]')

    actual_view_titles = view.find_dataset_landing_page_related_content.map(&:name)
    expected_views_titles = ['Related Data Lens']
    assert_equal(expected_views_titles, actual_view_titles)

    # Neither NBE nor OBE (just in case)
    view.stubs(:nbe_view => nil, :obe_view => nil)
    assert_equal([], view.find_dataset_landing_page_related_content)
  end

  def test_time_created_at
    view = View.new
    assert_equal(view.time_created_at, nil)

    view.stubs(:createdAt => 1445460290)
    assert_equal(view.time_created_at.class, Time)
  end

  def test_time_data_last_updated_at
    view = View.new
    assert_equal(view.time_data_last_updated_at, nil)

    view.stubs(:rowsUpdatedAt => 1445460290)
    assert_equal(view.time_data_last_updated_at.class, Time)
  end

  def test_time_metadata_last_updated_at
    view = View.new
    assert_equal(view.time_metadata_last_updated_at, nil)

    view.stubs(:viewLastModified => 1445460290)
    assert_equal(view.time_metadata_last_updated_at.class, Time)
  end

  def test_time_last_updated_at
    view = View.new
    view.stubs(:last_activity => nil)
    assert_equal(view.time_last_updated_at, nil)

    view.stubs(:last_activity => 1445460290)
    assert_equal(view.time_last_updated_at.class, Time)
  end

  def test_visualization?
    load_sample_data('test/fixtures/sample-data.json')
    view = View.find('test-data')

    view.stubs(:standalone_visualization? => true, :classic_visualization? => true)
    assert(view.visualization?)

    view.stubs(:standalone_visualization? => true, :classic_visualization? => false)
    assert(view.visualization?)

    view.stubs(:standalone_visualization? => false, :classic_visualization? => true)
    assert(view.visualization?)

    view.stubs(:standalone_visualization? => false, :classic_visualization? => false)
    assert(view.visualization? == false)
  end

  def test_classic_visualization?
    load_sample_data('test/fixtures/sample-data.json')
    view = View.find('test-data')

    view.stubs(:classic_chart? => true, :classic_map? => true)
    assert(view.classic_visualization?)

    view.stubs(:classic_chart? => true, :classic_map? => false)
    assert(view.classic_visualization?)

    view.stubs(:classic_chart? => false, :classic_map? => true)
    assert(view.classic_visualization?)

    view.stubs(:classic_chart? => false, :classic_map? => false)
    refute(view.classic_visualization?)
  end

  def test_classic_chart?
    load_sample_data('test/fixtures/sample-data.json')
    view = View.find('test-data')

    view.stubs(:is_tabular? => true, :displayType => 'chart')
    assert(view.classic_chart?)

    view.stubs(:is_tabular? => false, :displayType => 'chart')
    refute(view.classic_chart?)

    view.stubs(:is_tabular? => true, :displayType => 'notchart')
    refute(view.classic_chart?)

    view.stubs(:is_tabular? => false, :displayType => 'notchart')
    refute(view.classic_chart?)
  end

  def test_classic_map?
    load_sample_data('test/fixtures/sample-data.json')
    view = View.find('test-data')

    view.stubs(:is_tabular? => true, :displayType => 'map')
    assert(view.classic_map?)

    view.stubs(:is_tabular? => false, :displayType => 'map')
    refute(view.classic_map?)

    view.stubs(:is_tabular? => true, :displayType => 'notmap')
    refute(view.classic_map?)

    view.stubs(:is_tabular? => false, :displayType => 'notmap')
    refute(view.classic_map?)
  end

  def test_visualization_interchange_format_v1
    vif_fixture_string = '{"5": "five"}'
    view = View.new
    view.data = {
      'viewType' => 'tabular',
      'displayType' => 'data_lens_chart',
      'displayFormat' => {
        'visualization_interchange_format_v1' => vif_fixture_string
      }
    }

    assert_equal(view.visualization_interchange_format_v1, "5" => "five")

    view.stubs(:standalone_visualization? => false)

    assert_raises(RuntimeError) do
      view.visualization_interchange_format_v1
    end
  end

  def test_display_format_columns
    view = View.new
    view.data = {
      'viewType' => 'tabular',
      'displayType' => 'data_lens_chart',
      'displayFormat' => {
        'valueColumns' => [{'fieldName' => '1'}],
        'fixedColumns' => ['2'],
        'seriesColumns' => [{'fieldName' => '3'}]
      }
    }

    assert_equal(view.display_format_columns, ['1', '2', '3'])

    view = View.new
    view.data = {
      'viewType' => 'tabular',
      'displayType' => 'data_lens_chart',
      'displayFormat' => {
        'valueColumns' => [{'fieldName' => '1'}],
        'fixedColumns' => ['2'],
        'seriesColumns' => [{'fieldName' => '2'}]
      }
    }

    assert_equal(view.display_format_columns, ['1', '2'])

    view = View.new
    view.data = {
      'viewType' => 'tabular',
      'displayType' => 'data_lens_chart',
      'displayFormat' => {
        'valueColumns' => nil,
        'fixedColumns' => nil,
        'seriesColumns' => nil
      }
    }

    assert_equal(view.display_format_columns, [])


    view = View.new
    view.data = classic_map_with_multiple_layers

    assert_equal(view.display_format_columns, [ 'location_1', 'location_2' ])
  end

  def test_to_visualization_embed_blob
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

    view = View.new(json)
    View.any_instance.stubs(
      :display_format_columns => [ 'source_col_1', 'source_col_2' ],
      :fetch_json => json
    )

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

    assert_equal(
      view.to_visualization_embed_blob,
      {
        :originalUid => 'sooo-oldd',
        :title => 'SOOO OLD!',
        :description => 'get off my lawn',
        :data => expected_json,
        :format => 'classic',
        :type => 'someChartType',
        :columns => [ 'source_col_1', 'source_col_2'],
      }
    )
  end

  def test_is_multi_layered?
    View.any_instance.stubs(:is_geospatial? => true)

    view_without_keys = View.new
    refute view_without_keys.is_multi_layered?, 'View without layers is definitely not multi-layered'

    json = {'metadata' => {'geo' => {'layers' => '4444-4444'}}}
    view_with_single_layer = View.new(json)
    refute view_with_single_layer.is_multi_layered?, 'Single geoRows is not multi-layered'

    json = {'metadata' => {'geo' => {'layers' => '4444-4444,5555-5555'}}}
    view_with_multiple_layers = View.new(json)
    assert view_with_multiple_layers.is_multi_layered?, 'Multiple geoRows is multi-layered'

    json = {'displayFormat' => {'viewDefinitions' => [{'uid' => 'self'}]}}
    derived_view_from_single_dataset = View.new(json)
    refute derived_view_from_single_dataset.is_multi_layered?, 'View definitions only referencing self is not multi-layered'

    json = {'displayFormat' => {'viewDefinitions' =>
       [ {'uid' => 'self'}, {'uid' => '4444-4444'} ]}}
    derived_view_from_multiple_datasets = View.new(json)
    assert derived_view_from_multiple_datasets.is_multi_layered?, 'View definitions referencing other view is multi-layered'
  end

  def test_is_api_geospatial
    # when the view has not yet been saved
    view = View.new('displayType' => nil, 'viewType' => 'tabular', 'columns' => [Hashie::Mash.new({ 'dataTypeName' => 'point' })])
    view.stubs(:new_backend? => true, :obe_view => nil, :migrations => {}, :merged_metadata => { 'custom_fields' => { 'Geospatial API Pre-release' => { 'Enabled' => 'true' } } })
    assert(view.is_api_geospatial?)

    # when the view has been saved
    view = View.new('displayType' => 'map', 'viewType' => 'tabular', 'columns' => [Hashie::Mash.new({ 'dataTypeName' => 'point' })])
    view.stubs(:new_backend? => true, :obe_view => nil, :migrations => {}, :merged_metadata => { 'custom_fields' => { 'Geospatial API Pre-release' => { 'Enabled' => 'true' } } })
    assert(view.is_api_geospatial?)
  end

  def test_geospatial_child_layers
    View.stubs(:find_multiple => ['giraffes'])

    view = View.new('id' => '1234-1234', 'metadata' => {'geo' => {}})
    view.stubs(:is_geospatial? => true)
    assert_equal(view.geospatial_child_layers, [])

    view = View.new('id' => '1234-1234', 'metadata' => {'geo' => {'layers' => '4444-4444'}})
    view.stubs(:is_geospatial? => true)
    assert_equal(view.geospatial_child_layers, ['giraffes'])

    view = View.new('id' => '1234-1234', 'metadata' => {'geo' => {'layers' => '4444-4444'}})
    view.stubs(:is_geospatial? => false)
    assert_equal(view.geospatial_child_layers, [])
  end

  def test_preferred_id
    view = View.new('id' => '1234-1234')
    view.stubs(:new_backend? => false, :migrations => {})
    view.stubs(:flag?).with('default').returns(true)
    assert_equal('1234-1234', view.preferred_id)

    view = View.new('id' => '1234-1234')
    view.stubs(:migrations => {:nbeId => 'abcd-abcd'})
    view.stubs(:flag?).with('default').returns(true)
    assert_equal('abcd-abcd', view.preferred_id)

    view = View.new('id' => '1234-1234')
    view.stubs(:new_backend? => true)
    view.stubs(:flag?).with('default').returns(true)
    assert_equal('1234-1234', view.preferred_id)

    view = View.new('id' => '1234-1234')
    view.stubs(:new_backend? => false)
    view.stubs(:flag?).with('default').returns(false)
    assert_equal('1234-1234', view.preferred_id)
  end

  def test_api_foundry_url
    CurrentDomain.stubs(:cname => 'giraffes')
    View.any_instance.stubs(:preferred_id => '1234-1234')
    view = View.new('id' => '1234-1234')

    assert_equal('https://dev.socrata.com/foundry/giraffes/1234-1234', view.api_foundry_url)
    view.stubs(:federated? => true, :domainCName => 'wombats')
    assert_equal('https://dev.socrata.com/foundry/wombats/1234-1234', view.api_foundry_url)
  end

  def test_resource_url_uses_proper_scheme
    View.any_instance.stubs(:preferred_id => '1234-1234')
    view = View.new('id' => '1234-1234')

    assert_equal('https://localhost/resource/1234-1234.json', view.resource_url)
    mock_request = stub
    mock_request.stubs(:scheme => 'https')
    assert_equal('https://localhost/resource/1234-1234.json', view.resource_url(mock_request))
    mock_request.stubs(:scheme => 'http')
    assert_equal('http://localhost/resource/1234-1234.json', view.resource_url(mock_request))
  end

  def test_odata_url_uses_proper_scheme
    view = View.new('id' => '1234-1234')

    assert_equal('https://localhost/OData.svc/1234-1234', view.odata_url)
    mock_request = stub
    mock_request.stubs(:scheme => 'https')
    assert_equal('https://localhost/OData.svc/1234-1234', view.odata_url(mock_request))
    mock_request.stubs(:scheme => 'http')
    assert_equal('http://localhost/OData.svc/1234-1234', view.odata_url(mock_request))
  end

  # EN-5634: Don't prefer NBE id for OData endpoint as it truncates rows
  def test_odata_url_does_not_use_nbe_id
    View.any_instance.stubs(:migrations => {:obeId => '1234-1234', :nbeId => 'abcd-abcd'})
    view = View.new('id' => '1234-1234')

    refute_equal('https://localhost/OData.svc/abcd-abcd', view.odata_url)
  end

  def test_seo_friendly_url
    view = View.new('id' => '1234-1234', 'name' => 'wombat friends')

    assert_equal('https://localhost/dataset/wombat-friends/1234-1234', view.seo_friendly_url)
    I18n.stubs('locale' => 'ca')
    assert_equal('https://localhost/ca/dataset/wombat-friends/1234-1234', view.seo_friendly_url)
  end

  # Taken from ApplicationHelperTest#test_locale_url_prefix
  def test_locale_url_prefix
    view = View.new

    I18n.stubs(:locale => :foo)
    CurrentDomain.stubs(:default_locale => 'foo')
    assert_equal view.locale_url_prefix, ''

    I18n.stubs(:locale => :bar)
    CurrentDomain.stubs(:default_locale => 'foo')
    assert_equal view.locale_url_prefix, '/bar'
  end

  private

  def stub_core_server_connection
    CoreServer::Base.stubs(:connection => mock.tap { |mock| mock.stubs(:get_request) })
  end

  def classic_map_with_multiple_layers
    JSON.parse(File.read("#{Rails.root}/test/fixtures/classic-map-with-multiple-layers.json"))
  end

end
