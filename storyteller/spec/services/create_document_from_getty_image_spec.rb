require 'rails_helper'

RSpec.describe CreateDocumentFromGettyImage do

  it 'raises when no params' do
    expect { CreateDocumentFromGettyImage.new }.to raise_error(ArgumentError, /given 0, expected \d/)
  end

  let(:document) { FactoryGirl.create(:document) }
  let(:getty_image) { FactoryGirl.create(:getty_image, document: document) }
  let(:params) { FactoryGirl.attributes_for(:document).except(:created_by).merge(getty_image_id: getty_image.getty_id) }
  let(:user) { mock_valid_user }

  let(:subject) { CreateDocumentFromGettyImage.new(user, params) }

  before do
    allow(GettyImage).to receive(:find_or_initialize_by).with(getty_id: params[:getty_image_id]).and_return(getty_image)
  end

  it 'validates presence of id in user object' do
    invalid_user = mock_valid_user.tap{|user| user['id'] = nil }
    expect { CreateDocumentFromGettyImage.new(invalid_user, params) }.to raise_error(ArgumentError)
  end

  it 'validates presence of user object' do
    expect { CreateDocumentFromGettyImage.new(nil, params) }.to raise_error(ArgumentError)
  end

  it 'validates presence of getty_image_id in user object' do
    expect { CreateDocumentFromGettyImage.new(user, params.except(:getty_image_id)) }.to raise_error(ArgumentError)
  end

  it 'validates presence of story_uid in user object' do
    expect { CreateDocumentFromGettyImage.new(user, params.except(:story_uid)) }.to raise_error(ArgumentError)
  end

  it 'validates presence of story_uid in user object' do
    expect { CreateDocumentFromGettyImage.new(user, nil) }.to raise_error(ArgumentError)
  end

  it 'forces a download and reload of the getty_image' do
    expect(getty_image).to receive(:download!).with(user, params[:story_uid], process_immediately: true, skip_thumbnail_generation: true)
    expect(getty_image).to receive(:reload)

    subject
  end

  it 'initializes a new document from params and getty image' do
    allow(getty_image).to receive(:document).and_return(document)
    allow(document).to receive(:canonical_url).with(:original).and_return('MOCK_URL')

    new_document = subject.document
    expect(new_document).to be_a(Document)
    %w(:upload_file_name, :upload_file_size, :upload_content_type,
        :story_uid, :crop_x, :crop_y, :crop_width, :crop_height).each do |attr|
      expect(new_document[attr]).to eq(params[attr])
    end
    expect(new_document.created_by).to eq(user['id'])
    expect(new_document.direct_upload_url).to eq('MOCK_URL')
  end

  describe '#create' do
    context 'with valid document attributes' do
      before do
        allow(subject.document).to receive(:save).and_return(true)
      end

      it 'returns true' do
        expect(subject.create).to eq(true)
      end

      it 'queues ProcessDocumentJob' do
        expect(ProcessDocumentJob).to receive(:perform_later).with(subject.document.id)
        subject.create
      end
    end

    context 'when document save fails' do
      before do
        allow(subject.document).to receive(:save).and_return(false)
      end

      it 'returns false' do
        expect(subject.create).to eq(false)
      end

      it 'does not queue ProcessDocumentJob' do
        expect(ProcessDocumentJob).to_not receive(:perform_later)
        subject.create
      end
    end
  end
end
