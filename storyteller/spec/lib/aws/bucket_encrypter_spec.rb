require 'rails_helper'

RSpec.describe Aws::BucketEncrypter do
  let(:environment) { 'staging' }
  let(:region) { 'us-west-2' }
  let(:bucket) { 'bucket-name' }

  let(:subject) { Aws::BucketEncrypter.new(bucket: bucket, environment: environment, region: region) }

  describe '#new' do
    it 'accepts args' do
      expect {
        Aws::BucketEncrypter.new(bucket: bucket, environment: environment, region: region)
      }.to_not raise_error
    end

    context 'with invalid environment' do
      let(:environment) { 'zoo' }

      it 'fails on initialization' do
        expect {
          Aws::BucketEncrypter.new(bucket: bucket, environment: environment, region: region)
        }.to raise_error(ArgumentError)
      end
    end

    context 'with invalid region' do
      let(:region) { 'southwest' }

      it 'fails on initialization' do
        expect {
          Aws::BucketEncrypter.new(bucket: bucket, environment: environment, region: region)
        }.to raise_error(ArgumentError)
      end
    end

    it 'removes AWS env vars that cause conflicts' do
      expect(ENV).to receive(:delete).with('AWS_S3_BUCKET_NAME')
      expect(ENV).to receive(:delete).with('AWS_ACCESS_KEY_ID')
      expect(ENV).to receive(:delete).with('AWS_SECRET_KEY')

      Aws::BucketEncrypter.new(bucket: bucket, environment: environment, region: region)
    end
  end

  describe '#encrypt' do
    let(:system_return_value) { true }

    before(:each) do
      allow(subject).to receive(:system).and_return(system_return_value)
    end

    describe 'when successful' do
      it 'calls system with aws command' do
        expected = "aws s3 cp --region #{region} --profile #{environment} --recursive --sse --acl public-read s3://#{bucket} s3://#{bucket}"
        expect(subject).to receive(:system).with(expected)
        subject.encrypt
      end
    end

    describe 'when failed' do
      let(:system_return_value) { false }

      it 'throws a "Command failed" error' do
        expect { subject.encrypt }.to raise_error(/Command failed/)
      end
    end
  end
end
