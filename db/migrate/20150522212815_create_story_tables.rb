class CreateStoryTables < ActiveRecord::Migration

  def up
    create_table :draft_stories do |t|
      t.string    :four_by_four, null: false, limit: 9
      t.integer   :block_ids, null: false, array: true, default: []
      t.string    :created_by, null: false
      t.timestamps
      t.timestamp :deleted_at
    end

    add_index :draft_stories, :four_by_four
    add_index :draft_stories, :created_by

    create_table :published_stories do |t|
      t.string    :four_by_four, null: false, limit: 9
      t.integer   :block_ids, null: false, array: true, default: []
      t.string    :created_by, null: false
      t.timestamps
      t.timestamp :deleted_at
    end

    add_index :published_stories, :four_by_four
    add_index :published_stories, :created_by

    create_table :blocks do |t|
      t.string    :layout, null: false
      t.json      :components, null: false
      t.string    :created_by, null: false
      t.timestamps
      t.timestamp :deleted_at
    end

    # Let's encode the notion that a created_at value is required and should
    # default to the time that the object was created.
    #
    # Rails will do this automatically, but Chris felt strongly that we should
    # make this explicit within the SQL.
    #
    # Note that the below implementation is specific to Postgres.
    if ActiveRecord::Base.connection.instance_of?(
      ActiveRecord::ConnectionAdapters::PostgreSQLAdapter
    )
      execute 'ALTER TABLE draft_stories ALTER COLUMN created_at SET DEFAULT LOCALTIMESTAMP'
      execute 'ALTER TABLE published_stories ALTER COLUMN created_at SET DEFAULT LOCALTIMESTAMP'
      execute 'ALTER TABLE blocks ALTER COLUMN created_at SET DEFAULT LOCALTIMESTAMP'
    else
      raise 'Please update the migration to target non-PostgreSQL databases.'
    end
  end

  def down
    remove_index :draft_stories, :four_by_four
    remove_index :draft_stories, :created_by
    drop_table :draft_stories

    remove_index :published_stories, :four_by_four
    remove_index :published_stories, :created_by
    drop_table :published_stories

    drop_table :blocks
  end
end
