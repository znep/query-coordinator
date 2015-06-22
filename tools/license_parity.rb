#!/usr/bin/env ruby

require 'yaml'
require 'pry'

class Error < Struct.new(:sql, :english); end
class Sql < Struct.new(:set_k, :set_v, :where)
  def to_s
    "UPDATE licenses SET #{set_k}='#{set_v}' WHERE id = '#{where}';"
  end
end

class Object
  def to_sql
    "'#{self}'"
  end
end

# We presume that config/licenses.yml is truth.
RAILS_ROOT = File.expand_path(File.join(File.dirname(__FILE__), '..'))
licenses = YAML::load_file(File.join(RAILS_ROOT, '/config/licenses.yml'))

COLUMNS = [ 'id', 'name', 'logo_url', 'terms_link', 'attribution_required' ]

# Make sure you've run the latest core migrations!
db_data = `psql blist_dev -c 'select #{COLUMNS.collect(&:to_sql).join(', ')} from licenses;' -t -A -F,`.split($/).collect do |line|
  Hash[COLUMNS.zip(line.split(','))]
end

errors = []

# This should really be an UPSERT of some kind, but Postgresql doesn't have
# an UPSERT until 9.5 so we have to figure out a way to fake it. We don't have
# any performance requirements, but we need something.
def upsert_sql(license)
  "INSERT INTO licenses (#{COLUMNS.join(', ')}) VALUES (#{license.values.collect(&:to_sql).join(', ')});"
end

licenses.collect { |license| license['licenses'] || license }.flatten.each do |truth|
  # Existence test
  db_version = db_data.detect { |license| license['id'] == truth['id'] }
  if db_version.nil?
    errors << Error.new(upsert_sql(truth), "#{truth['id']} is missing.")
    next
  end

  # Determine category
  category = licenses.reject { |license| license['licenses'].nil? }.detect do |license|
    license['licenses'].detect { |cat_license| cat_license['id'] == truth['id'] }
  end || {}

  truth.each_pair do |k, v|
    case k
    when 'name', 'display_name'
      true_name = truth['display_name'] || [category['name'], truth['name']].compact.join(' ')
      if db_version['name'] != true_name
        errors << Error.new(Sql.new('name', true_name, truth['id']), "#{truth['id']}##{k} should be #{true_name}.")
      end
    when 'logo'
      unless db_version['logo_url'] == v || (db_version['logo_url'].empty? && v.nil?)
        errors << Error.new(Sql.new(k, v, truth['id']),
                            "#{truth['id']}##{k} should be #{v}.")
      end
    when 'terms_link'
      unless db_version['terms_link'] == v || (db_version['terms_link'].empty? && v.nil?)
        errors << Error.new(Sql.new(k, v, truth['id']),
                            "#{truth['id']}##{k} should be #{v}.")
      end
    when 'attribution_required'
      if v && db_version['attribution_required'] == 'f'
        errors << Error.new(Sql.new(k, !!v ? 't' : 'f', truth['id']),
                            "#{truth['id']}##{k} should be #{v}.")
      end
    end
  end
end

unless errors.empty?
  puts
  puts '-- WARNING: Make sure that you have run migrations before using this tool!'
  puts
  errors.each do |error|
    puts error.sql.to_s
  end
  exit 1
end
