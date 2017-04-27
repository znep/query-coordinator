require 'rails_helper'

RSpec.describe BlockComponentsMigration, type: :model do

  it 'has a valid factory' do
    expect(FactoryGirl.build(:block_components_migration)).to be_valid
  end

  describe '#from_block' do
    let(:block) { FactoryGirl.create(:block) }
    let(:result) { BlockComponentsMigration.from_block(block) }

    it 'sets original_components from block' do
      expect(result.original_components).to eq(block.components)
    end

    it 'sets keeps reference to block' do
      expect(result.block).to eq(block)
    end

    it 'does not save returned object' do
      expect(result).to_not be_persisted
    end
  end
end
