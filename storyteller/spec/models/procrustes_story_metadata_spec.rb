RSpec.describe ProcrustesStoryMetadata do
  let(:uid) { 'test-goal' }
  let(:is_public) { true }
  let(:title) { 'some title' }
  let(:description) { 'descriptive' }

  let(:goal) do
    double(
      OpenPerformance::Goal,
      :uid => uid,
      :public? => is_public,
      :title => title,
      :description => description
    )
  end

  subject do
    ProcrustesStoryMetadata.new(goal)
  end

  it 'returns true for goal?' do
    expect(subject.goal?).to be_truthy
  end

  shared_examples 'metadata setter' do
    it 'sets metadata' do
      expect(subject.metadata).to eq(
        uid: uid,
        title: title,
        description: description,
        tile_config: {},
        grants: {},
        permissions: {
          isPublic: is_public
        },
        owner_id: nil
      )
    end
  end

  it_behaves_like 'metadata setter'

  # Paranoia, check for accidental hardcoding
  describe 'different field values' do
    let(:uid) { 'some-thing' }
    let(:is_public) { false }
    let(:title) { 'some other title' }
    let(:description) { 'even more descriptive' }

    it_behaves_like 'metadata setter'
  end
end
