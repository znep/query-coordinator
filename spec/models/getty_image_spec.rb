require 'rails_helper'

RSpec.describe GettyImage, type: :model do
  let(:getty_id) { '349030' }

  let(:url) { 'https://hello.world' }
  let(:upload) { double('upload', :url => url) }
  let(:status) { 1 }
  let(:document) { FactoryGirl.create(:document, :status => status) }

  let(:domain_id) { 20 }
  let(:created_by) { 'four-four' }

  let(:attributes) do
    {
      'getty_id' => getty_id,
      'domain_id' => domain_id,
      'document_id' => document.id,
      'created_by' => created_by
    }
  end

  let(:subject) { GettyImage.new(attributes) }

  it 'has a valid factory' do
    expect(FactoryGirl.build(:getty_image)).to be_valid
  end

  it 'sets getty_id from attributes' do
    expect(subject.getty_id).to eq(getty_id)
  end

  it 'sets document_id from attributes' do
    expect(subject.document_id).to eq(document.id)
  end

  it 'sets domain_id from attributes' do
    expect(subject.domain_id).to eq(domain_id)
  end

  describe 'created_by' do
    it 'sets created_by from attributes' do
      expect(subject.created_by).to eq(created_by)
    end

    describe 'with a valid four-four and calling #valid?' do
      it 'returns true' do
        expect(subject.valid?).to eq(true)
      end
    end

    describe 'with an invalid four-four and valid #valid?' do
      it 'returns false' do
        subject.created_by = 'three-three'
        expect(subject.valid?).to eq(false)
      end
    end
  end

  describe '#url' do
    describe 'with a valid document' do
      context 'when enable_responsive_images feature flag is enabled' do
        before do
          allow(Rails.application.config).to receive(:enable_responsive_images).and_return(true)
        end

        it 'returns an xlarge thumbnail url' do
          expect(subject.document.upload).to receive(:url).with(:xlarge).and_return(:xlarge_url)
          expect(subject.url).to eq(:xlarge_url)
        end
      end

      context 'when enable_responsive_images feature flag is disabled' do
        before do
          allow(Rails.application.config).to receive(:enable_responsive_images).and_return(false)
        end

        it 'returns a URL without specified size' do
          expect(subject.document.upload).to receive(:url).with(nil).and_return(:original_url)
          expect(subject.url).to eq(:original_url)
        end
      end
    end

    describe 'with an invalid document' do
      let(:status) { 0 }

      let(:uri) { 'https://not-this-day.com' }
      let(:metadata) { [{ 'display_sizes' => [{ 'uri' => uri }] }] }

      let(:execute) { double('execute', :[] => metadata) }
      let(:with_ids) { double('with_ids', :execute => execute) }
      let(:images) { spy('images', :query_params => {}, :with_ids => with_ids) }
      let(:connect_sdk) { double('connect_sdk', :images => images) }

      before do
        allow(ConnectSdk).to receive(:new).and_return(connect_sdk)
      end

      describe 'when ConnectSdk succeeds' do
        it 'returns a url' do
          expect(subject.url).to eq(uri)
        end

        it 'caches the url' do
          # Call once to cache in an instance variable.
          subject.url
          # Use the cached result
          subject.url

          expect(images).to have_received(:query_params).once
        end
      end

      describe 'when ConnectSdk fails' do
        let(:metadata) { nil }

        before do
          allow(AirbrakeNotifier).to receive(:report_error)
          allow(with_ids).to receive(:execute).and_raise
        end

        it 'returns nothing' do
          expect(subject.url).to be_nil
        end

        it 'causes an Airbrake' do
          subject.url
          expect(AirbrakeNotifier).to have_received(:report_error)
        end
      end
    end
  end

  describe '#download!' do
    let(:create) { true }
    let(:create_document_document) { FactoryGirl.create(:document) }
    let(:create_document) { spy('create_document', :create => create, :document => create_document_document) }
    let(:current_domain) { {'id' => domain_id} }
    let(:download_parameters) { {} }
    let(:story_uid) { 'four-four' }
    let(:user) { {'id' => 'four-four'} }

    before do
      allow(CoreServer).to receive(:current_domain).and_return(current_domain)
      allow(CreateDocument).to receive(:new).and_return(create_document)
      allow(subject).to receive(:download_parameters).and_return(download_parameters)
    end

    describe 'when the document is already associated with the model' do
      it 'returns' do
        expect(subject.download!(user, story_uid)).to be_nil
        expect(CreateDocument).to_not have_received(:new)
      end
    end

    describe 'when a new document creation is started' do
      let(:attributes) do
        {
          'getty_id' => getty_id,
          'domain_id' => domain_id,
          'created_by' => created_by
        }
      end

      describe 'when the document creation fails' do
        let(:create) { false }

        it 'raises' do
          expect { subject.download!(user, story_uid) }.to raise_error(/Failed to create a new document/)
        end
      end

      describe 'when document creation succeeds' do
        let(:create) { true }

        describe 'when saving fails' do
          before do
            allow(subject).to receive(:save!).and_raise('saving failed')
          end

          it 'raises' do
            expect { subject.download!(user, story_uid) }.to raise_error(/saving failed/)
          end
        end

        describe 'when saving succeeds' do
          let(:mock_perform) { double('perform') }

          before do
            allow(ProcessDocumentJob).to receive(:perform_later).and_return(mock_perform)
            allow(ProcessDocumentJob).to receive(:perform_now).and_return(mock_perform)
            allow(subject).to receive(:save!)
          end

          it 'ProcessDocumentJob receives :perform_later' do
            subject.download!(user, story_uid)
            expect(ProcessDocumentJob).to have_received(:perform_later)
            expect(ProcessDocumentJob).to_not have_received(:perform_now)
          end

          it 'ProcessDocumentJob receives :perform_now' do
            subject.download!(user, story_uid, process_immediately: true)
            expect(ProcessDocumentJob).to have_received(:perform_now)
            expect(ProcessDocumentJob).to_not have_received(:perform_later)
          end
        end

      end
    end
  end
end
