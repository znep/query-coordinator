require 'test_helper'

class NewViewManagerTest < Test::Unit::TestCase

  def new_view_manager
    @new_view_manager ||= NewViewManager.new
  end

  def setup
    CurrentDomain.stubs(domain: stub(cname: 'localhost'))
  end

  def test_create_creates_a_new_data_lens_whose_href_points_to_its_own_4x4
    connection_stub = mock
    created = false
    published = false
    connection_stub.expects(:create_request).times(1).with do |url, payload|
      if url == '/views.json?accessType=WEBSITE'
        created = true
        payload = JSON.parse(payload).with_indifferent_access
        assert_equal('my title', payload[:name])
        assert_equal('my description', payload[:description])
        assert_equal('', payload[:metadata][:accessPoints][:new_view])
        # Should not have the dataPublicRead flag - ie should default to private
        assert_equal(nil, payload[:flags])
      elsif url == '/views/niew-veww/publication.json?accessType=WEBSITE'
        published = true
      end
    end.returns('{"id": "niew-veww"}')
    connection_stub.expects(:update_request).times(1).with do |url, payload|
      assert_equal('/views/niew-veww.json', url)
      payload = JSON.parse(payload).with_indifferent_access
      assert_equal('opendata_url', payload[:metadata][:accessPoints][:new_view])
    end.returns('{}')

    CoreServer::Base.stubs(connection: connection_stub)

    Rails.application.routes.url_helpers.stubs(opendata_cards_view_url: 'opendata_url')

    result = new_view_manager.create('my title', 'my description')
    assert_equal('niew-veww', result)
    assert(created)
    assert(!published)
  end

  def test_create_raises_when_view_not_created
    new_view_manager.stubs(:create_new_view => nil)
    assert_raises(NewViewManager::NewViewNotCreatedError) do
      new_view_manager.create('title', 'description')
    end
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

    new_view_manager.update('asdf-asdf', 'new name', 'new description')
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
      new_view_manager.update('asdf-asdf', 'new name', 'new description')
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
      new_view_manager.update('asdf-asdf', 'new name', 'new description')
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

end
