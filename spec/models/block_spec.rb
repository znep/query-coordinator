require 'rails_helper'

RSpec.describe Block, type: :model do

  let(:subject) { FactoryGirl.build(:block) }

  describe 'immutability' do

    context 'when it has not been saved' do

      it 'can be saved once' do
        expect(subject.save).to eq(true)
      end

      it 'cannot be saved twice' do
        expect(subject.save).to eq(true)
        expect {
          subject.save
        }.to raise_error(ActiveRecord::ReadOnlyRecord)
      end
    end
  end

  describe '.serializable_attributes' do
    it 'returns correct attributes' do
      valid_block = FactoryGirl.build(:block)
      expect(valid_block.serializable_attributes).to eq(
        'layout' => '12',
        'created_at' => nil,
        'created_by' => 'test_user@socrata.com',
        'deleted_at' => nil,
        'updated_at' => nil,
        'components' => [
          { 'type' => 'html', 'value' => 'Hello, world!' }
        ]
      )
    end
  end

  describe '.as_json' do
    it 'returns a correct object' do
      valid_block = FactoryGirl.build(:block)
      expect(valid_block.serializable_attributes).to eq(
        'layout' => '12',
        'created_at' => nil,
        'created_by' => 'test_user@socrata.com',
        'deleted_at' => nil,
        'updated_at' => nil,
        'components' => [
          { 'type' => 'html', 'value' => 'Hello, world!' }
        ]
      )
    end
  end

  describe 'validations' do

    it 'has a valid factory' do
      valid_block = FactoryGirl.build(:block)
      expect(valid_block).to be_valid
    end

    it 'does not allow a null value for :layout' do
      invalid_block = FactoryGirl.build(:block, layout: nil)
      expect(invalid_block).to_not be_valid
      expect(invalid_block.errors[:layout].length).to eq(2)
    end

    Block::VALID_BLOCK_LAYOUTS.each do |layout_name|
      it "allows '#{layout_name}' as valid for :layout" do
        valid_block = FactoryGirl.build(:block, layout: layout_name)
        expect(valid_block).to be_valid
      end
    end

    it 'does not allow an invalid value for :layout' do
      invalid_block = FactoryGirl.build(:block, layout: '0')
      expect(invalid_block).to_not be_valid
      expect(invalid_block.errors[:layout].length).to eq(1)
    end

    it 'does not allow a null value for :components' do
      invalid_block = FactoryGirl.build(:block, components: nil)
      expect(invalid_block).to_not be_valid
      expect(invalid_block.errors[:components].length).to eq(1)
    end

    it 'does not allow a null value for :created_by' do
      invalid_block = FactoryGirl.build(:block, created_by: nil)
      expect(invalid_block).to_not be_valid
      expect(invalid_block.errors[:created_by].length).to eq(1)
    end
  end
end
