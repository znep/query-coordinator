class CreateDocuments < ActiveRecord::Migration
  def change
    create_table :documents do |t|
      t.string :story_uid,                      null: false
      t.string :direct_upload_url,              null: false
      t.string :upload_file_name
      t.string :upload_content_type
      t.integer :upload_file_size
      t.datetime :upload_updated_at
      t.string :created_by,                     null: false
      t.integer :status,            default: 0, null: false

      t.timestamps null: false
    end

    add_index :documents, :status
  end
end
