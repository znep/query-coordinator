require 'test_helper'

class NewViewManagerTest < Test::Unit::TestCase

  def new_view_manager
    @new_view_manager ||= NewViewManager.new
  end

  def setup
    init_current_domain
    CurrentDomain.stubs(domain: stub(cname: 'localhost'))
  end

  def test_create_creates_a_new_data_lens
    connection_stub = mock
    created = false
    connection_stub.expects(:create_request).times(1).with do |url, payload|
      if url == '/views.json?accessType=WEBSITE'
        created = true
        payload = JSON.parse(payload).with_indifferent_access
        assert_equal('my title', payload[:name])
        assert_equal('my description', payload[:description])
        # Should not have the dataPublicRead flag - ie should default to private
        assert_equal(['default'], payload[:flags])
      end
    end.returns(v2_page_metadata.to_json)
    connection_stub.expects(:update_request).times(1).with do |url, payload|
      assert_equal('/views/mjcb-9cxc.json', url)
      payload = JSON.parse(payload).with_indifferent_access
    end.returns(v2_page_metadata.to_json)

    CoreServer::Base.stubs(connection: connection_stub)

    result = new_view_manager.create(category = nil, {:name =>'my title', :description=>'my description'})
    assert_equal('mjcb-9cxc', result)
    assert(created)
  end

  def test_create_creates_a_new_data_lens_with_the_given_category_if_category_provided
    given_category = 'some_test_category'

    connection_stub = mock
    created = false
    connection_stub.expects(:create_request).times(1).with do |url, payload|
      if url == '/views.json?accessType=WEBSITE'
        created = true
        assert_equal(given_category, JSON.parse(payload)['category'])
      end
    end.returns(v2_page_metadata.to_json)

    connection_stub.expects(:update_request).returns(v2_page_metadata.to_json)
    CoreServer::Base.stubs(connection: connection_stub)

    result = new_view_manager.create(given_category, {:name =>'my title', :description=>'my description'})
    assert(created)
  end

  def test_create_creates_a_new_data_lens_with_the_given_category_if_category_not_provided
    connection_stub = mock
    created = false
    connection_stub.expects(:create_request).times(1).with do |url, payload|
      if url == '/views.json?accessType=WEBSITE'
        created = true
        assert_nil(JSON.parse(payload)['category'])
      end
    end.returns(v2_page_metadata.to_json)

    connection_stub.expects(:update_request).returns(v2_page_metadata.to_json)
    CoreServer::Base.stubs(connection: connection_stub)

    result = new_view_manager.create(category = nil, {:name =>'my title', :description=>'my description'})
    assert(created)
  end

  def test_create_v2_data_lens
    stub_feature_flags_with(:create_v2_data_lens, true)
    response = File.read("#{Rails.root}/test/fixtures/v2-page-metadata.json")
    connection_stub = mock
    created = false
    connection_stub.expects(:create_request).times(1).with do |url, payload|
      if url == '/views.json?accessType=WEBSITE'
        created = true
        payload = JSON.parse(payload).with_indifferent_access
        assert_equal('my title', payload[:displayFormat][:data_lens_page_metadata][:name])
        assert_equal('my description', payload[:displayFormat][:data_lens_page_metadata][:description])
        # Assert that the pageId is nil at this point
        assert_equal(nil, payload[:displayFormat][:data_lens_page_metadata][:pageId])
        assert_equal('data_lens', payload[:displayType])
      end
    end.returns(response)

    connection_stub.expects(:update_request).times(1).with do |url, payload|
      assert_equal('/views/mjcb-9cxc.json', url)
    end.returns(response)

    connection_stub.expects(:publish).times(0)

    CoreServer::Base.stubs(connection: connection_stub)

    result = new_view_manager.create(category = nil, {:name=>'my title', :description=>'my description'})
    assert_equal('mjcb-9cxc', result)
    assert(created)
  end

  def test_update
    connection_stub = mock
    connection_stub.expects(:update_request).times(1).with do |url, payload|
      assert_equal('/views/asdf-asdf.json', url)
      payload = JSON.parse(payload).with_indifferent_access
      assert_equal(payload[:name], 'new name')
      assert_equal(payload[:description], 'new description')
    end.returns('{}')

    CoreServer::Base.stubs(connection: connection_stub)

    new_view_manager.update('asdf-asdf', {:name => 'new name', :description => 'new description'})
  end

  def test_update_does_not_raise_when_reporting_core_errors
    connection_stub = mock
    connection_stub.expects(:update_request).times(1).with do |url, payload|
      assert_equal('/views/asdf-asdf.json', url)
      payload = JSON.parse(payload).with_indifferent_access
      assert_equal(payload[:name], 'new name')
      assert_equal(payload[:description], 'new description')
    end.raises(CoreServer::Error)

    CoreServer::Base.stubs(connection: connection_stub)

    assert_nothing_raised do
      new_view_manager.update('asdf-asdf', {:name => 'new name', :description => 'new description'})
    end
  end

  def test_update_does_not_raise_when_reporting_core_resource_not_found
    connection_stub = mock
    connection_stub.expects(:update_request).times(1).with do |url, payload|
      assert_equal('/views/asdf-asdf.json', url)
      payload = JSON.parse(payload).with_indifferent_access
      assert_equal(payload[:name], 'new name')
      assert_equal(payload[:description], 'new description')
    end.raises(CoreServer::ResourceNotFound.new(View.new))

    CoreServer::Base.stubs(connection: connection_stub)

    assert_nothing_raised do
      new_view_manager.update('asdf-asdf', {:name => 'new name', :description => 'new description'})
    end
  end

  def test_fetch
    connection_stub = mock
    connection_stub.expects(:get_request).times(1).with do |url|
      assert_equal('/views/asdf-asdf.json', url)
    end.returns('{"body": 1}')

    CoreServer::Base.stubs(connection: connection_stub)

    response = new_view_manager.fetch('asdf-asdf')
    assert_equal(response, {'body' => 1})
  end

  def test_fetch_raises_authn
    connection_stub = mock
    connection_stub.expects(:get_request).times(1).with do |url|
      assert_equal('/views/asdf-asdf.json', url)
    end.raises(CoreServer::CoreServerError.new(nil, 'authentication_required', 'msg'))

    CoreServer::Base.stubs(connection: connection_stub)

    assert_raises(NewViewManager::ViewAuthenticationRequired) do
      new_view_manager.fetch('asdf-asdf')
    end
  end

  def test_fetch_raises_authz
    connection_stub = mock
    connection_stub.expects(:get_request).times(1).with do |url|
      assert_equal('/views/asdf-asdf.json', url)
    end.raises(CoreServer::CoreServerError.new(nil, 'permission_denied', 'msg'))

    CoreServer::Base.stubs(connection: connection_stub)

    assert_raises(NewViewManager::ViewAccessDenied) do
      new_view_manager.fetch('asdf-asdf')
    end
  end

  def test_fetch_raises_view_not_found_when_core_resource_not_found
    connection_stub = mock
    connection_stub.expects(:get_request).times(1).with do |url|
      assert_equal('/views/asdf-asdf.json', url)
    end.raises(CoreServer::ResourceNotFound.new(View.new))

    CoreServer::Base.stubs(connection: connection_stub)

    assert_raises(NewViewManager::ViewNotFound) do
      new_view_manager.fetch('asdf-asdf')
    end
  end

  def test_delete
    connection_stub = mock
    connection_stub.expects(:delete_request).times(1).with do |url, payload|
      assert_equal('/views/asdf-asdf.json', url)
    end.returns('{}')

    CoreServer::Base.stubs(connection: connection_stub)

    new_view_manager.delete('asdf-asdf')
  end

  def test_delete_does_not_raise_when_core_raises
    connection_stub = mock
    connection_stub.expects(:delete_request).times(1).with do |url, payload|
      assert_equal('/views/asdf-asdf.json', url)
    end.raises(CoreServer::Error)

    CoreServer::Base.stubs(connection: connection_stub)

    assert_nothing_raised do
      new_view_manager.delete('asdf-asdf')
    end
  end

  def test_delete_does_not_raise_when_core_resource_not_found
    connection_stub = mock
    connection_stub.expects(:delete_request).times(1).with do |url, payload|
      assert_equal('/views/asdf-asdf.json', url)
    end.raises(CoreServer::ResourceNotFound.new(View.new))

    CoreServer::Base.stubs(connection: connection_stub)

    assert_nothing_raised do
      new_view_manager.delete('asdf-asdf')
    end
  end

  def v2_page_metadata
    JSON.parse(File.read("#{Rails.root}/test/fixtures/v2-page-metadata.json")).with_indifferent_access
  end

end
