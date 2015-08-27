#!/usr/bin/env ruby

require 'yaml'
require 'yui/compressor'
require 'action_view'
include ActionView::Helpers::NumberHelper

FRONTEND = `git rev-parse --show-toplevel`.chop
TMP_DIR  = File.expand_path(File.join(FRONTEND, '..', '..', 'tmp'))
YUI_PATH = `gem contents yui-compressor`.split($\).detect { |name| name.end_with? '.jar' }

git_command = ARGV.first ? "git show --name-only #{ARGV.first}" : "git diff --staged --name-only"

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
  buffer = ''
  libraries.each do |lib|
    buffer << File.read(File.join(FRONTEND, lib))
  end

  begin
    (data_length = YUI::JavaScriptCompressor.new.compress(buffer).length) > 0
    puts "Compression of #{package}.js worked fine. [#{number_to_human_size(data_length)}]"
  rescue YUI::Compressor::RuntimeError => e
    puts "Compression failed. Overwriting #{TMP_DIR}/#{package}.js"

    concatted_file = File.join(TMP_DIR, "#{package}.js")
    minified_file  = File.join(TMP_DIR, "#{package}.min.js")
    File.open(concatted_file, 'w') do |f| f.write(buffer) end
    system("java -jar #{YUI_PATH} #{concatted_file} -o #{minified_file}")

    exit 1
  end
end
