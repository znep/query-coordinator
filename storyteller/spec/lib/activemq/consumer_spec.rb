require 'rails_helper'

require 'activemq/consumer'

describe ActiveMQ::Consumer do
  context '#parse' do
    it 'returns a hash when given parseable JSON' do
      expect(ActiveMQ::Consumer.parse('{"tag":"DOMAIN_UPDATED","details": {}}')).to eq({ 'tag' => 'DOMAIN_UPDATED', 'details' => {}})
    end

    it 'returns nil when a message cannot be parsed' do
      expect(ActiveMQ::Consumer.parse('{')).to be_nil
    end
  end
end
