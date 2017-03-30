class AddVersionToStories < ActiveRecord::Migration

  def up

    rename_column :draft_stories, :four_by_four, :uid
    rename_column :published_stories, :four_by_four, :uid

    change_table :draft_stories do |t|
      t.string :version
    end
  end

  def down

    rename_column :draft_stories, :uid, :four_by_four
    rename_column :published_stories, :uid, :four_by_four

    change_table :draft_stories do |t|
      t.remove :version
    end
  end
end
