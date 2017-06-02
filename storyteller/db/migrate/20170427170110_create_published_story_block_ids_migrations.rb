class CreatePublishedStoryBlockIdsMigrations < ActiveRecord::Migration
  def change
    create_table :published_story_block_ids_migrations do |t|
      t.references :published_story, index: false, foreign_key: true
      t.integer :original_block_ids, null: false, array: true, default: []
      t.integer :new_block_ids, null: false, array: true, default: []
      t.string :migration_version
      t.datetime :migrated_on
      t.datetime :rolled_back_on

      t.timestamps null: false
    end
  end
end
