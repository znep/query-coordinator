require 'rails_helper'

RSpec.describe 'api v1 routing', type: :routing do
  let(:verb) { nil }
  let(:path) { nil }

  let(:default_route) do
    { verb => path }
  end
  let(:explicit_json_route) do
    default_route.merge(:format => 'json')
  end

  describe 'drafts' do
    describe 'create endpoint' do
      let(:verb) { :post }
      let(:path) { '/api/v1/stories/four-four/drafts' }

      it 'routes json requests to DraftsController' do
        expect(explicit_json_route).to route_to(
          controller: 'api/v1/drafts',
          action: 'create',
          uid: 'four-four',
          format: 'json'
        )
      end

      it 'routes to DraftsController with json by default' do
        expect(default_route).to route_to(
          controller: 'api/v1/drafts',
          action: 'create',
          uid: 'four-four',
          format: 'json'
        )
      end
    end

    describe 'latest endpoint' do
      let(:verb) { :get }
      let(:path) { '/api/v1/stories/four-four/drafts/latest' }

      it 'routes json requests to DraftsController' do
        expect(explicit_json_route).to route_to(
          controller: 'api/v1/drafts',
          action: 'latest',
          uid: 'four-four',
          format: 'json'
        )
      end

      it 'routes to DraftsController with json by default' do
        expect(default_route).to route_to(
          controller: 'api/v1/drafts',
          action: 'latest',
          uid: 'four-four',
          format: 'json'
        )
      end
    end
  end

  describe 'publishing' do
    describe 'create endpoint' do
      let(:verb) { :post }
      let(:path) { '/api/v1/stories/four-four/published' }

      it 'routes json requests to PublishedController' do
        expect(explicit_json_route).to route_to(
          controller: 'api/v1/published',
          action: 'create',
          format: 'json',
          uid: 'four-four'
        )
      end

      it 'routes to PublishedController with json by default' do
        expect(default_route).to route_to(
          controller: 'api/v1/published',
          action: 'create',
          format: 'json',
          uid: 'four-four'
        )
      end
    end

    describe 'latest endpoint' do
      let(:verb) { :get }
      let(:path) { '/api/v1/stories/four-four/published/latest' }

      it 'routes json requests to PublishedController' do
        expect(explicit_json_route).to route_to(
          controller: 'api/v1/published',
          action: 'latest',
          uid: 'four-four',
          format: 'json'
        )
      end

      it 'routes to PublishedController with json by default' do
        expect(default_route).to route_to(
          controller: 'api/v1/published',
          action: 'latest',
          uid: 'four-four',
          format: 'json'
        )
      end
    end
  end

  describe 'permissions' do
    describe 'update endpoint' do
      let(:verb) { :put }
      let(:path) { '/api/v1/stories/four-four/permissions' }

      it 'routes json requests to PermissionsController' do
        expect(explicit_json_route).to route_to(
          controller: 'api/v1/permissions',
          action: 'update',
          format: 'json',
          uid: 'four-four'
        )
      end

      it 'routes to PermissionsController with json by default' do
        expect(default_route).to route_to(
          controller: 'api/v1/permissions',
          action: 'update',
          format: 'json',
          uid: 'four-four'
        )
      end
    end
  end

  describe 'documents' do
    describe 'create endpoint' do
      let(:verb) { :post }
      let(:path) { '/api/v1/documents' }

      it 'routes json requests to DocumentsController' do
        expect(explicit_json_route).to route_to(
          controller: 'api/v1/documents',
          action: 'create',
          format: 'json'
        )
      end

      it 'routes to DocumentsController with json by default' do
        expect(default_route).to route_to(
          controller: 'api/v1/documents',
          action: 'create',
          format: 'json'
        )
      end
    end

    # GET /api/v1/documents/id
    describe 'show endpoint' do
      let(:verb) { :get }
      let(:path) { '/api/v1/documents/1' }

      it 'routes json requests to DocumentsController' do
        expect(explicit_json_route).to route_to(
          controller: 'api/v1/documents',
          action: 'show',
          format: 'json',
          id: '1'
        )
      end

      it 'routes to DocumentsController with json by default' do
        expect(default_route).to route_to(
          controller: 'api/v1/documents',
          action: 'show',
          format: 'json',
          id: '1'
        )
      end
    end

    describe 'crop endpoint' do
      let(:verb) { :put }
      let(:path) { '/api/v1/documents/3/crop' }

      it 'routes to DocumentsController' do
        expect(explicit_json_route).to route_to(
          controller: 'api/v1/documents',
          action: 'crop',
          format: 'json',
          id: '3'
        )
      end

      it 'routes to DocumentsController with json by default' do
        expect(default_route).to route_to(
          controller: 'api/v1/documents',
          action: 'crop',
          format: 'json',
          id: '3'
        )
      end
    end
  end

  describe 'uploads' do
    describe 'create endpoint' do
      let(:verb) { :post }
      let(:path) { '/api/v1/uploads' }

      it 'routes json requests to UploadsController' do
        expect(explicit_json_route).to route_to(
          controller: 'api/v1/uploads',
          action: 'create',
          format: 'json'
        )
      end

      it 'routes to UploadsController with json by default' do
        expect(default_route).to route_to(
          controller: 'api/v1/uploads',
          action: 'create',
          format: 'json'
        )
      end
    end
  end

  describe 'goals' do
    describe 'drafts' do
      describe 'create endpoint' do
        let(:verb) { :post }
        let(:path) { '/api/stat/v1/goals/four-four/narrative/drafts' }

        it 'routes json requests to DraftsController' do
          expect(explicit_json_route).to route_to(
            controller: 'api/stat/v1/goals/drafts',
            action: 'create',
            uid: 'four-four',
            format: 'json'
          )
        end

        it 'routes to DraftsController with json by default' do
          expect(default_route).to route_to(
            controller: 'api/stat/v1/goals/drafts',
            action: 'create',
            uid: 'four-four',
            format: 'json'
          )
        end
      end

      describe 'latest endpoint' do
        let(:verb) { :get }
        let(:path) { '/api/stat/v1/goals/four-four/narrative/drafts/latest' }

        it 'routes json requests to DraftsController' do
          expect(explicit_json_route).to route_to(
            controller: 'api/stat/v1/goals/drafts',
            action: 'latest',
            uid: 'four-four',
            format: 'json'
          )
        end

        it 'routes to DraftsController with json by default' do
          expect(default_route).to route_to(
            controller: 'api/stat/v1/goals/drafts',
            action: 'latest',
            uid: 'four-four',
            format: 'json'
          )
        end
      end
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
            uid: 'four-four',
            format: 'json'
          )
        end

        it 'routes to PublishedController with json by default' do
          expect(default_route).to route_to(
            controller: 'api/stat/v1/goals/published',
            action: 'latest',
            uid: 'four-four',
            format: 'json'
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
end
