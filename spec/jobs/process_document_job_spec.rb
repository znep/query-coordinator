require 'rails_helper'

RSpec.describe ProcessDocumentJob do

  describe '#perform' do

    let(:document) { FactoryGirl.create(:document) }

    subject { ProcessDocumentJob.new }

    before do
      # prevent the paperclip default of pulling the doc from s3 and doing other stuff
      allow(document).to receive(:upload=)
    end

    it 'sets document status to "processed"' do
      subject.perform(document)
      expect(document.status).to eq('processed')
    end

    it 'sets document upload to documents upload url' do
      expect(document).to receive(:upload=).with(URI.parse(document.direct_upload_url))
      subject.perform(document)
    end

    it 'tries to save! document' do
      expect(document).to receive(:save!)
      subject.perform(document)
    end
  end
end
