#!/usr/bin/env ruby

require 'yaml'
require 'yui/compressor'
require 'action_view'
include ActionView::Helpers::NumberHelper
require 'rainbow/ext/string'

FRONTEND = `git rev-parse --show-toplevel`.chop
TMP_DIR  = File.expand_path(File.join(FRONTEND, '..', '..', 'tmp'))
YUI_PATH = `gem contents yui-compressor`.split($\).detect { |name| name.end_with? '.jar' }

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

yaml = YAML::load_file(File.join(FRONTEND, 'config/assets.yml'))['javascripts']
packages = yaml.select do |package, libraries|
  libraries.any? { |js| changed_js.include? js }
end

packages.each do |package, libraries|
  print "[verify compression] "
  buffer = libraries.inject('') { |buf, lib| buf << File.read(File.join(FRONTEND, lib)) }

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
