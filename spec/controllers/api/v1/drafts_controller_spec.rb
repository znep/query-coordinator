require 'rails_helper'

RSpec.describe Api::V1::DraftsController, type: :controller do

  before do
    stub_valid_session
    stub_core_view('test-test')
  end

  describe '#create' do
    let(:mock_story_draft_creator) { double('story_draft_creator') }
    let(:uid) { 'newd-raft' }
    let(:digest) { 'someedigest' }
    let(:blocks) { [{id: 1}, {id: 2}] }
    let(:theme) { 'sans' }

    let(:params) do
      {
        uid: uid,
        blocks: blocks,
        theme: theme,
        format: 'json'
      }
    end

    let(:headers) do
      {
        'HTTP_IF_MATCH' => digest
      }
    end

    let(:new_draft_story) { double('new_draft_story').as_null_object }
    let(:new_story_digest) { 'new_digest' }

    before do
      allow(StoryDraftCreator).to receive(:new).and_return(mock_story_draft_creator)
      allow(mock_story_draft_creator).to receive(:create).and_return(new_draft_story)
      allow(new_draft_story).to receive(:digest).and_return(new_story_digest)
      allow(new_draft_story).to receive(:blocks).and_return(blocks)

      request.headers.merge!(headers)
    end

    it 'creates draft with StoryDraftCreator' do
      expect(StoryDraftCreator).to receive(:new).with(
        user: mock_valid_user,
        uid: uid,
        digest: digest,
        theme: theme,
        blocks: blocks
      ).and_return(mock_story_draft_creator)

      expect(mock_story_draft_creator).to receive(:create)
      post :create, params
    end

    it 'sets X-Story-Digest for new digest in response headers' do
      post :create, params
      expect(response.headers['X-Story-Digest']).to eq(new_story_digest)
    end

    it 'returns json' do
      post :create, params
      expect(response.content_type).to eq('application/json')
      # Nothing interesting in the body today.
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

    context 'when IF_MATCH is missing' do

      let(:headers) { {} }

      it 'does not call story_draft_creator' do
        expect(mock_story_draft_creator).to_not receive(:create)
        post :create, params
      end

      it 'responds with 428 status' do
        post :create, params
        expect(response.code).to eq('428')
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
