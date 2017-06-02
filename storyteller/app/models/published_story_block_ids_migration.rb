# Model used to keep an audit log of all activity related to migrating
# published story blocks
class PublishedStoryBlockIdsMigration < ActiveRecord::Base
  belongs_to :published_story

  def self.from_published_story(story)
    new(published_story: story, original_block_ids: story.block_ids)
  end
end
