# Fixing all published stories that were affected by EN-14758
# This migration goes through all published story blocks that have image
# components and copies the attachments to new Documents. We keep an audit of
# the migrated blocks so that we can rollback (and have a record of updates to
# the block components).
class CopyAttachmentsInPublishedStories < ActiveRecord::Migration
  def up
    migration_time = Time.now

    PublishedStory.all.each do |story|
      # we only care about stories that have blocks that contain image components
      next unless story.has_image_component?

      migration_audit = PublishedStoryBlockIdsMigration.from_published_story(story)

      json_blocks = StoryJsonBlocks.from_story(
        story,
        { 'id' => story.created_by },
        copy: true,
        validate_document_copy: false
      )

      json_blocks.save!
      new_block_ids = json_blocks.blocks.map(&:id)

      story.update_column(:block_ids, new_block_ids)

      migration_audit.new_block_ids = new_block_ids
      migration_audit.migration_version = version
      migration_audit.migrated_on = migration_time
      migration_audit.save!
    end
  end

  def down
    rollback_time = Time.now

    PublishedStoryBlockIdsMigration.where(
      migration_version: version,
      rolled_back_on: nil # in case we've rolled back and rolled forward already
    ).each do |migration_audit|
      story = migration_audit.published_story
      story.update_column(:block_ids, migration_audit.original_block_ids)

      Block.where(id: migration_audit.new_block_ids).update_all(deleted_at: rollback_time)

      migration_audit.update_attribute(:rolled_back_on, rollback_time)
    end
  end
end
