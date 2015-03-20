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
    connection_stub.expects(:create_request).times(2).with do |url, payload|
      if url == '/views.json?accessType=WEBSITE'
        created = true
        payload = JSON.parse(payload).with_indifferent_access
        assert_equal('my title', payload[:name])
        assert_equal('my description', payload[:description])
        assert_equal('', payload[:metadata][:accessPoints][:new_view])
      elsif url == '/views/niew-veww/publication.json?accessType=WEBSITE'
        published = true
      end
    end.then.returns('{"id": "niew-veww"}')
    connection_stub.expects(:update_request).times(1).with do |url, payload|
      assert_equal('/views/niew-veww.json', url)
      payload = JSON.parse(payload).with_indifferent_access
      assert_equal('opendata_url', payload[:metadata][:accessPoints][:new_view])
    end.then.returns('{}')

    CoreServer::Base.stubs(connection: connection_stub)

    Rails.application.routes.url_helpers.stubs(opendata_cards_view_url: 'opendata_url')

    result = new_view_manager.create('my title', 'my description')
    assert_equal('niew-veww', result)
    assert(created)
    assert(published)
  end

  def test_update
    connection_stub = mock
    connection_stub.expects(:update_request).times(1).with do |url, payload|
      assert_equal('/views/asdf-asdf.json', url)
      payload = JSON.parse(payload).with_indifferent_access
      assert_equal(payload[:name], 'new name')
      assert_equal(payload[:description], 'new description')
      # TODO
    end.then.returns('{}')

    CoreServer::Base.stubs(connection: connection_stub)

    new_view_manager.update('asdf-asdf', 'new name', 'new description')
  end

  def test_fetch
    connection_stub = mock
    connection_stub.expects(:get_request).times(1).with do |url|
      assert_equal('/views/asdf-asdf.json', url)
    end.then.returns('{"body": 1}')

    CoreServer::Base.stubs(connection: connection_stub)

    response = new_view_manager.fetch('asdf-asdf')
    assert_equal(response, {'body' => 1})
  end

  def test_fetch_returns_error_if_core_does
    connection_stub = mock
    connection_stub.expects(:get_request).times(1).with do |url|
      assert_equal('/views/asdf-asdf.json', url)
    end.then.raises(CoreServer::CoreServerError.new(nil, 'authentication_required', 'msg'))

    CoreServer::Base.stubs(connection: connection_stub)

    response = new_view_manager.fetch('asdf-asdf')
    assert_equal(response, {error: true, code: 'authentication_required', message: 'msg'})
  end
end
