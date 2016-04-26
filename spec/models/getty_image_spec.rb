require 'rails_helper'

RSpec.describe GettyImage, type: :model do
  let(:getty_id) { '349030' }

  let(:url) { 'https://hello.world' }
  let(:upload) { double('upload', :url => url) }
  let(:status) { 1 }
  let(:document) { FactoryGirl.create(:document, :status => status) }

  let(:domain_id) { 20 }
  let(:downloading) { false }
  let(:created_by) { 'four-four' }

  let(:attributes) do
    {
      'getty_id' => getty_id,
      'domain_id' => domain_id,
      'document_id' => document.id,
      'downloading' => downloading,
      'created_by' => created_by
    }
  end

  let(:subject) { GettyImage.new(attributes) }

  it 'sets getty_id from attributes' do
    expect(subject.getty_id).to eq(getty_id)
  end

  it 'sets document_id from attributes' do
    expect(subject.document_id).to eq(document.id)
  end

  it 'sets domain_id from attributes' do
    expect(subject.domain_id).to eq(domain_id)
  end

  it 'sets downloading from attributes' do
    expect(subject.downloading).to eq(false)
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
      it 'returns a URL' do
        expect(subject.url).to eq(document.upload.url)
      end
    end

    describe 'with an invalid document' do
      let(:status) { 0 }

      let(:uri) { 'https://not-this-day.com' }
      let(:metadata) do
        [{
          'display_sizes' => [{
            'uri' => uri
          }]
        }]
      end

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

        it 'returns nothing' do
          expect(subject.url).to be_nil
        end
      end
    end
  end

  describe '#download' do
    let(:create) { true }
    let(:create_document_document) { FactoryGirl.create(:document) }
    let(:create_document) { spy('create_document', :create => create, :document => create_document_document) }
    let(:current_domain) { {'id': domain_id} }
    let(:download_parameters) { {} }
    let(:story_uid) { 'four-four' }
    let(:user) do
      {
        'id' => 'four-four'
      }
    end

    before do
      allow(CoreServer).to receive(:current_domain).and_return(current_domain)
      allow(CreateDocument).to receive(:new).and_return(create_document)
      allow(subject).to receive(:download_parameters).and_return(download_parameters)
    end

    describe 'when the document is already associated with the model' do
      it 'returns' do
        expect(subject.download(user, story_uid)).to be_nil
        expect(CreateDocument).to_not have_received(:new)
      end
    end

    describe 'when a new document creation is started' do
      let(:attributes) do
        {
          'getty_id' => getty_id,
          'domain_id' => domain_id,
          'downloading' => downloading,
          'created_by' => created_by
        }
      end

      describe 'when the document creation fails' do
        let(:create) { false }

        it 'raises' do
          expect { subject.download(user, story_uid) }.to raise_error(/Failed to create a new document/)
        end
      end

      describe 'when document creation succeeds' do
        let(:create) { true }

        describe 'when saving fails' do
          before do
            allow(subject).to receive(:save!).and_return(false)
          end

          it 'raises' do
            expect { subject.download(user, story_uid) }.to raise_error(/GettyImage failed to persist to the database/)
          end
        end

        describe 'when saving succeeds' do
          let(:perform_later_spy) { spy('perform_later') }

          before do
            allow(ProcessDocumentJob).to receive(:perform_later).and_return(perform_later_spy)
            allow(subject).to receive(:save!).and_return(true)
          end

          it 'returns a ProcessDocumentJob' do
            subject.download(user, story_uid)
            expect(ProcessDocumentJob).to have_received(:perform_later)
          end
        end
      end
    end
  end
end
