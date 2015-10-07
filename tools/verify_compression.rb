#!/usr/bin/env ruby

# TODO: In theory, we should be able to capture the STDERR (?) output of YUICompressor.compress in order to find
# the relevant line number automatically, rather than forcing people to do the search manually. But it's way too
# much work for too little gain at the moment. Probably involves threads and Open3.

if ARGV.first == '--help'
  puts <<-USAGE_HELP.gsub(/^ {2}/, '')
  Usage:
  This is a tool for finding compression errors due to Jammit using YUICompressor.

  `tools/verify_compression.rb` - Run as a pre-commit hook to spot errors in changed files.
  `tools/verify_compression.rb SHA` - Inspect the specific commit to find errors in changed files.
  `tools/verify_compression.rb --all` - Run against all packages.
  `tools/verify_compression.rb bower-all` - Run against a specific package.
  USAGE_HELP
  exit
end

require 'yaml'
require 'yui/compressor'
require 'action_view'
include ActionView::Helpers::NumberHelper
require 'rainbow/ext/string'

FRONTEND = `git rev-parse --show-toplevel`.chop
TMP_DIR  = File.expand_path(File.join(FRONTEND, '..', '..', 'tmp'))
YUI_PATH = `gem contents yui-compressor`.split($\).detect { |name| name.end_with? '.jar' }

PROCESS_ALL = ARGV.first == '--all' # Yes, should probably be using OptParser but way too lazy.

yaml = YAML::load_file(File.join(FRONTEND, 'config/assets.yml'))['javascripts']
PROCESS_SPECIFIC = yaml.keys.include?(ARGV.first) && ARGV.first

unless PROCESS_ALL || PROCESS_SPECIFIC
  git_command = if ARGV.first
                  # Intended for discovering problematic SHAs.
                  # Argument can be any git pointer: SHA, tag, or branch.
                  "git show --name-only #{ARGV.first}"
                else
                  # Intended as a pre-commit hook.
                  # Looks at staged but un-commited files.
                  "git diff --staged --name-only"
                end

  changed_js = IO.popen("cd #{FRONTEND} && #{git_command}") do |f|
    f.readlines.collect do |line|
      if md = line.match(/public\/javascripts.*\.js/)
        md[0]
      end
    end
  end
end

packages = yaml.select do |package, libraries|
  PROCESS_ALL || PROCESS_SPECIFIC == package || libraries.any? { |js| (changed_js || []).include? js }
end

packages.each do |package, libraries|
  print "[verify compression] "

  # Some of this is intentionally un-great Ruby because it's copying Jammit code.
  read_file = lambda { |filename| File.open(filename, 'rb:UTF-8') { |f| f.read } }
  buffer = libraries.inject([]) do |buf, lib|
    absolute_filename = File.join(FRONTEND, lib)
    if absolute_filename.include? '*'
      Dir.glob(absolute_filename).each do |file|
        buf << read_file.call(file)
      end
    else
      buf << read_file.call(absolute_filename)
    end
    buf
  end.join("\n")

  if buffer.length.zero?
    puts "#{package}.js was empty for some reason. Skipping."
    next
  end

  begin
    data_length = YUI::JavaScriptCompressor.new.compress(buffer).length
    puts "Compression of #{package}.js worked fine.".color(:green) + " [#{number_to_human_size(data_length)}]"
  rescue YUI::Compressor::RuntimeError => e
    puts "Compression failed. Overwriting #{TMP_DIR}/#{package}.js".color(:red)

    # No longer appears necessary to re-run the compressor in order to dump errors into the console.
    # Un-comment the below lines if you don't see any upon failure.
    concatted_file = File.join(TMP_DIR, "#{package}.js")
    #minified_file  = File.join(TMP_DIR, "#{package}.min.js")
    File.open(concatted_file, 'w') do |f| f.write(buffer) end
    #system("java -jar #{YUI_PATH} #{concatted_file} -o #{minified_file}")

    exit 1
  end
end
