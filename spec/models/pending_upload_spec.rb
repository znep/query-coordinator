require 'rails_helper'

RSpec.describe PendingUpload, type: :model do
  let(:filename) { 'testfile.png' }

  subject { PendingUpload.new(filename) }

  describe '#initialize' do

    it 'sets filename attribute' do
      expect(subject.filename).to eq(filename)
    end

    it 'sets content type from filename' do
      expect(subject.content_type).to eq('image/png')
    end

    context 'with jpeg file' do
      let(:filename) { 'trolly-mc-trollington.jpeg' }

      it 'sets content_type to image/jpeg' do
        expect(subject.content_type).to eq('image/jpeg')
      end
    end

  end

  describe '#url' do

    it 'creates url for new s3 object' do
      mock_result = 'the_resulting_url_from_s3_magic'

      mock_s3_object = double('mock_s3_object')
      mock_buckets = double('mock_buckets')
      mock_bucket = double('mock_bucket')
      mock_objects = double('mock_objects')

      expect(SecureRandom).to receive(:uuid).and_return('a_random_string')
      expect(AWS::S3).to receive_message_chain(:new, :buckets).and_return(mock_buckets)
      expect(mock_buckets).to receive(:[]).with(Rails.application.secrets.aws['s3_bucket_name']).and_return(mock_bucket)
      expect(mock_bucket).to receive(:objects).and_return(mock_objects)
      expect(mock_objects).to receive(:[]).with("uploads/a_random_string/#{filename}").and_return(mock_s3_object)
      expect(mock_s3_object).to receive(:url_for).with(:write, content_type: 'image/png', acl: :public_read).and_return(mock_result)

      expect(subject.url).to eq(mock_result)
    end
  end
end
