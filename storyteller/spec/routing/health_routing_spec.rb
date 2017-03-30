require 'rails_helper'

RSpec.describe 'health routing', type: :routing do

  describe '/health.json' do
    it 'renders show route' do
      expect(get: '/health.json').to route_to(
        controller: 'health',
        action: 'show',
        format: 'json'
      )
    end
  end

  describe '/health' do
    it 'renders show route' do
      expect(get: '/health').to route_to(
        controller: 'health',
        action: 'show'
      )
    end
  end

end
