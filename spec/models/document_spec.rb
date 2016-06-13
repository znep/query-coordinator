require 'rails_helper'

RSpec.describe Document, type: :model do

  it 'has a valid factory' do
    expect(FactoryGirl.build(:document)).to be_valid
  end

  it 'has an invalid factory' do
    expect(FactoryGirl.build(:invalid_document)).to be_invalid
  end

  describe 'validations' do
    it 'validates presence of story_uid' do
      document = FactoryGirl.build(:document, story_uid: nil)
      expect(document).to be_invalid
      expect(document.errors[:story_uid]).to_not be_empty
    end

    it 'validates presence of direct_upload_url' do
      document = FactoryGirl.build(:document, direct_upload_url: nil)
      expect(document).to be_invalid
      expect(document.errors[:direct_upload_url]).to_not be_empty
    end

    it 'validates format of direct_upload_url' do
      document = FactoryGirl.build(:document, direct_upload_url: 'http://someodocumtherurl.com/uploads/test.exe')
      expect(document).to be_invalid
      expect(document.errors[:direct_upload_url]).to_not be_empty
    end

    it 'allows direct_upload_url format for EU buckets' do
      # buckets in EU have s3-eu-west-1.amazonaws.com domain
      bucket_name = Rails.application.secrets.aws['s3_bucket_name']
      document = FactoryGirl.build(:document, direct_upload_url: "https://#{bucket_name}.s3-eu-west-1.amazonaws.com/uploads/0c49763b-701c-40e4-b604-6b9478bd7ac8/IMG_3409.JPG")
      expect(document).to be_valid
    end

    it 'validates created_by is not empty' do
      document = FactoryGirl.build(:document, created_by: nil)
      expect(document).to be_invalid
      expect(document.errors[:created_by]).to_not be_empty
    end

    it 'validates created_by is a 4x4' do
      expect(FactoryGirl.build(:document, created_by: 'got2-be40')).to be_valid
    end

    it 'validates created_by is a 4x4' do
      document = FactoryGirl.build(:document, created_by: 'not')
      expect(document).to be_invalid
      expect(document.errors[:created_by]).to_not be_empty
    end

    it 'validates upload is not a text file' do
      document = FactoryGirl.build(:document, upload_content_type: 'text/plain')
      expect(document).to be_invalid
      expect(document.errors[:upload]).to_not be_empty
      expect(document.errors[:upload_content_type]).to_not be_empty
    end

    it 'validates upload_content_type is an image' do
      expect(FactoryGirl.build(:document, upload_content_type: 'image/png')).to be_valid
    end

    it 'validates upload_content_type is an html document' do
      expect(FactoryGirl.build(:document, upload_content_type: 'text/html')).to be_valid
    end
  end

  describe '#as_json' do
    subject { FactoryGirl.create(:document) }

    it 'returns json representing document' do
      expected = {
        document: {
          id: subject.id,
          upload_file_name: subject.upload_file_name,
          upload_content_type: subject.upload_content_type,
          upload_file_size: subject.upload_file_size,
          status: subject.status,
          created_at: subject.created_at,
          url: subject.canonical_url
        }
      }
      expect(subject.as_json).to eq(expected)
    end
  end

  describe '#check_content_type_is_image' do
    it 'is true when upload_content_type is jpeg' do
      document = FactoryGirl.build(:document, upload_content_type: 'image/jpg')
      expect(document.check_content_type_is_image).to eq(true)
    end

    it 'is true when upload_content_type is jpeg' do
      document = FactoryGirl.build(:document, upload_content_type: 'image/png')
      expect(document.check_content_type_is_image).to eq(true)
    end

    it 'is false when upload_content_type is html' do
      document = FactoryGirl.build(:document, upload_content_type: 'text/html')
      expect(document.check_content_type_is_image).to eq(false)
    end
  end

  describe '#attachment_styles_from_thumbnail_sizes' do
    it 'returns a hash of thumbnail sizes' do
      expected = {
        small: "346x346>",
        medium: "650x650>",
        large: "1300x1300>",
        xlarge: "2180x2180>"
      }
      document = FactoryGirl.build(:document)
      expect(subject.attachment_styles_from_thumbnail_sizes).to eq(expected)
    end
  end

  describe '#set_content_type' do
    let(:subject) { FactoryGirl.build(:document) }
    let(:extension) { 'jpg' }
    let(:upload_url) { "http://example.com/path/to/file/file.#{extension}" }

    before do
      allow(subject.upload).to receive(:url).and_return(upload_url)
    end

    it 'sets content type on document' do
      expect(subject.upload.content_type).to eq('image/png')
      subject.set_content_type
      expect(subject.upload.content_type).to eq('image/jpeg')
    end

    context 'when extension is in all caps' do
      let(:extension) { 'JPG' }

      it 'sets content type correctly' do
        expect(subject.upload.content_type).to eq('image/png')
        subject.set_content_type
        expect(subject.upload.content_type).to eq('image/jpeg')
      end
    end

    context 'when extension cannot be read' do
      let(:upload_url) { "http://example.com/path/to/file/file_without_extension" }

      it 'raises an exception' do
        expect { subject.set_content_type }.to raise_error(MissingContentTypeError)
        expect(subject.upload.content_type).to eq('image/png') # doesn't change after raising
      end
    end
  end

  describe '#canonical_url' do
    context 'when enable_responsive_images feature flag is enabled' do
      before do
        allow(Rails.application.config).to receive(:enable_responsive_images).and_return(true)
      end

      context 'when content_type is not an image' do
        subject { FactoryGirl.create(:document, upload_content_type: 'text/html') }

        it 'gets original upload url' do
          expect(subject.upload).to receive(:url).with(nil).and_return('original-url')
          expect(subject.canonical_url).to eq('original-url')
        end
      end

      context 'when content_type is image' do
        subject { FactoryGirl.create(:document, upload_content_type: 'image/png') }

        it 'gets :xlarge upload url by default' do
          expect(subject.upload).to receive(:url).with(:xlarge).and_return('xlarge-url')
          expect(subject.canonical_url).to eq('xlarge-url')
        end

        it 'gets thumbnail size specified by parameter' do
          expect(subject.upload).to receive(:url).with(:humungous).and_return('humungous-url')
          expect(subject.canonical_url(:humungous)).to eq('humungous-url')
        end
      end
    end

    context 'when enable_responsive_images feature flag is disabled' do
      before do
        allow(Rails.application.config).to receive(:enable_responsive_images).and_return(false)
      end

      it 'gets upload url without specifying size' do
        expect(subject.upload).to receive(:url).with(nil).and_return('original-url')
        expect(subject.canonical_url(:example)).to eq('original-url')
      end
    end
  end
end
