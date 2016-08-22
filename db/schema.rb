# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20160820190147) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "blocks", force: :cascade do |t|
    t.string   "layout",                     null: false
    t.jsonb    "components",                 null: false
    t.string   "created_by",                 null: false
    t.datetime "created_at"
    t.datetime "updated_at"
    t.datetime "deleted_at"
    t.boolean  "presentable", default: true
  end

  add_index "blocks", ["components"], name: "index_blocks_on_components", using: :gin

  create_table "delayed_jobs", force: :cascade do |t|
    t.integer  "priority",   default: 0, null: false
    t.integer  "attempts",   default: 0, null: false
    t.text     "handler",                null: false
    t.text     "last_error"
    t.datetime "run_at"
    t.datetime "locked_at"
    t.datetime "failed_at"
    t.string   "locked_by"
    t.string   "queue"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "delayed_jobs", ["priority", "run_at"], name: "delayed_jobs_priority", using: :btree

  create_table "documents", force: :cascade do |t|
    t.string   "story_uid",                             null: false
    t.string   "direct_upload_url",                     null: false
    t.string   "upload_file_name"
    t.string   "upload_content_type"
    t.integer  "upload_file_size"
    t.datetime "upload_updated_at"
    t.string   "created_by",                            null: false
    t.integer  "status",                    default: 0, null: false
    t.datetime "created_at",                            null: false
    t.datetime "updated_at",                            null: false
    t.float    "crop_x"
    t.float    "crop_y"
    t.float    "crop_width"
    t.float    "crop_height"
    t.boolean  "skip_thumbnail_generation"
  end

  add_index "documents", ["status"], name: "index_documents_on_status", using: :btree

  create_table "draft_stories", force: :cascade do |t|
    t.string   "uid",        limit: 9,              null: false
    t.integer  "block_ids",            default: [], null: false, array: true
    t.string   "created_by",                        null: false
    t.datetime "created_at"
    t.datetime "updated_at"
    t.datetime "deleted_at"
    t.string   "digest"
    t.string   "theme"
  end

  add_index "draft_stories", ["created_by"], name: "index_draft_stories_on_created_by", using: :btree
  add_index "draft_stories", ["uid", "digest"], name: "index_draft_stories_on_uid_and_digest", using: :btree
  add_index "draft_stories", ["uid"], name: "index_draft_stories_on_uid", using: :btree

  create_table "getty_images", force: :cascade do |t|
    t.string   "getty_id",    null: false
    t.integer  "document_id"
    t.integer  "domain_id",   null: false
    t.string   "created_by",  null: false
    t.datetime "created_at",  null: false
    t.datetime "updated_at",  null: false
  end

  create_table "published_stories", force: :cascade do |t|
    t.string   "uid",        limit: 9,              null: false
    t.integer  "block_ids",            default: [], null: false, array: true
    t.string   "created_by",                        null: false
    t.datetime "created_at"
    t.datetime "updated_at"
    t.datetime "deleted_at"
    t.string   "theme"
    t.string   "digest"
  end

  add_index "published_stories", ["created_by"], name: "index_published_stories_on_created_by", using: :btree
  add_index "published_stories", ["uid"], name: "index_published_stories_on_uid", using: :btree

end
