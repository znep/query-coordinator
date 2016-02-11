require 'rails_helper'

RSpec.describe 'consul active check routing', type: :routing do

  describe '/consul_checks/active' do
    it 'renders show route' do
      expect(get: '/consul_checks/active').to route_to(
        controller: 'consul_checks',
        action: 'active'
      )
    end
  end

end
