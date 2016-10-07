require 'rails_helper'

RSpec.describe 'goal routing', type: :routing do

  describe 'fully-qualified goal view' do
    it 'renders show route' do
      expect(get: '/stat/goals/dash-bord/cate-gory/test-test').to route_to(
        controller: 'stat/goals',
        action: 'show',
        dashboard: 'dash-bord',
        category: 'cate-gory',
        uid: 'test-test'
      )
    end
  end

  describe 'single goal view' do
    it 'renders show route' do
      expect(get: '/stat/goals/single/test-test').to route_to(
        controller: 'stat/goals',
        action: 'show',
        uid: 'test-test'
      )
    end
  end

end
