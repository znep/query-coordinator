require 'rails_helper'

RSpec.describe DraftsController, type: :controller do

  before do
    stub_valid_session
    stub_core_view('test-test')
  end

  describe '#create' do
    let(:mock_story_draft_creator) { double('story_draft_creator') }
    let(:uid) { 'newd-raft' }
    let(:etag) { 'someetag' }
    let(:blocks) { [{id: 1}] }

    let(:params) do
      {
        uid: uid,
        blocks: blocks,
        format: 'json'
      }
    end

    let(:headers) do
      {
        'IF_MATCH' => etag
      }
    end

    let(:new_draft_story) { double('new_draft_story').as_null_object }
    let(:new_story_digest) { 'new_digest' }
    let(:block_id_mappings) { [{:oldId => 1234, :newId => 5678}] }

    before do
      allow(StoryDraftCreator).to receive(:new).and_return(mock_story_draft_creator)
      allow(mock_story_draft_creator).to receive(:create).and_return(new_draft_story)
      allow(mock_story_draft_creator).to receive(:block_id_mappings).and_return(block_id_mappings)
      allow(new_draft_story).to receive(:digest).and_return(new_story_digest)
      allow(new_draft_story).to receive(:blocks).and_return(blocks)

      request.headers.merge!(headers)
    end

    it 'creates draft with StoryDraftCreator' do
      expect(StoryDraftCreator).to receive(:new).with(
        user: mock_valid_user,
        uid: uid,
        digest: etag,
        blocks: blocks
      ).and_return(mock_story_draft_creator)

      expect(mock_story_draft_creator).to receive(:create)
      post :create, params
    end

    it 'sets Etag for new digest in response headers' do
      post :create, params
      expect(response.headers['ETag']).to eq(new_story_digest)
    end

    it 'renders block json' do
      post :create, params
      expect(response.content_type).to eq('application/json')
      response_json = {
        blockIdMappings: block_id_mappings,
        blocks: blocks
      }.to_json
      expect(response.body).to eq(response_json)
    end

    it 'responds with 200 status' do
      post :create, params
      expect(response.code).to eq('200')
    end

    context 'when digest mismatch occurs' do

      before do
        allow(mock_story_draft_creator).to receive(:create).and_raise(StoryDraftCreator::DigestMismatchError)
      end

      it 'responds with 412 status' do
        post :create, params
        expect(response.code).to eq('412')
      end

      it 'does not render json' do
        post :create, params
        expect(response.body).to be_blank
      end
    end

    context 'when format is not json' do

      it 'still renders json' do
        post :create, params.merge(format: 'html'), headers
        expect(response.content_type).to eq('application/json')
      end
    end
  end
end
