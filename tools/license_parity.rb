#!/usr/bin/env ruby
# Expecting ruby 1.9.3, so no refinements.

def show_usage
  puts <<HELP
Usage:
`ruby tools/license_parity.rb` - English explanation of differences.
`ruby tools/license_parity.rb sql` - SQL to run for manual migration.
`ruby tools/license_parity.rb migration` - XML to add to core migrations.
`ruby tools/license_parity.rb test` - Run unit tests.
HELP
end

require 'yaml'
require 'pry'
require 'nokogiri'
require 'test/unit'

# Prevent the unit tests from running automatically.
class Test::Unit::Runner
  @@stop_auto_run = true
end

DB_COLUMNS = %w(id name logo_url terms_link attribution_required)

# Describes a change to be made to the database
# * Provides an SQL statement that executes the change on the MetaDB.
# * Provides an SQL statement that rolls back the change.
# * Provides an English explanation of what the change intends.
class Change
  attr_reader :sql, :english, :rollback
end

# Describes the fact that there is a new license in truth that needs adding to
# the database.
class ExistenceChange < Change
  def initialize(truth)
    @sql = truth.as_upsert_sql
    @english = "#{truth.id} is missing."
    @rollback = "DELETE FROM licenses WHERE id = #{truth.id.to_sql};"
  end
end

# Describes the fact that there is an existing license that needs updating.
class AttributeChange < Change
  def initialize(truth, specifics)
    @sql = UpdateSql.new(specifics[:key], specifics[:value], truth.id)
    @english = "#{truth.id}##{specifics[:key]} should be #{specifics[:value]}."
    @rollback = UpdateSql.new(specifics[:key], specifics[:original], truth.id)
  end
end

# Quick encapsulation of the UPDATE command to reduce it down to the minimal
# number of variables to change.
class UpdateSql < Struct.new(:set_k, :set_v, :where)
  def to_s
    "UPDATE licenses SET #{set_k}='#{set_v}' WHERE id = '#{where}';"
  end
end

## Extensions to core Ruby objects

# Modify the Object class to have two translation methods.
# * #to_sql translates the object into a single-quoted string.
# * #to_bool translates the object into a boolean value.
class Object
  def to_sql
    "'#{self}'"
  end

  def to_bool
    !!self
  end
end

# nil is represented as NULL in SQL, without single quotes.
class NilClass
  def to_sql
    'NULL'
  end
end

# true is represented as true in SQL, without single quotes.
class TrueClass
  def to_sql
    'true'
  end
end

# false is represented as false in SQL, without single quotes.
class FalseClass
  def to_sql
    'false'
  end
end

# This is an encapsulation of a single license as defined in config/licenses.yml
# The attributes correspond to properties defined in the YAML file, and
# they eventually correspond to columns in the database table.
class LicenseTruth
  def initialize(hsh)
    @data = hsh
    %w(id name logo terms_link attribution_required).each do |property|
      instance_variable_set :"@#{property}", hsh[property]
    end
    @attribution_required = attribution_required.to_bool
    raise "#{hsh} is an invalid license!" unless valid?
  end
  attr_reader :id, :name, :logo, :terms_link, :attribution_required

  def self.licenses=(licenses)
    @@licenses = licenses
  end

  def self.licenses
    @@licenses
  end

  def self.find_changes(db_data)
    build_changes = lambda do |changes, truth_hsh|
      truth = LicenseTruth.new(truth_hsh)

      db_version = db_data.detect { |license| license['id'] == truth.id }
      if db_version.nil?
        changes << ExistenceChange.new(truth)
      else
        changes.concat truth.find_changes_with(db_version)
      end
    end

    licenses.collect { |license| license['licenses'] || license }.
             flatten.
             inject([], &build_changes)
  end

  ## Interfaces
  def find_changes_with(db_version)
    @db_version = db_version
    changes = []

    changes << generate_change('name', true_name) unless name_matches? db_version
    changes << generate_change('logo_url', logo) unless logo_matches? db_version
    changes << generate_change('terms_link', terms_link) unless terms_link_matches? db_version
    changes << generate_change('attribution_required', attribution_required ? 't' : 'f') unless attribution_required_matches? db_version

    changes
  end

  def as_upsert_sql
    values = []
    values << true_name
    values << logo || default_logo
    values << terms_link
    values << attribution_required.to_bool

    sql  = "INSERT INTO licenses (#{DB_COLUMNS.join(', ')}) ("
    sql <<   "SELECT * FROM ("
    sql <<     "SELECT '#{id}'::varchar as id, " << values.collect(&:to_sql).join(', ')
    sql <<   ") t WHERE id NOT IN (SELECT id FROM licenses)"
    sql << ");"
  end

  private
  ## Accessors
  def [](prop)
    @data[prop]
  end

  # The category for a license is defined as the YAML object that wraps the license definition
  # in the truth file. Thus, you cannot straightforwardly determine a license's category; you 
  # need to iterate through all possible cases and find the category that includes the current
  # license.
  def category
    @category ||= @@licenses.reject { |license| license['licenses'].nil? }.detect do |license|
      license['licenses'].detect { |cat_license| cat_license['id'] == id }
    end || {}
  end

  # A license's true name is how it's stored in the database. Since the database has no
  # conception of categories, we prepend the category name to the license name for saving.
  def true_name
    @true_name ||= @data['display_name'] || [category['name'], name].compact.join(' ')
  end

  def default_logo
    nil
  end

  ## Helpers
  def valid?
    id == 'PUBLIC_DOMAIN' || [ :id, :name, :terms_link ].all? { |accessor| send(accessor) }
  end

  def generate_change(key, value)
    AttributeChange.new(self, key: key, value: value, original: @db_version[key])
  end

  ## Matchers
  def name_matches?(db_version)
    db_version['name'] == true_name
  end

  def logo_matches?(db_version)
    db_version['logo_url'] == logo || (db_version['logo_url'].empty? && logo.nil?)
  end

  def terms_link_matches?(db_version)
    db_version['terms_link'] == terms_link || (db_version['terms_link'].empty? && terms_link.nil?)
  end

  def attribution_required_matches?(db_version)
    (attribution_required ? 't' : 'f') == db_version['attribution_required']
  end
end

# A core migration is an XML file found in the migrations directory in the core server repository.
# It uses a Liquibase schema to describe SQL changes and rollbacks.
#
# The purpose of this class is to provide a renderer that constructs the XML file for you; all that
# is left to do is to name the file usefully, add it to the repository, and modify migrate.xml as
# appropriate.
class CoreMigration
  ROOT_ATTRIBUTES = {
    'xmlns' => 'http://www.liquibase.org/xml/ns/dbchangelog',
    'xmlns:xsi' => 'http://www.w3.org/2001/XMLSchema-instance',
    'xsi:schemaLocation' => [
      'http://www.liquibase.org/xml/ns/dbchangelog',
      'http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-2.0.xsd'
    ].join(' ')
  }

  def self.build_from(changes)
    xml = Nokogiri::XML::Builder.new(encoding: 'UTF-8') do |doc|
      doc.databaseChangeLog(ROOT_ATTRIBUTES) do
        doc.changeSet('id' => '1', 'author' => ENV['USER']) do
          doc.sql do
            doc.text($/)
            changes.each { |change| doc.text("      #{change.sql}#{$/}") }
            doc.text('    ')
          end
          doc.rollback do
            doc.text($/)
            changes.each { |change| doc.text("      #{change.rollback}#{$/}") }
            doc.text('    ')
          end
        end
      end
    end.doc.to_xml
  end
end

class LicenseTruthTestCases < Test::Unit::TestCase

  def minimum_viable_stub
    { 'id' => 'FOO',
      'name' => 'Bar',
      'terms_link' => 'http://www.example.com/',
      'logo' => 'images/logo.png'
    }
  end

  def minimum_db_stub
    { 'id' => 'FOO',
      'name' => 'Bar',
      'terms_link' => 'http://www.example.com/',
      'logo_url' => 'images/logo.png',
      'attribution_required' => 'f'
    }
  end

  def test_validity
    assert_raises(RuntimeError) { LicenseTruth.new({ 'id' => 'FOO' }) }
    assert_raises(RuntimeError) { LicenseTruth.new({ 'id' => 'FOO', 'name' => 'Bar' }) }
    assert_nothing_raised do LicenseTruth.new({ 'id' => 'FOO',
                                                'name' => 'Bar',
                                                'terms_link' => 'http://www.example.com/' })
    end
  end

  def test_truth_outputs_upsert
    LicenseTruth.licenses = [minimum_viable_stub]
    changes = LicenseTruth.find_changes([])
    assert changes.length == 1
    assert changes.first.sql =~ /^INSERT INTO/
    assert changes.first.rollback =~ /^DELETE FROM/
  end

  def test_truth_changes_name
    license = minimum_viable_stub.merge({ 'name' => 'Wheeee' })
    LicenseTruth.licenses = [license]
    changes = LicenseTruth.find_changes([minimum_db_stub])
    assert changes.first.sql.to_s.include? 'Wheeee'.to_sql

    LicenseTruth.licenses = [{ 'id' => 'CAT', 'name' => 'CATNAME', 'licenses' => [license]}]
    changes = LicenseTruth.find_changes([minimum_db_stub])
    assert changes.first.sql.to_s.include? 'CATNAME Wheeee'.to_sql
  end

  def test_truth_changes_logo
    license = minimum_viable_stub.merge({ 'logo' => 'Wheeee' })
    LicenseTruth.licenses = [license]
    changes = LicenseTruth.find_changes([minimum_db_stub])
    assert changes.first.sql.to_s.include? 'logo_url=\'Wheeee\''

    license.delete('logo')
    LicenseTruth.licenses = [license]
    changes = LicenseTruth.find_changes([minimum_db_stub])
    assert changes.first.sql.to_s.include? 'logo_url=\'\''
  end

  def test_truth_changes_attribution_required
    license = minimum_viable_stub.merge({ 'attribution_required' => true })
    LicenseTruth.licenses = [license]
    changes = LicenseTruth.find_changes([minimum_db_stub])
    assert changes.first.sql.to_s.include? 'attribution_required=\'t\''
  end
end

def run_main(output_type)
  rails_root = File.expand_path(File.join(File.dirname(__FILE__), '..'))

  # We presume that config/licenses.yml is truth.
  LicenseTruth.licenses = YAML::load_file(File.join(rails_root, '/config/licenses.yml'))

  # You can pipe in correctly-formatted psql output as well.
  # ssh metadba_host "psql -c 'select * from licenses;' -t -A -F," | ruby tools/license_parity.rb
  raw_sql_input =
    if STDIN.tty?
      `psql blist_dev -c 'select #{DB_COLUMNS.collect(&:to_sql).join(', ')} from licenses;' -t -A -F,`
    else
      STDIN.read
    end

  # Make sure you've run the latest core migrations!
  db_data = raw_sql_input.split($/).collect do |line|
    Hash[DB_COLUMNS.zip(line.split(','))]
  end

  changes = LicenseTruth.find_changes(db_data)

  unless changes.empty?
    case output_type
    when 'migration'
      puts CoreMigration.build_from(changes)
    when 'sql', 'english'
      changes.                        # for each change
        collect(&output_type.to_sym). # convert to output type
        collect(&:to_s).              # render as string
        each(&Kernel.method(:puts))   # output
    else
      show_usage
    end
  end
end

case ARGV.first
when '--help'
  show_usage
when 'test'
  Test::Unit::Runner.new.run(ARGV)
else
  run_main(ARGV.first || 'english')
end
