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
          url: subject.upload.url
        }
      }
      expect(subject.as_json).to eq(expected)
    end
  end
end
