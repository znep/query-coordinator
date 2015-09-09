require 'rails_helper'

RSpec.describe 'api v1 routing', type: :routing do

  # POST /api/v1/stories/four-four/drafts
  describe 'drafts' do
    describe 'create endpoint' do
      it 'routes json requests to DraftsController' do
        expect(post: '/api/v1/stories/four-four/drafts', format: 'json').to route_to(
          controller: 'api/v1/drafts',
          action: 'create',
          uid: 'four-four',
          format: 'json'
        )
      end

      it 'routes to draftscontroller with json by default' do
        expect(post: '/api/v1/stories/four-four/drafts').to route_to(
          controller: 'api/v1/drafts',
          action: 'create',
          uid: 'four-four',
          format: 'json'
        )
      end
    end
  end

  # POST /api/v1/stories/four-four/published
  describe 'publishing' do
    describe 'create endpoint' do
      it 'routes json requests to published_controller' do
        expect(post: '/api/v1/stories/four-four/published', format: 'json').to route_to(
          controller: 'api/v1/published',
          action: 'create',
          format: 'json',
          uid: 'four-four'
        )
      end

      it 'routes to published_controller with json by default' do
        expect(post: '/api/v1/stories/four-four/published').to route_to(
          controller: 'api/v1/published',
          action: 'create',
          format: 'json',
          uid: 'four-four'
        )
      end
    end
  end

  # PUT /api/v1/stories/four-four/permissions
  describe 'permissions' do
    describe 'update endpoint' do
      it 'routes json requests to permissions_controller' do
        expect(put: '/api/v1/stories/four-four/permissions', format: 'json').to route_to(
          controller: 'api/v1/permissions',
          action: 'update',
          format: 'json',
          uid: 'four-four'
        )
      end

      it 'routes to permissions_controller with json by default' do
        expect(put: '/api/v1/stories/four-four/permissions').to route_to(
          controller: 'api/v1/permissions',
          action: 'update',
          format: 'json',
          uid: 'four-four'
        )
      end
    end
  end

  # POST /api/v1/documents
  describe 'documents' do
    describe 'create endpoint' do
      it 'routes json requests to DocumentsController' do
        expect(post: '/api/v1/documents', format: 'json').to route_to(
          controller: 'api/v1/documents',
          action: 'create',
          format: 'json'
        )
      end

      it 'routes to DocumentsController with json by default' do
        expect(post: '/api/v1/documents').to route_to(
          controller: 'api/v1/documents',
          action: 'create',
          format: 'json'
        )
      end
    end

    describe 'show endpoint' do
      it 'routes json requests to DocumentsController' do
        expect(get: '/api/v1/documents/1', format: 'json').to route_to(
          controller: 'api/v1/documents',
          action: 'show',
          format: 'json',
          id: '1'
        )
      end

      it 'routes to DocumentsController with json by default' do
        expect(get: '/api/v1/documents/2').to route_to(
          controller: 'api/v1/documents',
          action: 'show',
          format: 'json',
          id: '2'
        )
      end
    end
  end

  # POST /api/v1/uploads
  describe 'uploads' do
    describe 'create endpoint' do
      it 'routes json requests to UploadsController' do
        expect(post: '/api/v1/uploads', format: 'json').to route_to(
          controller: 'api/v1/uploads',
          action: 'create',
          format: 'json'
        )
      end

      it 'routes to DocumentsController with json by default' do
        expect(post: '/api/v1/uploads').to route_to(
          controller: 'api/v1/uploads',
          action: 'create',
          format: 'json'
        )
      end
    end
  end
end
