require 'rails_helper'

describe CatalogFederatorSource, :type => :model do
  include TestHelperMethods

  describe 'a newly created source' do

    let(:source) { @source }

    before do
      source_hash = {
        "id" => 4285,
        "state" => "active",
        "source" => "https://www.transportation.gov/sites/dot.gov/files/docs/data.json",
        "sourceType" => "open_data_metadata_v1_1",
        "displayName" => "Transportation Gov",
        "targetDomainId" => 76,
        "createdAt" => 1492211119,
        "syncSelectionPolicy" => "all",
        "syncUserId" => 689
      }
      @source = CatalogFederatorSource.new(source_hash)
    end


    it 'has a catalog_federator backend' do
      expect(source.server_backend).to eq('catalog_federator')
    end

    it 'has a data_json type_key' do
      expect(source.type_key).to eq('data_json')
    end

    it 'has a no sync status yet' do
      expect(source.status_key).to eq('not_yet')
    end

    it 'has federate_all initially set to true' do
      expect(source.federate_all?).to be(true)
    end

    it 'neve has data_connect_all since CF does not do data' do
      expect(source.data_connect_all?).to be(false)
    end
  end

  describe 'an edited and synced source' do

    let(:source) { @source }

    before do
      source_hash = {
        "id" => 4285,
        "state" => "active",
        "source" => "https://www.transportation.gov/sites/dot.gov/files/docs/data.json",
        "sourceType" => "open_data_metadata_v1_1",
        "displayName" => "Transportation Gov",
        "targetDomainId" => 76,
        "createdAt" => 1492211119,
        "syncSelectionPolicy" => "existing",
        "syncUserId" => 689,
        "syncStarted" => 1492386434,
        "syncEnded" => 1492386434,
        "syncStatus" => "success"
      }
      @source = CatalogFederatorSource.new(source_hash)
    end


    it 'has a catalog_federator backend' do
      expect(source.server_backend).to eq('catalog_federator')
    end

    it 'has a data_json type_key' do
      expect(source.type_key).to eq('data_json')
    end

    it 'has a success sync status' do
      expect(source.status_key).to eq('success')
    end

    it "has federate_all now set to false because of the 'existing' syncSelectionPolicy" do
      expect(source.federate_all?).to be(false)
    end

    it 'neve has data_connect_all since CF does not do data' do
      expect(source.data_connect_all?).to be(false)
    end
  end

end
