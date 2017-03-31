require 'rails_helper'

RSpec.describe ProcessDocumentJob do

  describe '#perform' do

    let(:document) { FactoryGirl.create(:document) }
    let(:file) { URI.parse(document.direct_upload_url) }

    subject { ProcessDocumentJob.new }

    before do
      # prevent the paperclip default of pulling the doc from s3 and doing other stuff
      allow(Document).to receive(:find).with(document.id).and_return(document)
      allow(document).to receive(:upload=)
      allow_any_instance_of(ProcessDocumentJob).
        to receive(:open).
        with(document.direct_upload_url, any_args).
        and_return(file)
    end

    it 'sets document status to "processed"' do
      subject.perform(document.id)
      expect(document.status).to eq('processed')
    end

    it 'sets document upload to documents upload url' do
      expect(document).to receive(:upload=).with(file)
      subject.perform(document.id)
    end

    it 'tries to save! document' do
      expect(document).to receive(:save!)
      subject.perform(document.id)
    end

    context 'when save fails' do
      let(:error) { StandardError.new('Y U NO AIRBRAKE?') }

      before do
        allow_any_instance_of(ProcessDocumentJob).to receive(:perform).and_raise(error)
        allow(AirbrakeNotifier).to receive(:report_error)

        expect {
          ProcessDocumentJob.perform_now(document.id)
        }.to raise_error(error)
      end

      it 'notifies airbrake' do
        expect(AirbrakeNotifier).to have_received(:report_error).with(error, on_method: "ProcessDocumentJob#perform(document_id: #{document.id}, story_uid: #{document.story_uid}, user: #{document.created_by})")
      end

      it 'sets document status to "error"' do
        expect(document.status).to eq('error')
      end
    end
  end
end
