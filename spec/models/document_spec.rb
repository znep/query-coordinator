require 'rails_helper'

RSpec.describe Document, type: :model do

  it 'has a valid factory' do
    expect(FactoryGirl.build(:document)).to be_valid
  end

  it 'has an invalid factory' do
    expect(FactoryGirl.build(:invalid_document)).to be_invalid
  end

  it 'has a cropped document factory' do
    expect(FactoryGirl.build(:cropped_document)).to be_valid
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

    it 'validates format of direct_upload_url can match processed documents' do
      document = FactoryGirl.build(:document, direct_upload_url: "https://#{Rails.application.secrets.aws['s3_bucket_name']}.s3.amazonaws.com/documents/uploads/000/012/345/the_filename.png")
      expect(document).to be_valid
    end

    it 'validates format of direct_upload_url can match getty downloads' do
      getty_download_url = "https://delivery.gettyimages.com/xa/dv042026.jpg?v=1&c=IWSAsset&k=1&d=B0702ACFFBE708F3E32AD865C4CB39AB995A623514D7A20152CF0C4F759F9989E77939675E2577EF8C864288ADDCBDD0D43F79771C048EEC6F1C885B5FE9A28F7092CDF396C10819415F7F824A5A77B1B980A629CC59AD7B10989829E2D4C711CEA9959849DE1DAC83F0F0482FD9B98FD052240486A8E54E1CFA9C810B4FE089FEADD898285B2DBC376412CB77D27C75A6CA598F631F3351F6E3803DEF8F5F935B54498A3137EA5B8CD0497147BA98D9E250C21F1B91140AC5EE7759BE5180C3E076099C0176BB7A40B3B4102552C9BF&b=NkJG"
      document = FactoryGirl.build(:document, direct_upload_url: getty_download_url)
      expect(document).to be_valid
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

    it 'validates upload_content_type can be an image' do
      expect(FactoryGirl.build(:document, upload_content_type: 'image/png')).to be_valid
    end

    it 'validates upload_content_type can be an html document' do
      expect(FactoryGirl.build(:document, upload_content_type: 'text/html')).to be_valid
    end

    it 'validates that all cropping values are set or none' do
      document = FactoryGirl.build(:document, crop_x: 1)
      expect(document).to be_invalid
      expect(document.errors[:base]).to_not be_empty
      expect(document.errors[:base].first).to eq('all cropping values must be set if attempting to crop')
    end

    it 'validates that all cropping values are set or none' do
      document = FactoryGirl.build(:document, crop_x: nil, crop_y: nil, crop_height: nil, crop_width: nil)
      expect(document).to be_valid
    end

    it 'validates that crop_x is less than or equal to 1' do
      document = FactoryGirl.build(:document, crop_x: 1.00001)
      expect(document).to be_invalid
      expect(document.errors[:crop_x]).to_not be_empty
    end

    it 'validates that crop_x is greater than or equal to 0' do
      document = FactoryGirl.build(:document, crop_x: -0.1)
      expect(document).to be_invalid
      expect(document.errors[:crop_x]).to_not be_empty
    end

    it 'validates that crop_y is less than or equal to 1' do
      document = FactoryGirl.build(:document, crop_y: 1.00001)
      expect(document).to be_invalid
      expect(document.errors[:crop_y]).to_not be_empty
    end

    it 'validates that crop_y is greater than or equal to 0' do
      document = FactoryGirl.build(:document, crop_y: -0.1)
      expect(document).to be_invalid
      expect(document.errors[:crop_y]).to_not be_empty
    end

    it 'validates that crop_width is less than or equal to 1' do
      document = FactoryGirl.build(:document, crop_width: 1.00001)
      expect(document).to be_invalid
      expect(document.errors[:crop_width]).to_not be_empty
    end

    it 'validates that crop_width is greater than or equal to 0' do
      document = FactoryGirl.build(:document, crop_width: -0.1)
      expect(document).to be_invalid
      expect(document.errors[:crop_width]).to_not be_empty
    end

    it 'validates that crop_height is less than or equal to 1' do
      document = FactoryGirl.build(:document, crop_height: 1.00001)
      expect(document).to be_invalid
      expect(document.errors[:crop_height]).to_not be_empty
    end

    it 'validates that crop_height is greater than or equal to 0' do
      document = FactoryGirl.build(:document, crop_height: -0.1)
      expect(document).to be_invalid
      expect(document.errors[:crop_height]).to_not be_empty
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
    let(:subject) { FactoryGirl.build(:document) }

    it 'returns a hash of thumbnail sizes' do
      expected = {
        small: "346x346>",
        medium: "650x650>",
        large: "1300x1300>",
        xlarge: "2180x2180>"
      }
      expect(subject.attachment_styles_from_thumbnail_sizes).to eq(expected)
    end

    context 'when skip_thumbnail_generation is true' do
      let(:subject) { FactoryGirl.build(:document, skip_thumbnail_generation: true) }

      it 'returns empty hash' do
        expect(subject.attachment_styles_from_thumbnail_sizes).to be_empty
      end
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

    context 'when skip_thumbnail_generation is true' do
      let(:subject) { FactoryGirl.create(:document, skip_thumbnail_generation: true) }

      it 'gets original upload url' do
        expect(subject.upload).to receive(:url).with(nil).and_return('original-url')
        expect(subject.canonical_url).to eq('original-url')
      end
    end
  end

  describe '#cropping?' do
    context 'when all cropping fields are set' do
      subject { FactoryGirl.build(:cropped_document) }

      it 'is true' do
        expect(subject.cropping?).to eq(true)
      end
    end

    context 'when 1 cropping field is not set' do
      subject { FactoryGirl.build(:cropped_document, crop_x: nil) }

      it 'is false' do
        expect(subject.cropping?).to eq(false)
      end
    end

    context 'when none of the cropping fields are set' do
      subject { FactoryGirl.build(:cropped_document, crop_x: nil, crop_y: nil, crop_width: nil, crop_height: nil) }

      it 'is false' do
        expect(subject.cropping?).to eq(false)
      end
    end
  end

  describe '#regenerate_thumbnails' do
    subject { FactoryGirl.create(:document) }

    it 'calls `reprocess!` on `upload`' do
      expect(subject.upload).to receive(:reprocess!)
      subject.regenerate_thumbnails!
    end
  end
end
