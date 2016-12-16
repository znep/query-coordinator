require 'rails_helper'

RSpec.describe 'goals api v1 routing', type: :routing do
  let(:verb) { nil }
  let(:path) { nil }

  let(:default_route) do
    { verb => path }
  end
  let(:explicit_json_route) do
    default_route.merge(:format => 'json')
  end

  describe 'publishing' do
    describe 'create endpoint' do
      let(:verb) { :post }
      let(:path) { '/api/stat/v1/goals/four-four/narrative/published' }

      it 'routes json requests to PublishedController' do
        expect(explicit_json_route).to route_to(
          controller: 'api/stat/v1/goals/published',
          action: 'create',
          format: 'json',
          uid: 'four-four'
        )
      end

      it 'routes to PublishedController with json by default' do
        expect(default_route).to route_to(
          controller: 'api/stat/v1/goals/published',
          action: 'create',
          format: 'json',
          uid: 'four-four'
        )
      end
    end

    describe 'latest endpoint' do
      let(:verb) { :get }
      let(:path) { '/api/stat/v1/goals/four-four/narrative/published/latest' }

      it 'routes json requests to PublishedController' do
        expect(explicit_json_route).to route_to(
          controller: 'api/stat/v1/goals/published',
          action: 'latest',
          format: 'json',
          uid: 'four-four'
        )
      end

      it 'routes to PublishedController with json by default' do
        expect(default_route).to route_to(
          controller: 'api/stat/v1/goals/published',
          action: 'latest',
          format: 'json',
          uid: 'four-four'
        )
      end
    end
  end

  describe 'permissions' do
    describe 'update endpoint' do
      let(:verb) { :put }
      let(:path) { '/api/stat/v1/goals/four-four/narrative/permissions' }

      it 'routes json requests to PermissionsController' do
        expect(explicit_json_route).to route_to(
          controller: 'api/stat/v1/goals/permissions',
          action: 'update',
          format: 'json',
          uid: 'four-four'
        )
      end

      it 'routes to PermissionsController with json by default' do
        expect(default_route).to route_to(
          controller: 'api/stat/v1/goals/permissions',
          action: 'update',
          format: 'json',
          uid: 'four-four'
        )
      end
    end
  end
end
