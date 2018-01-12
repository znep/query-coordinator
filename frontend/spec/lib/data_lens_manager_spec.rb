require 'rails_helper'

describe DataLensManager do
  include TestHelperMethods

  def data_lens_manager
    @data_lens_manager ||= DataLensManager.new
  end

  before do
    init_current_domain
    allow(CurrentDomain).to receive(:domain).and_return(cname: 'localhost')
  end

  it 'test_create_creates_a_new_data_lens' do
    connection_stub = double
    created = false
    allow(connection_stub).to receive(:create_request) do |url, payload|
      if url == '/views.json?accessType=WEBSITE'
        created = true
        payload = JSON.parse(payload).with_indifferent_access
        expect(payload[:name]).to eq('my title')
        expect(payload[:description]).to eq('my description')
        # Should not have the dataPublicRead flag - ie should default to private
        expect(payload[:flags]).to eq(['default'])
        v2_page_metadata.to_json
      end
    end
    allow(connection_stub).to receive(:update_request) do |url, payload|
      expect(url).to eq('/views/mjcb-9cxc.json')
      payload = JSON.parse(payload).with_indifferent_access
      v2_page_metadata.to_json
    end

    allow(CoreServer::Base).to receive(:connection).and_return(connection_stub)

    result = data_lens_manager.create(category = nil, {:name =>'my title', :description=>'my description'})
    expect(result).to eq('mjcb-9cxc')
    expect(created).to be_truthy
  end

  it 'test_create_creates_a_new_data_lens_with_the_given_category_if_category_provided' do
    given_category = 'some_test_category'

    connection_stub = double
    created = false
    allow(connection_stub).to receive(:create_request) do |url, payload|
      if url == '/views.json?accessType=WEBSITE'
        created = true
        expect(JSON.parse(payload)['category']).to eq(given_category)
        v2_page_metadata.to_json
      end
    end

    allow(connection_stub).to receive(:update_request).and_return(v2_page_metadata.to_json)
    allow(CoreServer::Base).to receive(:connection).and_return(connection_stub)

    result = data_lens_manager.create(given_category, {:name =>'my title', :description=>'my description'})
    expect(created).to be_truthy
  end

  it 'test_create_creates_a_new_data_lens_with_the_given_category_if_category_not_provided' do
    connection_stub = double
    created = false
    allow(connection_stub).to receive(:create_request) do |url, payload|
      if url == '/views.json?accessType=WEBSITE'
        created = true
        expect(JSON.parse(payload)['category']).to be(nil)
        v2_page_metadata.to_json
      end
    end

    allow(connection_stub).to receive(:update_request).and_return(v2_page_metadata.to_json)
    allow(CoreServer::Base).to receive(:connection).and_return(connection_stub)

    result = data_lens_manager.create(category = nil, {:name =>'my title', :description=>'my description'})
    expect(created).to be_truthy
  end

  it 'test_create_v2_data_lens' do
    response = fixture("v2-page-metadata.json")
    connection_stub = double
    created = false
    allow(connection_stub).to receive(:create_request) do |url, payload|
      if url == '/views.json?accessType=WEBSITE'
        created = true
        payload = JSON.parse(payload).with_indifferent_access
        expect(payload[:displayFormat][:data_lens_page_metadata][:name]).to eq('my title')
        expect(payload[:displayFormat][:data_lens_page_metadata][:description]).to eq('my description')
        # Assert that the pageId is nil at this point
        expect(payload[:displayFormat][:data_lens_page_metadata][:pageId]).to be_falsy
        expect(payload[:displayType]).to eq('data_lens')
        response
      end
    end

    allow(connection_stub).to receive(:update_request) do |url, payload|
      expect(url).to eq('/views/mjcb-9cxc.json')
      response
    end

    allow(connection_stub).to receive(:publish)

    allow(CoreServer::Base).to receive(:connection).and_return(connection_stub)

    result = data_lens_manager.create(category = nil, {:name=>'my title', :description=>'my description'})
    expect(result).to eq('mjcb-9cxc')
    expect(created).to be_truthy
  end

  it 'test_update' do
    connection_stub = double
    allow(connection_stub).to receive(:update_request) do |url, payload|
      expect(url).to eq('/views/asdf-asdf.json')
      payload = JSON.parse(payload).with_indifferent_access
      expect(payload[:name]).to eq('new name')
      expect(payload[:description]).to eq('new description')
      '{}'
    end

    allow(CoreServer::Base).to receive(:connection).and_return(connection_stub)

    data_lens_manager.update('asdf-asdf', :name => 'new name', :description => 'new description')
  end

  it 'test_update_does_not_raise_when_reporting_core_errors' do
    connection_stub = double
    allow(connection_stub).to receive(:update_request) do |url, payload|
      expect(url).to eq('/views/asdf-asdf.json')
      payload = JSON.parse(payload).with_indifferent_access
      expect(payload[:name]).to eq('new name')
      expect(payload[:description]).to eq('new description')
      raise CoreServer::Error
    end

    allow(CoreServer::Base).to receive(:connection).and_return(connection_stub)

    data_lens_manager.update('asdf-asdf', :name => 'new name', :description => 'new description')
  end

  it 'test_update_does_not_raise_when_reporting_core_resource_not_found' do
    connection_stub = double
    allow(connection_stub).to receive(:update_request) do |url, payload|
      expect(url).to eq('/views/asdf-asdf.json')
      payload = JSON.parse(payload).with_indifferent_access
      expect(payload[:name]).to eq('new name')
      expect(payload[:description]).to eq('new description')
      raise CoreServer::ResourceNotFound.new(View.new)
    end

    allow(CoreServer::Base).to receive(:connection).and_return(connection_stub)

    data_lens_manager.update('asdf-asdf', :name => 'new name', :description => 'new description')
  end

  it 'test_fetch' do
    connection_stub = double
    allow(connection_stub).to receive(:get_request) do |url|
      expect(url).to eq('/views/asdf-asdf.json')
      '{"body": 1}'
    end

    allow(CoreServer::Base).to receive(:connection).and_return(connection_stub)

    response = data_lens_manager.fetch('asdf-asdf')
    expect(response).to eq({'body' => 1})
  end

  it 'test_fetch_provides_federation_header_to_core' do
    connection_stub = double
    allow(connection_stub).to receive(:get_request) do |url, options|
      expect(options).to eq({ 'X-Socrata-Federation' => 'Honey Badger' })
      '{"body": 1}'
    end

    allow(CoreServer::Base).to receive(:connection).and_return(connection_stub)

    data_lens_manager.fetch('asdf-asdf')
  end

  it 'test_fetch_raises_authn' do
    connection_stub = double
    allow(connection_stub).to receive(:get_request).and_raise(CoreServer::CoreServerError.new(nil, 'authentication_required', 'msg'))

    allow(CoreServer::Base).to receive(:connection).and_return(connection_stub)

    expect { data_lens_manager.fetch('asdf-asdf') }.to raise_error(DataLensManager::ViewAuthenticationRequired)
  end

  it 'test_fetch_raises_authz' do
    connection_stub = double
    allow(connection_stub).to receive(:get_request).and_raise(CoreServer::CoreServerError.new(nil, 'permission_denied', 'msg'))

    allow(CoreServer::Base).to receive(:connection).and_return(connection_stub)

    expect { data_lens_manager.fetch('asdf-asdf') }.to raise_error(DataLensManager::ViewAccessDenied)
  end

  it 'test_fetch_raises_view_not_found_when_core_resource_not_found' do
    connection_stub = double
    allow(connection_stub).to receive(:get_request).and_raise(CoreServer::ResourceNotFound.new(View.new))

    allow(CoreServer::Base).to receive(:connection).and_return(connection_stub)

    expect { data_lens_manager.fetch('asdf-asdf') }.to raise_error(DataLensManager::ViewNotFound)
  end

  it 'test_delete' do
    connection_stub = double
    allow(connection_stub).to receive(:delete_request) do |url, payload|
      expect(url).to eq('/views/asdf-asdf.json')
      '{}'
    end

    allow(CoreServer::Base).to receive(:connection).and_return(connection_stub)

    data_lens_manager.delete('asdf-asdf')
  end

  it 'test_delete_does_not_raise_when_core_raises' do
    connection_stub = double
    allow(connection_stub).to receive(:delete_request) do |url, payload|
      expect(url).to eq('/views/asdf-asdf.json')
      raise CoreServer::Error
    end

    allow(CoreServer::Base).to receive(:connection).and_return(connection_stub)

    data_lens_manager.delete('asdf-asdf')
  end

  it 'test_delete_does_not_raise_when_core_resource_not_found' do
    connection_stub = double
    allow(connection_stub).to receive(:delete_request) do |url, payload|
      expect(url).to eq('/views/asdf-asdf.json')
      raise CoreServer::ResourceNotFound.new(View.new)
    end

    allow(CoreServer::Base).to receive(:connection).and_return(connection_stub)

    data_lens_manager.delete('asdf-asdf')
  end

  def v2_page_metadata
    json_fixture("v2-page-metadata.json")
  end

end
