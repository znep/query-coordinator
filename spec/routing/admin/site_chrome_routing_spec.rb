require 'rails_helper'

RSpec.describe 'admin/site_chrome routing', type: :routing do

  describe '#edit' do
    it 'routes to admin site_chrome controller' do
      expect(get: 'admin/site_chrome/edit').to route_to(
        controller: 'admin/site_chromes',
        action: 'edit'
      )
    end
  end

  describe '#update' do
    it 'routes to admin site_chrome controller' do
      expect(put: 'admin/site_chrome').to route_to(
        controller: 'admin/site_chromes',
        action: 'update'
      )
    end
  end

end
