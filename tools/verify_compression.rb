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
  PROCESS_ALL || PROCESS_SPECIFIC == package || libraries.any? do |js|
    next false unless changed_js.respond_to? :each # Testing that it's like an Array, basically.
    if js.include? '*'
      (changed_js - Dir.glob(js)).compact.size > 0
    else
      changed_js.include? js
    end
  end
end

# Stolen from yui-compressor-0.12.0/lib/yui/compress.rb#compress
module MockCompressor
  class RuntimeError < StandardError; end

  # Changed to return size of compressed file.
  def self.compress(command, stream_or_string)
    streamify(stream_or_string) do |stream|
      @tempfile = Tempfile.new('yui_compress')
      @tempfile.write stream.read
      @tempfile.flush
      full_command = "%s %s" % [command, @tempfile.path]

      begin
        # XXX: Modified from original copy-paste to use PTY starting here.
        require 'pty'
        data_length = 0
        output = PTY.spawn full_command do |r, w, pid|
          begin
            r.sync
            r.each_line do |line|
              (@stdout ||= []) << line
              data_length += line.length
            end
          rescue Errno::EIO => e
            # simply ignoring this
          ensure
            ::Process.wait pid
          end
        end
        # XXX: Modification ends here.
      rescue Exception => e
        # windows shells tend to blow up here when the command fails
        raise RuntimeError, "compression failed: %s" % e.message
      ensure
      end

      if $?.exitstatus.zero?
        @tempfile.close!
        data_length
      else
        # Bourne shells tend to blow up here when the command fails, usually
        # because java is missing
        raise RuntimeError, "Command '%s' returned non-zero exit status" %
          full_command
      end
    end
  end

  def self.streamify(stream_or_string)
    if stream_or_string.respond_to?(:read)
      yield stream_or_string
    else
      yield StringIO.new(stream_or_string.to_s)
    end
  end

  def self.stdout
    @stdout
  end

  def self.tempfile
    @tempfile
  end
end

packages.each do |package, libraries|
  print "[verify compression] "

  # Explode globs
  libraries.collect! do |library|
    absolute_filename = File.join(FRONTEND, library)
    if absolute_filename.include? '*'
      Dir.glob(absolute_filename)
    else
      absolute_filename
    end
  end
  libraries.flatten!
  libraries.uniq!

  # Build buffer
  lineno_to_library_map = {}
  buffer = libraries.inject([]) { |buf, lib| buf << File.open(lib, 'rb:UTF-8') { |f| f.read } }
  buffer.inject(0) do |lineno, library|
    line_count = library.split($/).size
    lineno_to_library_map[lineno..lineno+line_count+1] = libraries[lineno_to_library_map.size]
    lineno += line_count + 1
  end
  buffer = buffer.join("\n")

  if buffer.length.zero?
    puts "#{package}.js was empty for some reason. Skipping."
    next
  end

  begin
    compressor = YUI::JavaScriptCompressor.new(munge: true) # Use the original to get the command.
    data_length = MockCompressor.compress(compressor.command, buffer)
    puts "Compression of #{package}.js worked fine.".color(:green) + " [#{number_to_human_size(data_length)}]"
  rescue MockCompressor::RuntimeError => e
    troubleshooting_file = File.join(TMP_DIR, "#{package}.js")
    puts "Compression failed. Overwriting #{troubleshooting_file} for troubleshooting".color(:red)

    # Attempt to parse the results of STDERR to display the actual problems.
    begin
      MockCompressor.tempfile.rewind
      lines = MockCompressor.tempfile.readlines

      File.open(troubleshooting_file, 'w') { |f| lines.each { |l| f.puts l }}

      MockCompressor.stdout.each do |error_line|
        next unless error_line =~ /^\s*(\d+):(\d+):(.*)/
        lineno, charno, message = $1.to_i, $2.to_i, $3
        next if message.include? 'Compilation produced'
        key = lineno_to_library_map.keys.find { |range| range.include? lineno }
        puts "Problem: #{message}".color(:red)
        puts "     in: #{lineno_to_library_map[key]}, line ~#{lineno - key.begin}, char #{charno}; line #{lineno} in troubleshooter file"
        puts lines[lineno - 1]
        puts '^'.rjust(charno)
      end
    # Hahahahah nope.
    rescue => e
      puts 'Whoops. Something exploded in the error parsing. Dumping original STDERR output without parsing it'.color(:cyan)
      puts e.message
      puts
      MockCompressor.stdout.each { |line| $stderr.puts line }

      raise
    ensure
      exit 1
    end
  end
end
