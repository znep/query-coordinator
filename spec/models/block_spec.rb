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

  describe '#for_story' do
    let(:story) { FactoryGirl.create(:draft_story) }
    let(:result) { Block.for_story(story) }

    it 'returns ActiveRecord::Relation' do
      expect(result).to be_a(ActiveRecord::Relation)
    end

    context 'when story has no blocks' do
      let(:story) { FactoryGirl.create(:draft_story) }

      it 'has returns 0 items' do
        expect(result.size).to eq(0)
      end
    end

    context 'when story has blocks' do
      let(:story) { FactoryGirl.create(:draft_story_with_blocks) }

      it 'has returns number of blocks in story' do
        expect(result.size).to eq(story.block_ids.size)
      end

      it 'returns blocks for the block_ids in the story' do
        block_ids = story.block_ids.sort
        expect(result.map(&:id).sort).to eq(block_ids)
      end
    end
  end

  describe '#with_component_type' do
    let(:component_type) { 'blah' }
    let!(:block) { FactoryGirl.create(:block) }
    let!(:block_with_image) { FactoryGirl.create(:block_with_image) }
    let(:result) { Block.with_component_type(component_type) }

    it 'returns ActiveRecord::Relation' do
      expect(result).to be_a(ActiveRecord::Relation)
    end

    context 'for component_type not in any block' do
      let(:component_type) { 'thisisafunkycomponenttype' }

      it 'returns empty results' do
        expect(result.size).to eq(0)
      end
    end

    context 'for component_type in blocks' do
      let(:component_type) { 'image' }

      it 'returns blocks containing image' do
        expect(result.size).to eq(1)
        expect(result.first).to eq(block_with_image)
      end
    end
  end

  # TODO tests for as_json and from_json
  describe '#from_json' do
    describe 'html components' do
      # TODO: Figure out a way to share this properly with spec/features/xss_protection_spec.rb
      let(:html_component_attacks) do
        [
          '<script>window.xssFailure = "simple script tag injection"</script>',
          '</script><script>window.xssFailure="premature script close"</script>',
          '<img src="javascript:window.xssFailure = \'img src script injection\'">',
          '<IMG """><SCRIPT>window.xssFailure = "malformed IMG tag script injection"</SCRIPT>">',
          '<<SCRIPT>window.xssFailure = "extraneous open brackets script injection";//<</SCRIPT>',
          '<BODY onload="window.xssFailure=\'body.onload event injection\'">',
          '<DIV STYLE="width: expression(window.xssFailure=\'style expression script injection\');">',
          '<!--[if gte IE 4]>\n<SCRIPT>window.xssFailure = "ie comment conditional script injection"</SCRIPT>\n<![endif]-->'
        ]
      end

      let(:html_component_attacks_sanitized) do
        [
          'window.xssFailure = "simple script tag injection"',
          'window.xssFailure="premature script close"',
          '',
          'window.xssFailure = "malformed IMG tag script injection""&gt;',
          '&lt;window.xssFailure = "extraneous open brackets script injection";//&lt;',
          '',
          '',
          ''
        ]
      end

      let(:html_component_sanitizations) do
        Hash[html_component_attacks.zip(html_component_attacks_sanitized)]
      end

      it 'are sanitized properly' do
        html_component_sanitizations.each do |attack_markup, sanitized_markup|
          sanitized_block = Block.from_json({
            layout: 12,
            components: [ { type: 'html', value: attack_markup } ],
            created_by: 'test_user@socrata.com'
          })

          expect(sanitized_block.components.first['value']).to eq(sanitized_markup)
        end
      end
    end
  end
end
