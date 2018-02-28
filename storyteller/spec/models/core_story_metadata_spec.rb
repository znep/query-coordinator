RSpec.describe CoreStoryMetadata do
  let(:uid) { 'test-stry' }
  let(:is_public) { true }
  let(:title) { 'some title' }
  let(:description) { 'descriptive' }
  let(:tile_config) { { 'foo' => 'bar' } }
  let(:owner_id) { 'awes-omes' }
  let(:is_public) { true }
  let(:grants) do
    if is_public
      [ { 'flags' => [ 'public' ] } ]
    else
      []
    end
  end

  before do
    allow(CoreServer).to receive(:get_view).with(uid).and_return(
      'name' => title,
      'description' => description,
      'metadata' => {
        'tileConfig' => tile_config
      },
      'grants' => grants,
      'owner' => { 'id' => owner_id }
    )

    stub_approvals_settings
  end

  subject do
    CoreStoryMetadata.new(uid)
  end

  it 'returns false for goal?' do
    expect(subject.goal?).to be_falsy
  end

  shared_examples 'metadata setter' do
    it 'sets metadata' do
      expect(subject.metadata).to eq(
        uid: uid,
        title: title,
        description: description,
        tile_config: tile_config,
        grants: grants,
        permissions: {
          isPublic: is_public
        },
        owner_id: owner_id
      )
    end
  end

  it_behaves_like 'metadata setter'

  # Paranoia, check for accidental hardcoding
  describe 'different field values' do
    let(:uid) { 'some-thng' }
    let(:is_public) { false }
    let(:title) { 'some other title' }
    let(:description) { 'even more descriptive' }
    let(:tile_config) { { 'baz' => 'bop' } }
    let(:owner_id) { 'owne-rrrr' }

    it_behaves_like 'metadata setter'
  end
end
