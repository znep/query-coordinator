require 'rails_helper'

describe ApplicationHelper do
  describe 'tileserver_hosts' do
    it 'returns an empty array if the configuration value is absent' do
      APP_CONFIG.tileserver_hosts = nil
      expect(helper.tileserver_hosts).to eq([])
    end

    it 'returns an array of strings if the configuration value is present' do
      APP_CONFIG.tileserver_hosts = 'host1,host2'
      expect(helper.tileserver_hosts).to eq(['host1', 'host2'])
    end
  end
end
