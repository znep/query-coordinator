require 'rails_helper'

RSpec.describe 'admin/themes routing', type: :routing do

  describe '#index' do
    it 'routes to admin themes controller' do
      expect(get: 'admin/themes').to route_to(
        controller: 'admin/themes',
        action: 'index'
      )
    end
  end

  describe '#edit' do
    it 'routes to admin themes controller' do
      expect(get: 'admin/themes/custom-theme-1/edit').to route_to(
        controller: 'admin/themes',
        action: 'edit',
        id: 'custom-theme-1'
      )
    end
  end

  describe '#new' do
    it 'routes to admin themes controller' do
      expect(get: 'admin/themes/new').to route_to(
        controller: 'admin/themes',
        action: 'new'
      )
    end
  end

end
