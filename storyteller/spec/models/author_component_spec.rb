require 'rails_helper'

RSpec.describe AuthorComponent do
  let(:document) { FactoryGirl.create(:document) }
  let(:document_id) { document.id }
  let(:upload_url) { 'https://example.com/upload/path/image.png' }
  let(:alt_text) { 'some alt text' }
  let(:blurb_html) { '<h1>AUTHOR BLURB</h1>' }
  let(:component_data) do
    {
      'type' => 'author',
      'value' => {
        'blurb' => blurb_html,
        'image' => {
          'alt' => alt_text,
          'documentId' => document_id,
          'url' => upload_url
        }
      }
    }
  end

  let(:subject) { AuthorComponent.new(component_data) }

  it 'inherits from ImageComponent' do
    expect(AuthorComponent).to be < ImageComponent
  end

  describe '#image_alt_text' do
    it 'reads from image component in data' do
      expect(subject.image_alt_text).to eq(alt_text)
    end
  end

  describe '#blurb_html' do
    it 'returns blurb from component_data' do
      expect(subject.blurb_html).to eq(blurb_html)
    end

    context 'when blurb piece is missing' do
      let(:component_data) do
        {
          'type' => 'author',
        }
      end

      it 'returns empty string' do
        expect(subject.blurb_html).to eq('')
      end
    end
  end

  describe '#url' do
    context 'when has thumbnails' do
      before do
        allow(subject).to receive(:has_thumbnails?).and_return(true)
        allow(Document).to receive(:find_by_id).with(document.id).and_return(document)
      end

      it 'returns url from document upload' do
        expect(document).to receive(:canonical_url).with(:huge).and_return('huge-url')
        expect(subject.url(:huge)).to eq('huge-url')
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
