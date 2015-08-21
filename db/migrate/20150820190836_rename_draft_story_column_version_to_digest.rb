class RenameDraftStoryColumnVersionToDigest < ActiveRecord::Migration
  def change
    rename_column :draft_stories, :version, :digest
  end
end
