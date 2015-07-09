#!/usr/bin/env ruby

# Some valid YAML is not valid according to the CLDR.
# For instance, LocaleApp will reject `other` keywords unless their parent is a plural.

require 'yaml'

FRONTEND_ROOT = File.expand_path(File.join(File.realpath(__FILE__), '../..'))
yaml = YAML::load_file File.join(FRONTEND_ROOT, 'config/locales/en.yml')

$warnings = []
def drill_down(yaml, path = nil)
  yaml.each do |key, value|
    $warnings << "`other` key found inside #{path}; do not use unless pluralizing." if key == 'other'

    case value
      when Hash
        drill_down(value, [path, key].compact.join('.'))
      when Array
      when String
      end
  end
end

def yellow
  "\e[#33m"
end

def clear
  "\e[#0m"
end

drill_down(yaml)
$warnings.each do |warning|
  puts "[#{yellow}WARNING#{clear}]: #{warning}"
end
