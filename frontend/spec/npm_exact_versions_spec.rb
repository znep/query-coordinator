# For security and stability, we lock our NPM dependencies to an exact version.
# This spec ensures we don't fall out of compliance.

# These packages are pulled directly from Github. EN-17979
IGNORE_LIST = %w(
  javascript-detect-element-resize
  ngtemplate-loader
)

require 'json'
require 'rails_helper'

RSpec.describe 'package.json' do
  it 'specifies exact versions' do
    package_json_contents = JSON::parse(File.read(Rails.root.join('package.json')))

    all_dependencies =
      package_json_contents['dependencies'].to_a +
      package_json_contents['devDependencies'].to_a

    inexact_dependencies = all_dependencies.select do | (name, version) |
      !IGNORE_LIST.include?(name) && version.match(/^[^0-9]/)
    end

    unless inexact_dependencies.empty?
      package_list = inexact_dependencies.map { | package_pair | package_pair.join(': ') }.join("\n")
      raise "Inexact dependencies in package.json:\n#{package_list}\nPlease specify the exact version."
    end
  end
end
