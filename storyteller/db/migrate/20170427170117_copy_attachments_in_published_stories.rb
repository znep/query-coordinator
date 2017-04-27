# Fixing all published stories that were affected by EN-14758
# This migration goes through all published story blocks that have image
# components and copies the attachments to new Documents. We keep an audit of
# the migrated blocks so that we can rollback (and have a record of updates to
# the block components).
class CopyAttachmentsInPublishedStories < ActiveRecord::Migration
  def up
    migration_time = Time.now

    PublishedStory.all.each do |story|
      # we only care about blocks that have image components
      image_blocks = Block.for_story(story).
        with_component_type(*Block::IMAGE_COMPONENT_TYPES)

      image_blocks.each do |block|
        migration_audit = BlockComponentsMigration.from_block(block)

        this_block_as_json_blocks_array = StoryJsonBlocks.blocks_to_json([block])

        # This call does the copying of attachments and doesn't save
        # the new components back to the block
        json_blocks = StoryJsonBlocks.new(
          this_block_as_json_blocks_array,
          { id: block.created_by },
          copy: true)

        # only care about the first one since we initialized the json_blocks
        # class with one block.
        new_components = json_blocks.blocks.first.components

        block.update_column(:components, new_components)

        migration_audit.new_components = new_components
        migration_audit.migration_version = version
        migration_audit.migrated_on = migration_time

        migration_audit.save!
      end
    end
  end

  def down
    rollback_time = Time.now

    BlockComponentsMigration.where(
      migration_version: version,
      rolled_back_on: nil # in case we've rolled back and rolled forward already
    ).each do |migration_audit|
      block = migration_audit.block
      block.update_column(:components, migration_audit.original_components)
      migration_audit.update_attribute(:rolled_back_on, rollback_time)
    end
  end
end
