#!/usr/bin/env ruby

# Usage:
# platform-ui/frontend [master] $ tools/find_translated_string.rb There was a problem rendering
# en.data_lens.render_error: There was a problem rendering this page.
# en.dataset_landing_page.render_error: There was a problem rendering this page.
# en.open_performance.render_error: There was a problem rendering this page.
# en.visualization_canvas.render_error: There was a problem rendering this page.
# en.visualization_canvas.visualization_error: There was a problem rendering this visualization.

require 'yaml'
require 'shellwords'
require 'optparse'

GIT_ROOT = `git rev-parse --show-toplevel`.chomp
FRONTEND = File.join(GIT_ROOT, 'frontend')
LOCALE_DIR = File.join(FRONTEND, 'config/locales')

options = { :locale => 'en'}
OptionParser.new do |opts|
  opts.banner = "Usage: #{__FILE__} [options]"

  opts.on('-l', '--locale LOCALE', "Specify a LOCALE (eg. fr, default #{options[:locale]})") do |l|
    options[:locale] = l
  end
end.parse!

class Hash
  def paths_for_value(search)
    results = []
    each do |key, value|
      case value
      when Hash
        value.paths_for_value(search).each do |subpath|
          results << subpath.unshift(key)
        end
      else
        if case search
            when String then value.respond_to?(:include?) && value.include?(search)
            when Regexp then value.respond_to?(:match) && value.match(search)
            else value == search
          end
          results << [key]
        end
      end
    end
    results
  end
end

class String
  def green
    "\e[32m#{self}\e[0m"
  end
end

def run(criterion, locale = 'en')
  data = (@data ||= {})[locale] ||= YAML.load_file(File.join(LOCALE_DIR, "#{locale}.yml"))
  data.paths_for_value(criterion).each do |path|
    puts "#{path.join('.').green}: #{data.dig(*path)}"
  end
end

run(Shellwords.join(ARGV), options[:locale]) if __FILE__ == $0
