require 'test_helper'

class NewViewManagerTest < Test::Unit::TestCase

  def new_view_manager
    @new_view_manager ||= NewViewManager.new
  end

  def setup
    CurrentDomain.stubs(domain: stub(cname: 'localhost'))
  end

  def test_create_creates_a_new_data_lens
    connection_stub = mock
    created = false
    published = false
    connection_stub.expects(:create_request).times(2).with do |url, payload|
      if url == '/views.json?accessType=WEBSITE'
        created = true
        payload = JSON.parse(payload).with_indifferent_access
        assert_equal('my title', payload[:name])
        assert_equal('my description', payload[:description])
        assert_equal('opendata_url', payload[:metadata][:accessPoints][:new_view])
      elsif url == '/views/asdf-asdf/publication.json?accessType=WEBSITE'
        published = true
      end
    end.then.returns('{"id": "asdf-asdf"}')

    CoreServer::Base.stubs(connection: connection_stub)

    Rails.application.routes.url_helpers.stubs(opendata_cards_view_url: 'opendata_url')

    result = new_view_manager.create('asdf-asdf', 'my title', 'my description')
    assert_equal('asdf-asdf', result)
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
    end.then.returns('{}')

    CoreServer::Base.stubs(connection: connection_stub)

    new_view_manager.update('asdf-asdf', 'new name', 'new description')
  end
end
