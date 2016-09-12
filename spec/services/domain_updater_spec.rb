require 'rails_helper'

RSpec.describe DomainUpdater do
  describe '#migrate' do
    # aliases may be stored with excessive commas in Core
    let(:old_domain) { {'cname' => 'old', 'aliases' => ',alias,aliaz,' } }
    let(:new_domain) { {'cname' => 'alias', 'aliases' => ',aliaz,old,' } }
    let(:other_domain) { {'cname' => 'other', 'aliases' => ',whatever,' } }
    let(:block) { instance_double('Block') } # use FactoryGirl and replace private component methods?

    context 'when no blocks are affected' do
      it 'does nothing' do
        allow(Block).to receive(:where).and_return([])
        expect_any_instance_of(Block).not_to receive(:update_columns)

        DomainUpdater.migrate(old_domain, new_domain)
      end
    end

    context 'when blocks are affected' do
      before do
        allow(Block).to receive(:where).and_return([block])
        allow(block).to receive(:id).and_return('1')
      end

      it 'modifies only components that were using the old domain' do
        original_components = [
          # many components have no domain reference
          non_migrating_component,
          # story tiles are affected only if they use the old domain
          story_tile_component(other_domain),
          story_tile_component(old_domain),
          # goal tiles are affected only if they use the old domain
          goal_tile_component(other_domain),
          goal_tile_component(old_domain)
        ]
        allow(block).to receive(:components).and_return(original_components)

        migrated_components = original_components.dup
        # story tile changes
        migrated_components[2]['value']['domain'] = 'alias'
        # goal tile changes
        migrated_components[4]['value']['domain'] = 'alias'
        migrated_components[4]['value']['domain'].sub!('//old', '//alias')

        expect(block).to receive(:update_columns).with(hash_including(components: migrated_components))
        DomainUpdater.migrate(old_domain, new_domain)
      end
    end
  end

  private

  def goal_tile_component(domain)
    {
      'type' => 'goal.tile',
      'value' => {
        'domain' => domain['cname'],
        'goalUid' => 'test-test',
        'goalFullUrl' => "https://#{domain['cname']}/stat/goals/single/test-test"
      }
    }
  end

  def story_tile_component(domain)
    {
      'type' => 'story.tile',
      'value' => {
        'domain' => domain['cname'],
        'storyUid' => 'test-test',
        'openInNewWindow' => false
      }
    }
  end

  def non_migrating_component
    {
      'type' => 'author',
      'value' => {
        'image' => {
          'documentId' => 1,
          'url' => 'http://example.com/hero-image.jpg'
        }
      }
    }
  end
end
