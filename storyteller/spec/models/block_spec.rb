require 'rails_helper'

RSpec.describe Block, type: :model do

  let(:subject) { FactoryGirl.build(:block) }

  describe 'when initialized' do

    context 'when Rails has deeply munged a VIF filters value from an empty array to nil' do

      it 'correctly resets the value to an empty array' do
        test_components = [
          {
            type: 'socrata.visualizations.regionMap',
            value: {
              dataset: {
                datasetUid: 'test-test',
                domain: 'example.com'
              },
              originalUid: nil,
              vif: {
                aggregation: {
                  field: nil,
                  function: 'count'
                },
                columnName: 'incident_location',
                configuration: {
                  computedColumn: ':@computed_region_mash_apes',
                  localization: {}
                },
                createdAt: '2016-01-07T22:40:46.968Z',
                datasetUid: 'test-test',
                description: '',
                domain: 'example.com',
                filters: nil,
                format: {
                  type: 'visualization_interchange_format',
                  version: 1
                },
                origin: {
                  type: 'data_lens_add_visualization_component',
                  url: 'https://example.com/view/test-test'
                },
                title: 'Incident Location',
                type: 'regionMap',
                unit: {
                  one: 'row',
                  other: 'rows'
                }
              }
            }
          }
        ]

        new_block = Block.new(layout: 12, components: test_components, created_by: 'test@example.com')

        expect(new_block.components[0]['value']['vif']['filters'].is_a?(Array)).to eq(true)
      end
    end

    context 'when Rails has deeply munged VIF2 filters from an empty array to nil' do
      it 'correctly resets the filters to an empty array' do
        test_components = [
          {
            type: 'socrata.visualization.columnChart',
            value: {
              vif: {
                format: {
                  version: 2
                },
                series: [
                  {
                    dataSource: {
                      filters: nil
                    }
                  },
                  {
                    dataSource: {
                      filters: nil
                    }
                  }
                ]
              }
            }
          }
        ]

        new_block = Block.new(layout: 12, components: test_components, created_by: 'test@example.com')

        expect(new_block.components[0]['value']['vif']['series'][0]['dataSource']['filters'].is_a?(Array)).to eq(true)
        expect(new_block.components[0]['value']['vif']['series'][1]['dataSource']['filters'].is_a?(Array)).to eq(true)
      end
    end

    context 'when the block contains a classic visualization' do

      context 'when the metadata does not include the "renderTypeConfig" subtree' do
        let(:view) {
          {'metadata' => {}}
        }

        before do
          allow(CoreServer).to receive(:get_view).and_return(view)
        end

        it 'replaces the component sub-value, "visualization", with a fresh copy from api/views' do
          test_components = [
            {
              type: 'socrata.visualization.classic',
              value: {
                originalUid: 'four-four'
              }
            }
          ]

          new_block = Block.new(layout: 12, components: test_components, created_by: 'test@example.com')

          expect(new_block.components[0]['value']['visualization'].to_json).to match(/table":false/)
        end
      end

      context 'when the metadata includes the "renderTypeConfig" subtree' do
        let(:display_type) { 'chart' }
        let(:view) {
          {
            'name' => 'the updated view name',
            'displayType' => display_type,
            'metadata' => {'renderTypeConfig' => {'visible' => {'table' => true, 'chart' => true}}}}
        }

        let(:test_components) do
          [
            {
              type: 'socrata.visualization.classic',
              value: {
                originalUid: 'four-four'
              }
            }
          ]
        end

        subject(:new_block) do
          Block.new(layout: 12, components: test_components, created_by: 'test@example.com')
        end

        before do
          allow(CoreServer).to receive(:get_view).and_return(view)
        end

        it 'replaces the component sub-value, "visualization", with a fresh copy from api/views' do
          expect(new_block.components[0]['value']['visualization']['name']).to eq('the updated view name')
          expect(new_block.components[0]['value']['visualization'].to_json).to match(/chart":true/)
        end

        context 'the visualization is not a table' do
          it 'hides the table' do
            expect(new_block.components[0]['value']['visualization'].to_json).to match(/table":false/)
          end
        end

        context 'the visualization is a table' do
          let(:display_type) { 'table' }
          it 'keeps the table' do
            expect(new_block.components[0]['value']['visualization'].to_json).to match(/table":true/)
          end
        end
      end
    end
  end

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
        ],
        'presentable' => true
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
        ],
        'presentable' => true
      )
    end
  end

  describe 'validations' do

    it 'has a valid factory' do
      valid_block = FactoryGirl.build(:block)
      expect(valid_block).to be_valid
    end

    it 'has an invalid factory' do
      expect(FactoryGirl.build(:invalid_block)).to be_invalid
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
    let!(:block) { FactoryGirl.create(:block, components: [{type: 'fakeType'}]) }
    let!(:block_with_another_fake_type) { FactoryGirl.create(:block, components: [{type: 'anotherFakeType'}]) }
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
      let(:component_type) { 'fakeType' }

      it 'returns blocks containing fakeType' do
        expect(result.size).to eq(1)
        expect(result.first).to eq(block)
      end
    end

    context 'when passing multiple component types' do
      let(:result) { Block.with_component_type('fakeType', 'missing') }

      it 'returns blocks containing image' do
        expect(result.size).to eq(1)
        expect(result.first).to eq(block)
      end

      context 'when all component types exist in blocks' do
        let(:result) { Block.with_component_type('fakeType', 'anotherFakeType') }

        it 'returns blocks containing fakeType and anotherFakeType' do
          expect(result.size).to eq(2)
          expect(result.first).to eq(block)
          expect(result.second).to eq(block_with_another_fake_type)
        end
      end
    end
  end

  describe '.from_json' do
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
          '<div></div>',
          ''
        ]
      end

      let(:html_component_sanitizations) do
        Hash[html_component_attacks.zip(html_component_attacks_sanitized)]
      end

      let(:image_url) do
        'https://media.giphy.com/media/Bk1tJSiem5hEk/giphy.gif'
      end

      it 'are sanitized properly' do
        html_component_sanitizations.each do |attack_markup, sanitized_markup|
          sanitized_block = Block.from_json({
            layout: '6-6',
            components: [
              { type: 'html', value: attack_markup },
              { type: 'image', url: image_url }
            ],
            created_by: 'test_user@socrata.com'
          })

          expect(sanitized_block.components[0]['value']).to eq(sanitized_markup)
          expect(sanitized_block.components[1]['url']).to eq(image_url)
        end
      end

      let(:valid_html_tags) do
        alignable_tags = %w( div h1 h2 h3 h4 h5 h6 blockquote )
        basic_tags = %w( b i p )
        list_tags = %w( ol ul )
        closed_tags = %w( br )

        alignable_tags.collect { |tag| "<#{tag} class=\"align-left\" style=\"text-align: left\">some #{tag}</#{tag}>" } +
          basic_tags.collect { |tag| "<#{tag}>some #{tag}</#{tag}>" } +
          list_tags.collect { |tag| "<#{tag}><li class=\"align-left\" style=\"text-align: left\">item in #{tag}</li></#{tag}>" } +
          closed_tags.collect { |tag| "<#{tag}>" } +
          [
            '<a href="foo.html">text</a>'
          ]
      end

      it 'does not sanitize valid html tags' do
        valid_html_tags.each do |valid_markup|
          sanitized_block = Block.from_json({
            layout: 12,
            components: [ { type: 'html', value: valid_markup } ],
            created_by: 'test_user@socrata.com'
          })

          expect(sanitized_block.components[0]['value']).to eq(valid_markup)
        end
      end
    end
  end
end
