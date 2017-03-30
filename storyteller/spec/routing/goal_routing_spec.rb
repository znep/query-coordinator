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

  describe 'fully-qualified goal edit' do
    it 'renders edit route' do
      expect(get: '/stat/goals/dash-bord/cate-gory/test-test/edit').to route_to(
        controller: 'stat/goals',
        action: 'edit',
        dashboard: 'dash-bord',
        category: 'cate-gory',
        uid: 'test-test'
      )
    end
  end

  describe 'single goal edit' do
    it 'renders edit route' do
      expect(get: '/stat/goals/single/test-test/edit').to route_to(
        controller: 'stat/goals',
        action: 'edit',
        uid: 'test-test'
      )
    end
  end

  describe 'fully-qualified goal edit (transitional)' do
    it 'renders edit route' do
      expect(get: '/stat/goals/dash-bord/cate-gory/test-test/edit-story').to route_to(
        controller: 'stat/goals',
        action: 'edit',
        dashboard: 'dash-bord',
        category: 'cate-gory',
        uid: 'test-test'
      )
    end
  end

  describe 'single goal edit (transitional)' do
    it 'renders edit route' do
      expect(get: '/stat/goals/single/test-test/edit-story').to route_to(
        controller: 'stat/goals',
        action: 'edit',
        uid: 'test-test'
      )
    end
  end

  describe 'fully-qualified goal preview' do
    it 'renders preview route' do
      expect(get: '/stat/goals/dash-bord/cate-gory/test-test/preview').to route_to(
        controller: 'stat/goals',
        action: 'preview',
        dashboard: 'dash-bord',
        category: 'cate-gory',
        uid: 'test-test'
      )
    end
  end

  describe 'single goal preview' do
    it 'renders preview route' do
      expect(get: '/stat/goals/single/test-test/preview').to route_to(
        controller: 'stat/goals',
        action: 'preview',
        uid: 'test-test'
      )
    end
  end

  describe 'single goal copy' do
    it 'renders copy route' do
      expect(get: '/stat/goals/single/test-test/copy').to route_to(
        controller: 'stat/goals',
        action: 'copy',
        uid: 'test-test'
      )
    end
  end
end
