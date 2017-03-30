class AddDigestToPublishedStories < ActiveRecord::Migration
  def change
    add_column :published_stories, :digest, :string
  end
end
