class CreateGettyImages < ActiveRecord::Migration
  def change
    create_table :getty_images do |t|
      t.string :getty_id, null: false
      t.integer :document_id
      t.integer :domain_id, null: false
      t.boolean :downloading, default: false
      t.string :created_by, null: false

      t.timestamps null: false
    end

    add_index :getty_images, :getty_id, unique: true
    add_foreign_key :getty_images, :documents
  end
end
