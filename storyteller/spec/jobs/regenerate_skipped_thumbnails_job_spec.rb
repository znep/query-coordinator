require 'rails_helper'

RSpec.describe RegenerateSkippedThumbnailsJob do

  describe '#perform' do

    let(:document) { FactoryGirl.create(:document) }

    let(:subject) { RegenerateSkippedThumbnailsJob.new }

    before do
      allow(Document).to receive(:find).with(document.id).and_return(document)
      # prevent the paperclip default of pulling the doc from s3 and doing other stuff
      allow(document).to receive(:regenerate_thumbnails!)
    end

    it 'does not call regenerate_thumbnails!' do
      expect(document).to_not receive(:regenerate_thumbnails!)
      subject.perform(document.id)
    end

    it 'does not try to save! document' do
      expect(document).to_not receive(:save!)
      subject.perform(document.id)
    end

    context 'when skip_thumbnail_generation is set to true' do
      let(:document) { FactoryGirl.create(:document, skip_thumbnail_generation: true) }

      it 'calls regenerate_thumbnails!' do
        expect(document).to receive(:regenerate_thumbnails!)
        subject.perform(document.id)
      end

      it 'sets document status to "processed"' do
        subject.perform(document.id)
        expect(document.status).to eq('processed')
      end

      it 'tries to save! document' do
        expect(document).to receive(:save!)
        subject.perform(document.id)
      end

      it 'sets status to processed' do
        subject.perform(document.id)
        expect(document.status).to eq('processed')
      end

      context 'when save fails' do
        it 'notifies airbrake' do
          error = StandardError.new('Y U NO AIRBRAKE?')
          allow_any_instance_of(RegenerateSkippedThumbnailsJob).to receive(:perform).and_raise(error)
          allow(AirbrakeNotifier).to receive(:report_error)

          expect {
            RegenerateSkippedThumbnailsJob.perform_now(document.id)
          }.to raise_error(error)

          expect(AirbrakeNotifier).to have_received(:report_error).with(error, on_method: "RegenerateSkippedThumbnailsJob#perform(document_id: #{document.id}, story_uid: #{document.story_uid}, user: #{document.created_by})")
        end
      end
    end
  end
end
