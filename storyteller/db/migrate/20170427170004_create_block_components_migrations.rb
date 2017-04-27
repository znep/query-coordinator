class CreateBlockComponentsMigrations < ActiveRecord::Migration
  def change
    create_table :block_components_migrations do |t|
      t.references :block, index: true, foreign_key: true
      t.jsonb :original_components
      t.jsonb :new_components
      t.string :migration_version
      t.datetime :migrated_on
      t.datetime :rolled_back_on

      t.timestamps null: false
    end
  end
end
