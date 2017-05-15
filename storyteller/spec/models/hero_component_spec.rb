require 'rails_helper'

RSpec.describe HeroComponent do
  let(:document) { FactoryGirl.create(:document) }
  let(:document_id) { document.id }
  let(:upload_url) { 'https://example.com/upload/path/image.png' }
  let(:alt_text) { 'some alt text' }
  let(:component_data) do
    {
      'type' => 'hero',
      'value' => {
        'alt' => alt_text,
        'documentId' => document_id,
        'url' => upload_url,
        'html' => '<h1>THINGS!</h1>',
        'layout' => {
          'height': 123
        }
      }
    }
  end

  let(:subject) { HeroComponent.new(component_data) }

  it 'inherits from ImageComponent' do
    expect(HeroComponent).to be < ImageComponent
  end

  describe '#layout' do
    it 'returns layout object from component' do
      expect(subject.layout).to eq(component_data['value']['layout'])
    end

    context 'when no layout exists' do
      let(:component_data) do
        {
          'type' => 'hero',
          'value' => {
            'alt' => alt_text,
            'documentId' => document_id,
            'url' => upload_url,
            'html' => '<h1>THINGS!</h1>'
          }
        }
      end

      it 'returns nil' do
        expect(subject.layout).to be_nil
      end
    end

    context 'when no `value` exists' do
      let(:component_data) do
        {
          'type' => 'hero'
        }
      end

      it 'returns nil' do
        expect(subject.layout).to be_nil
      end
    end
  end

  describe '#html' do
    it 'returns html object from component' do
      expect(subject.html).to eq(component_data['value']['html'])
    end

    context 'when no layout exists' do
      let(:component_data) do
        {
          'type' => 'hero',
          'value' => {
            'alt' => alt_text,
            'documentId' => document_id,
            'url' => upload_url,
          }
        }
      end

      it 'returns empty string' do
        expect(subject.html).to eq('')
      end
    end

    context 'when no `value` exists' do
      let(:component_data) do
        {
          'type' => 'hero'
        }
      end

      it 'returns empty string' do
        expect(subject.html).to eq('')
      end
    end
  end
end
