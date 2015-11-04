require 'rails_helper'

RSpec.describe 'version routing', type: :routing do

  describe '/version.json' do
    it 'renders show route' do
      expect(get: '/version.json').to route_to(
        controller: 'version',
        action: 'show',
        format: 'json'
      )
    end
  end

  describe '/version' do
    it 'renders show route' do
      expect(get: '/version').to route_to(
        controller: 'version',
        action: 'show'
      )
    end
  end

end
