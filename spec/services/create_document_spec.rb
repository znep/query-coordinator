require 'rails_helper'

RSpec.describe CreateDocument do

  it 'raises when no params' do
    expect { CreateDocument.new }.to raise_error(ArgumentError, /0 for 2/)
  end

  # skipping :created_by because it's set manually
  let(:params) { FactoryGirl.attributes_for(:document).except(:created_by) }
  let(:user) { mock_valid_user }

  subject { CreateDocument.new(user, params) }

  it 'initializes a new document from params' do
    document = subject.document
    expect(document).to be_a(Document)
    params.each do |key, value|
      expect(document[key]).to eq(value)
    end
  end

  context 'when user is not valid' do
    let(:user) { mock_valid_user.tap{|user| user['id'] = nil } }

    it 'validates presence of id in user object' do
      expect { CreateDocument.new(user, params) }.to raise_error(ArgumentError)
    end
  end

  it 'sets created_by to user uid' do
    subject.create
    expect(subject.document.created_by).to eq(user['id'])
  end

  describe '#create' do

    context 'with valid document attributes' do

      it 'saves document' do
        expect { subject.create }.to change{ Document.count }.by(1)
      end

      it 'returns true' do
        expect(subject.create).to eq(true)
      end

      it 'queues ProcessDocumentJob' do
        class_spy('ProcessDocumentJob').as_stubbed_const
        subject.create
        expect(ProcessDocumentJob).to have_received(:perform_later).with(subject.document)
      end
    end

    context 'with invalid document attributes' do

      let(:params) { attributes_for(:invalid_document) }

      it 'does not save document' do
        expect { subject.create }.to_not change { Document.count }
      end

      it 'returns false' do
        expect(subject.create).to eq(false)
      end

      it 'does not queue ProcessDocumentJob' do
        class_spy('ProcessDocumentJob').as_stubbed_const
        subject.create
        expect(ProcessDocumentJob).to_not have_received(:perform_later)
      end
    end
  end
end
