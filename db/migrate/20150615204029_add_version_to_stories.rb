class AddVersionToStories < ActiveRecord::Migration

  def up
    change_table :draft_stories do |t|
      t.string :version
    end
  end

  def down
    change_table :draft_stories do |t|
      t.remove :version
    end
  end
end
