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

ActiveRecord::Schema.define(version: 20150615204029) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "blocks", force: :cascade do |t|
    t.string   "layout",     null: false
    t.json     "components", null: false
    t.string   "created_by", null: false
    t.datetime "created_at"
    t.datetime "updated_at"
    t.datetime "deleted_at"
  end

  create_table "draft_stories", force: :cascade do |t|
    t.string   "four_by_four", limit: 9,              null: false
    t.integer  "block_ids",              default: [], null: false, array: true
    t.string   "created_by",                          null: false
    t.datetime "created_at"
    t.datetime "updated_at"
    t.datetime "deleted_at"
    t.string   "version"
  end

  add_index "draft_stories", ["created_by"], name: "index_draft_stories_on_created_by", using: :btree
  add_index "draft_stories", ["four_by_four"], name: "index_draft_stories_on_four_by_four", using: :btree

  create_table "published_stories", force: :cascade do |t|
    t.string   "four_by_four", limit: 9,              null: false
    t.integer  "block_ids",              default: [], null: false, array: true
    t.string   "created_by",                          null: false
    t.datetime "created_at"
    t.datetime "updated_at"
    t.datetime "deleted_at"
  end

  add_index "published_stories", ["created_by"], name: "index_published_stories_on_created_by", using: :btree
  add_index "published_stories", ["four_by_four"], name: "index_published_stories_on_four_by_four", using: :btree

end
