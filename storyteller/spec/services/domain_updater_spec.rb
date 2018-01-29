require 'rails_helper'

RSpec.describe DomainUpdater do
  describe '#migrate' do
    # aliases may be stored with excessive commas in Core
    let(:old_domain) { {'cname' => 'old', 'aliases' => ',alias,aliaz,' } }
    let(:new_domain) { {'cname' => 'alias', 'aliases' => ',aliaz,old,' } }
    let(:block) { instance_double('Block') }

    context 'when no blocks are affected' do
      it 'does nothing' do
        allow(DomainUpdater).to receive(:candidate_blocks_using_pure_json).and_return([])
        allow(DomainUpdater).to receive(:candidate_blocks_using_json_and_regexp).and_return([])

        expect_any_instance_of(Block).not_to receive(:update_columns)

        DomainUpdater.migrate(old_domain, new_domain)
      end
    end

    context 'when any block is affected' do
      before do
        allow(block).to receive(:id).and_return('1')
      end

      shared_examples 'a successful update' do
        it 'updates only components that refer to a source domain' do
          original_components = [
            story_tile_component('foo.example.com'),
            story_tile_component('bar.example.com')
          ]
          migrated_components = [
            story_tile_component('foo.example.com'),
            story_tile_component('baz.example.com')
          ]

          allow(DomainUpdater).to receive(:has_domain_reference).
            with(original_components[0], anything).
            and_return(false)
          allow(DomainUpdater).to receive(:has_domain_reference).
            with(original_components[1], anything).
            and_return(true)
          allow(DomainUpdater).to receive(:migrate_story_tile).
            and_return(story_tile_component('baz.example.com'))

          allow(block).to receive(:components).and_return(original_components)

          expect(DomainUpdater).to receive(:migrate_story_tile).once
          expect(block).to receive(:update_columns).with(hash_including(components: migrated_components))

          DomainUpdater.migrate(old_domain, new_domain)
        end
      end

      context '(found via pure JSON query)' do
        before do
          allow(DomainUpdater).to receive(:candidate_blocks_using_pure_json).and_return([block])
          allow(DomainUpdater).to receive(:candidate_blocks_using_json_and_regexp).and_return([])
        end

        it_behaves_like 'a successful update'
      end

      context '(found via JSON/regexp query)' do
        before do
          allow(DomainUpdater).to receive(:candidate_blocks_using_pure_json).and_return([])
          allow(DomainUpdater).to receive(:candidate_blocks_using_json_and_regexp).and_return([block])
        end

        it_behaves_like 'a successful update'
      end
    end
  end

  context 'migrating specific components' do
    let(:component_domain) { 'source.example.com' }
    let(:destination_domain) { 'destination.example.com' }

    describe '#migrate_goal_tile' do
      it 'returns a migrated component' do
        old_component = goal_tile_component(component_domain)
        new_component = goal_tile_component(destination_domain)

        migrated_component = DomainUpdater.send(:migrate_goal_tile, old_component, destination_domain)
        expect(migrated_component).to eq(new_component)
      end
    end

    describe '#migrate_story_tile' do
      it 'returns a migrated component' do
        old_component = story_tile_component(component_domain)
        new_component = story_tile_component(destination_domain)

        migrated_component = DomainUpdater.send(:migrate_story_tile, old_component, destination_domain)
        expect(migrated_component).to eq(new_component)
      end
    end

    describe '#migrate_classic_visualization' do
      it 'returns a migrated component' do
        old_component = classic_visualization_component(component_domain)
        new_component = classic_visualization_component(destination_domain)

        migrated_component = DomainUpdater.send(:migrate_classic_visualization, old_component, destination_domain)
        expect(migrated_component).to eq(new_component)
      end
    end

    describe '#migrate_v1_vif' do
      it 'returns a migrated component' do
        old_component = v1_vif_component(component_domain)
        new_component = v1_vif_component(destination_domain)

        migrated_component = DomainUpdater.send(:migrate_v1_vif, old_component, destination_domain)
        expect(migrated_component).to eq(new_component)
      end
    end

    describe '#migrate_v2_vif' do
      it 'returns a migrated component' do
        old_component = v2_vif_component(component_domain)
        new_component = v2_vif_component(destination_domain)

        migrated_component = DomainUpdater.send(:migrate_v2_vif, old_component, destination_domain)
        expect(migrated_component).to eq(new_component)
      end
    end

    describe '#migrate_image' do
      it 'returns a migrated component' do
        old_component = image_component(component_domain)
        new_component = image_component(destination_domain)

        migrated_component = DomainUpdater.send(:migrate_image, old_component, destination_domain)
        expect(migrated_component).to eq(new_component)
      end
    end

    describe '#migrate_viz_canvas_visualization' do
      it 'returns a migrated component' do
        old_component = viz_canvas_component(component_domain)
        new_component = viz_canvas_component(destination_domain)

        migrated_component = DomainUpdater.send(:migrate_viz_canvas_visualization, old_component, destination_domain)
        expect(migrated_component).to eq(new_component)
      end
    end
  end

  private

  # Some of these components have more properties than are shown here.
  # All of the crucial properties should be present.

  def goal_tile_component(cname)
    {
      'type' => 'goal.tile',
      'value' => {
        'domain' => cname,
        'goalUid' => 'test-test',
        'goalFullUrl' => "https://#{cname}/stat/goals/single/test-test"
      }
    }
  end

  def story_tile_component(cname)
    {
      'type' => 'story.tile',
      'value' => {
        'domain' => cname,
        'storyUid' => 'test-test',
        'openInNewWindow' => false
      }
    }
  end

  def classic_visualization_component(cname)
    {
      'type' => 'socrata.visualization.classic',
      'value' => {
        'dataset' => {
          'domain' => cname,
          'datasetUid' => 'test-test'
        },
        'originalUid' => 'test-test',
        'visualization' => {
          'id' => 'test-test',
          'name' => 'Classic Visualization',
          'domainCName' => cname
        }
      }
    }
  end

  def v1_vif_component(cname)
    {
      'type' => 'socrata.visualization.table',
      'value' => {
        'vif' => {
          'type' => 'table',
          'unit' => {
            'one' => 'record',
            'other' => 'records'
          },
          'title' => 'V1 VIF',
          'domain' => cname,
          'format' => {
            'type' => 'visualization_interchange_format',
            'version' => 1
          },
          'origin' => {
            'url' => "https://#{cname}/stories/s/V1-VIF/test-test",
            'type' => 'storyteller_asset_selector'
          },
          'datasetUid' => 'test-test'
        },
        'dataset' => {
          'domain' => cname,
          'datasetUid' => 'test-test'
        }
      }
    }
  end

  def v2_vif_component(cname)
    {
      'type' => 'socrata.visualization.columnChart',
      'value' => {
        'vif' => {
          'title' => 'V2 VIF',
          'format' => {
            'type' => 'visualization_interchange_format',
            'version' => 2
          },
          'series' => [
            {
              'type' => 'columnChart',
              'unit' => {
                'one' => 'record',
                'other' => 'records'
              },
              'dataSource' => {
                'type' => 'socrata.soql',
                'domain' => cname,
                'datasetUid' => 'test-test'
              }
            }
          ]
        },
        'dataset' => {
          'domain' => cname,
          'datasetUid' => 'test-test'
        }
      }
    }
  end

  def image_component(cname)
    {
      'type' => 'image',
      'value' => {
        'alt' => 'Image with Link',
        'url' => 'https://s3bucket.example.com/documents/uploads/my-image',
        'link' => "https://#{cname}/page"
      }
    }
  end

  def viz_canvas_component(cname)
    {
      'type' => 'socrata.visualization.vizCanvas',
      'value' => {
        'dataset' => {
          'domain' => cname,
          'domainUid' => 'test-test',
          'vifId' => '1234abc-defg-849942'
        }
      }
    }

  end
end
