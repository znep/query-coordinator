require 'rails_helper'

describe ExternalFederation do
  let(:fixture_prefix) { "#{Rails.root}/spec/fixtures/external_federation" }
  let(:check_params) do
    {
      'sync_type' => 'ignored',
      'folders' => {
        '19' => {
          'sync_type' => 'ignored'
        },
        '13' => {
          'sync_type' => 'catalog',
          'services' => {
            '1' => {
              'sync_type' => 'catalog',
              'layers' => {
                '1' => {
                  'sync_type' => 'catalog'
                },
                '2' => {
                  'sync_type' => 'catalog'
                },
                '3' => {
                  'sync_type' => 'catalog'
                }
              }
            }
          }
        },
        '16' => {
          'sync_type' => 'ignored',
          'services' => {
            '2' => {
              'sync_type' => 'ignored',
              'layers' => {
                '4' => {
                  'sync_type' => 'ignored'
                }
              }
            }
          }
        }
      }
    }
  end


  class FakeUser
    def email
      'some@user.com'
    end
  end


  let(:host) { 'host' }
  let(:port) { 2030 }
  let(:user) { FakeUser.new.email }
  let(:base_url) { "http://#{host}:#{port}" }
  let(:stub_contents) do
    {
      :headers => {'X-Socrata-Host' => host, 'X-Socrata-User' => user},
      :body => {}
    }
  end

  before(:each) do
    allow(EsriCrawler).to receive(:hostname).and_return(host)
    allow(EsriCrawler).to receive(:port).and_return(port)
    allow(EsriCrawler).to receive(:patch_request) { |path, body| body }
    allow(CurrentDomain).to receive(:cname) { host }
    allow(User).to receive(:current_user).and_return(FakeUser.new)
  end

  context '#self.update_server' do
    it 'interprets checkboxes as sync_types' do
      body = ExternalFederation.update_server(2, check_params)

      expect(body['folders']).to be_kind_of(Array)
      body['folders'].each do |folder|
        # look up the folder in input by id
        folder_id = folder['id'].to_s
        expect(folder['id']).to be_kind_of(Integer)

        catalog = check_params['folders'][folder_id]['catalog']
        folder.fetch('services', []).each do |service|
          service_id = service['id'].to_s
          catalog = check_params['folders'][folder_id]['services'][service_id]['catalog']
          expect(service['id']).to be_kind_of(Integer)
          expect(service['layers']).to be_kind_of(Array)

          service.fetch('layers', []).each do |layer|
            layer_id = layer['id'].to_s
            expect(layer['id']).to be_kind_of(Integer)

            catalog = check_params['folders'][folder_id]['services'][service_id]['layers'][layer_id]['catalog']
          end
        end
      end
    end
  end

  context '#self.servers' do

    let(:endpoint) { "#{base_url}/servers" }

    it 'sets a filter based on the domain name' do
      expect(EsriCrawler).to receive(:get_request) do |path, query|
        expect(query).to eq({:filters => {:socrata_domain => host}})
        {'items' => []}
      end
      servers = ExternalFederation.servers
    end

    it 'returns an array of EsriServers' do
      query = {:query => {:filters => {:socrata_domain => host}}}
      stub_request(:get, endpoint).with(stub_contents.merge(query)).to_return(
        :status => 200,
        :body => File.read("#{fixture_prefix}/servers.json")
      )
      servers = ExternalFederation.servers
      expect(servers.length).to eq(1)
      expect(servers[0]).to be_an_instance_of(EsriServer)
    end
  end

  context '#self.server' do

    let(:endpoint) { "#{base_url}/servers/1" }

    it 'returns a single EsriServer' do
      query = {:query => {:filters => {:socrata_domain => host}}}
      stub_request(:get, endpoint).with(stub_contents.merge(query)).to_return(
        :status => 200,
        :body => File.read("#{fixture_prefix}/server.json")
      )
      server = ExternalFederation.server(1)
      expect(server).to be_an_instance_of(EsriServer)
    end
  end

  it 'sets a filter based on the domain name' do
    expect(EsriCrawler).to receive(:get_request) do |path, query|
      expect(query).to eq({:filters => {:socrata_domain => host}})
      {}
    end
    server = ExternalFederation.server(1)
  end

  context '#self.create' do

    let(:endpoint) { "#{base_url}/servers" }

    it 'sets the sync type of the returning server' do
      sync_type = 'meow'
      esri_domain = 'sampleserver'

      expect(EsriCrawler).to receive(:post_request) do |path, body|
        expect(body).to eq({
          :url => "https://#{esri_domain}/ArcGIS/rest",
          :sync_type => sync_type,
          :socrata_domain => CurrentDomain.cname
        })
      end
      ExternalFederation.create(esri_domain, sync_type)
    end
  end

end
