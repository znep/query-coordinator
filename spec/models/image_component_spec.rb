require 'rails_helper'

RSpec.describe ImageComponent, type: :model do
  let(:document) { FactoryGirl.create(:document) }
  let(:document_id) { document.id }
  let(:upload_url) { 'https://example.com/upload/path/image.png' }
  let(:alt_text) { 'some alt text' }
  let(:component_data) do
    {
      'type' => 'image',
      'value' => {
        'alt' => alt_text,
        'documentId' => document_id,
        'url' => upload_url
      }
    }
  end

  let(:subject) { ImageComponent.new(component_data) }

  describe '#alt_text' do
    it 'returns alt text from component data' do
      expect(subject.alt_text).to eq(alt_text)
    end
  end

  describe '#has_thumbnails' do
    context 'when document is processed' do
      let(:document) { FactoryGirl.create(:document, status: 1) }

      it 'is true' do
        expect(subject.has_thumbnails?).to eq(true)
      end
    end

    context 'when document is not yet processed' do
      let(:document) { FactoryGirl.create(:document, status: 0) }

      it 'is true' do
        expect(subject.has_thumbnails?).to eq(false)
      end
    end

    context 'when document is nil' do
      let(:document_id) { nil }

      it 'is false' do
        expect(subject.has_thumbnails?).to eq(false)
      end
    end

    context 'when getty image' do
      let(:document_id) { nil }
      let(:getty_image) { FactoryGirl.create(:getty_image, document: document) }
      let(:upload_url) { "/api/v1/getty-images/#{getty_image.getty_id}" }

      it 'is true' do
        expect(subject.has_thumbnails?).to eq(true)
      end
    end
  end

  describe '#url' do
    context 'when has thumbnails' do
      before do
        allow(subject).to receive(:has_thumbnails?).and_return(true)
      end

      context 'when not getty image' do
        before do
          allow(Document).to receive(:find_by_id).with(document.id).and_return(document)
        end

        it 'returns url from document upload' do
          expect(document.upload).to receive(:url).with(:huge).and_return('huge-url')
          expect(subject.url(:huge)).to eq('huge-url')
        end

        it 'defaults to nil for size' do
          expect(document.upload).to receive(:url).with(nil).and_return('default-size-url')
          expect(subject.url).to eq('default-size-url')
        end
      end

      context 'when getty image' do
        let(:document_id) { nil }
        let(:getty_image) { FactoryGirl.create(:getty_image, document: document) }
        let(:upload_url) { "/api/v1/getty-images/#{getty_image.getty_id}" }

        before do
          allow(GettyImage).to receive(:find_by_getty_id).with(getty_image.getty_id).and_return(getty_image)
        end

        it 'returns url from document upload' do
          expect(document.upload).to receive(:url).with(:huge).and_return('huge-url')
          expect(subject.url(:huge)).to eq('huge-url')
        end
      end
    end

    context 'when does not have thumbnails' do
      before do
        allow(subject).to receive(:has_thumbnails?).and_return(false)
      end

      it 'returns url from component value' do
        expect(subject.url).to eq(upload_url)
      end

      it 'disregards size parameter' do
        expect(subject.url(:xlarge)).to eq(upload_url)
      end
    end
  end
end
