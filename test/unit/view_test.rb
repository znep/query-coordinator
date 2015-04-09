require 'test_helper'

class ViewTest < Test::Unit::TestCase

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
    assert view.rights_include?('add'), 'Should return true when rights include "add"'
    assert view.rights_include?('delete'), 'Should return true when rights include "delete"'
    assert view.rights_include?('write'), 'Should return true when rights include "write"'
    refute view.rights_include?('nonce'), 'Should return false when non-matching right requested'
  end

  def test_rights_include_returns_false
    stub_core_server_connection
    View.any_instance.stubs(:data => nil)
    refute View.new.rights_include?('nonce'), 'Should return false when non-matching right requested'
    View.any_instance.stubs(:data => {})
    view = View.new
    refute view.rights_include?('nonce'), 'Should return false when non-matching right requested'
    refute view.rights_include?('add'), 'Should return false when non-matching right requested'
    refute view.rights_include?('delete'), 'Should return false when non-matching right requested'
    refute view.rights_include?('write'), 'Should return false when non-matching right requested'
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
    mock_data = mock.tap { |mock| mock.stubs(:[]).with('rights').returns('add') }
    View.any_instance.stubs(:data => mock_data, :new_backend? => false, :rights_include? => true)
    assert View.new.can_add?, 'Should be able to add if newBackend is false'
  end

  def test_can_add_returns_false_if_new_backend_is_true
    stub_core_server_connection
    mock_data = mock.tap { |mock| mock.stubs(:[]).with('rights').returns('add') }
    View.any_instance.stubs(:data => mock_data, :new_backend? => true, :rights_include? => true)
    refute View.new.can_add?, 'Should not be able to add if newBackend is true'
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

  def test_has_rights_returns_true
    stub_core_server_connection
    View.any_instance.stubs(:data => {'rights' => %w(read write)})
    view = View.new
    assert view.has_rights?('read'), 'Should have right to read'
    assert view.has_rights?('write'), 'Should have right to write'
    assert view.has_rights?('read', 'write'), 'Should have both read/write rights'
    assert view.has_rights?(['read', 'write']), 'should have both read/write rights'
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
    view.stubs(:display_name => 'table')
    assert view.dataset?, 'dataset? should return true when dataset is a "table"'
    view.stubs(:display_name => 'viltered view')
    refute view.dataset?, 'dataset? should return false when dataset is a "filtered view" or any other non-table'
  end

  def test_can_see_private_meta
    view = View.new
    view.stubs(:data => {'rights' => %w(read write update_view)})
    assert view.can_see_private_meta?, 'can_see_private_meta? should return true if you have update_view right'
    view.stubs(:data => {'rights' => %w(read write)})
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
    CoreServer::Base.connection.expects(:get_request).with('/api/migrations/test-data').
      returns('{"migrations": "data"}')
    assert_equal('data', view.migrations['migrations'])
  end

  def test_row_count
    load_sample_data('test/fixtures/sample-data.json')
    view = View.find('test-data')
    view.stubs(:new_backend? => true)
    CoreServer::Base.connection.expects(:get_request).with('/id/test-data?%24query=select+count%28%2A%29').
      returns('[{"count": 123}]')
    view.expects(:get_total_rows).never
    assert_equal(123, view.row_count)
    view.stubs(:new_backend? => false)
    view.expects(:get_total_rows).once.returns('123')
    assert_equal(123, view.row_count)
  end

  private

  def stub_core_server_connection
    CoreServer::Base.stubs(:connection => mock.tap { |mock| mock.stubs(:get_request) })
  end

end
