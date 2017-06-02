class AddThemeToStories < ActiveRecord::Migration
  def change
    add_column :draft_stories,     :theme, :string
    add_column :published_stories, :theme, :string
  end
end
