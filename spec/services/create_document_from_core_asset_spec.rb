require 'rails_helper'

RSpec.describe CreateDocumentFromCoreAsset do
  it 'raises when no params' do
    expect { CreateDocumentFromCoreAsset.new }.to raise_error(ArgumentError, /given 0, expected \d/)
  end

  let(:document) { FactoryGirl.create(:document) }
  let(:user_id) { 'back-fill' }
  let(:asset_id) { 'hownowbrowncow' }
  let(:story_uid) { 'goal-story' }

  let(:subject) { CreateDocumentFromCoreAsset.new(asset_id, story_uid, user_id) }
  let(:core_response_headers) do
    {
      'Content-Type' => 'image/png',
      'Content-Length' => 10
    }
  end

  let(:core_response) do
    double(
      HttpResponse,
      :raw => double(
        'raw',
        :header => core_response_headers
      )
    )
  end

  before do
    allow(CoreServer).to receive(:get_asset).with(asset_id).and_return(core_response)
  end

  it 'initializes a new document from arguments' do
    new_document = subject.document

    expect(new_document).to be_a(Document)
    expect(new_document).to have_attributes(
      :upload_file_name => asset_id,
      :upload_file_size => core_response_headers['Content-Length'],
      :upload_content_type => core_response_headers['Content-Type'],
      :story_uid => story_uid,
      :created_by => user_id,
      :direct_upload_url => "#{CoreServer.coreservice_uri}/assets/#{asset_id}",
      :skip_thumbnail_generation => true
    )
  end

  describe '#create' do
    context 'with valid document attributes' do
      before do
        allow(subject.document).to receive(:save).and_return(true)
      end

      it 'returns true' do
        expect(subject.create).to eq(true)
      end

      it 'queues ProcessDocumentJob' do
        expect(ProcessDocumentJob).to receive(:perform_now).with(subject.document.id)
        subject.create
      end

      it 'queues RegenerateSkippedThumbnailsJob' do
        expect(RegenerateSkippedThumbnailsJob).to receive(:perform_later).with(subject.document.id)
        subject.create
      end
    end

    context 'when document save fails' do
      before do
        allow(subject.document).to receive(:save).and_return(false)
      end

      it 'returns false' do
        expect(subject.create).to eq(false)
      end

      it 'does not queue ProcessDocumentJob' do
        expect(ProcessDocumentJob).to_not receive(:perform_now)
        subject.create
      end

      it 'does not queue RegenerateSkippedThumbnailsJob' do
        expect(RegenerateSkippedThumbnailsJob).to_not receive(:perform_later)
        subject.create
      end
    end
  end
end
