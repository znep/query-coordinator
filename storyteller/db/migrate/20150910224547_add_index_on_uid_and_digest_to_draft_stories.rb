class AddIndexOnUidAndDigestToDraftStories < ActiveRecord::Migration
  def change
    # for DraftStory.find_by_uid_and_digest
    add_index :draft_stories, [:uid, :digest]
  end
end
