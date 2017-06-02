RSpec.describe StoryMetadata do
  class SubjectClass
    include StoryMetadata
    attr_accessor(:metadata)

    def initialize(metadata)
      @metadata = metadata
    end
  end

  subject do
    SubjectClass.new(metadata)
  end

  shared_examples 'metadata accessor' do |method, attribute = method|
    let(:attribute_value) { 'something' }
    let(:metadata) do
      {
        attribute => attribute_value
      }
    end

    it "##{method} returns metadata attribute #{attribute}" do
      expect(subject.send(method)).to eq(attribute_value)
    end
  end

  it_behaves_like 'metadata accessor', :title
  it_behaves_like 'metadata accessor', :uid
  it_behaves_like 'metadata accessor', :description
  it_behaves_like 'metadata accessor', :tile_config
  it_behaves_like 'metadata accessor', :grants
  it_behaves_like 'metadata accessor', :permissions
  it_behaves_like 'metadata accessor', :owner_id

  describe '#public?' do
    subject do
      SubjectClass.new(
        permissions: { isPublic: public }
      ).public?
    end
    describe 'public story' do
      let(:public) { true }
      it 'returns true' do
        expect(subject).to be_truthy
      end
    end
    describe 'private story' do
      let(:public) { false }
      it 'returns false' do
        expect(subject).to be_falsy
      end
    end
  end
end
