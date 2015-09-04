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

  # POST /api/v1/published-stories
  describe 'published_stories' do
    describe 'create endpoint' do
      it 'routes json requests to published_stories_controller' do
        expect(post: '/api/v1/published_stories', format: 'json').to route_to(
          controller: 'api/v1/published_stories',
          action: 'create',
          format: 'json'
        )
      end

      it 'routes to published_stories_controller with json by default' do
        expect(post: '/api/v1/published_stories').to route_to(
          controller: 'api/v1/published_stories',
          action: 'create',
          format: 'json'
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
