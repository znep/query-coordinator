require 'rails_helper'
require 'paperclip/manual_cropper'

RSpec.describe Paperclip::ManualCropper do
  let(:file) { File.new(fixture('image.jpg')) }
  let(:options) do
    { }
  end
  let(:document) { FactoryGirl.create(:document) }

  let(:subject) { Paperclip::ManualCropper.new(file, options, document.upload) }

  after do
    file.close
  end

  describe '#target' do
    it 'returns document' do
      expect(subject.target).to eq(document)
    end
  end

  describe '#transformation_command' do
    before do
      allow(document).to receive(:cropping?).and_return(cropping)
    end

    context 'when not cropping' do
      let(:cropping) { false }

      it 'does not prepend new crop command' do
        expect(subject.transformation_command).to_not include('alsdjf')
      end
    end

    context 'when cropping' do
      let(:cropping) { true }
      let(:document) { FactoryGirl.create(:document, crop_x: 0.25, crop_y: 0.0, crop_width: 0.5, crop_height: 1.0) }

      let(:result) { subject.transformation_command }

      it 'prepends crop and repage commands' do
        expect(result).to include('-crop')
        expect(result).to include('+repage')
      end

      it 'includes crop dimensions' do
        expect(result).to include('136.0x272.0+68.0+0.0')
      end

      context 'when cropping 100%' do
        let(:document) { FactoryGirl.create(:document, crop_x: 0, crop_y: 0, crop_width: 1, crop_height: 1) }

        it 'includes crop dimensions' do
          expect(result).to include('272.0x272.0+0.0+0.0')
        end
      end
    end
  end
end
