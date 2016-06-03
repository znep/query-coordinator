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
          url: subject.upload.url(:xlarge)
        }
      }
      expect(subject.as_json).to eq(expected)
    end

    context 'when enable_responsive_images feature flag is enabled' do
      before do
        allow(Rails.application.config).to receive(:enable_responsive_images).and_return(true)
      end

      it 'gets :xlarge upload url' do
        expect(subject.upload).to receive(:url).with(:xlarge)
        subject.as_json
      end
    end

    context 'when enable_responsive_images feature flag is disabled' do
      before do
        allow(Rails.application.config).to receive(:enable_responsive_images).and_return(false)
      end

      it 'gets upload url without specifying size' do
        expect(subject.upload).to receive(:url).with(nil)
        subject.as_json
      end
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
end
