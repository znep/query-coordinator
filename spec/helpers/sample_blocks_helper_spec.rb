require 'rails_helper'

RSpec.describe SampleBlocksHelper, type: :helper do
  let(:sample_blocks) { generate_sample_blocks }

  it 'returns an array of objects' do
    expect(sample_blocks).to be_kind_of(Array)
    expect(sample_blocks[0]).to be_kind_of(Object)
  end

  it 'returns valid blocks' do
    block_instance = Block.new(sample_blocks[0])
    expect(block_instance.valid?).to be true
  end

  it 'returns translated blocks' do
    expect(I18n).to receive(:t)
    generate_sample_blocks
  end

end
