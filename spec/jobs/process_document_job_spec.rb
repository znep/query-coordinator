require 'rails_helper'

RSpec.describe ProcessDocumentJob do

  describe '#perform' do

    let(:document) { FactoryGirl.create(:document) }

    subject { ProcessDocumentJob.new }

    before do
      # prevent the paperclip default of pulling the doc from s3 and doing other stuff
      allow(Document).to receive(:find).with(document.id).and_return(document)
      allow(document).to receive(:upload=)
    end

    it 'sets document status to "processed"' do
      subject.perform(document.id)
      expect(document.status).to eq('processed')
    end

    it 'sets document upload to documents upload url' do
      expect(document).to receive(:upload=).with(URI.parse(document.direct_upload_url))
      subject.perform(document.id)
    end

    it 'tries to save! document' do
      expect(document).to receive(:save!)
      subject.perform(document.id)
    end

    context 'when save fails' do
      it 'notifies airbrake' do
        error = StandardError.new('Y U NO AIRBRAKE?')
        allow_any_instance_of(ProcessDocumentJob).to receive(:perform).and_raise(error)
        allow(AirbrakeNotifier).to receive(:report_error)

        expect {
          ProcessDocumentJob.perform_now(document.id)
        }.to raise_error(error)

        expect(AirbrakeNotifier).to have_received(:report_error).with(error, "ProcessDocumentJob#perform(document_id: #{document.id}, story_uid: #{document.story_uid}, user: #{document.created_by})")
      end
    end
  end
end
