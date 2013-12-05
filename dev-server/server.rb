#!/usr/bin/env ruby

require 'socket'
require 'timeout'

TEMP_CACHE_DIR='/tmp/apache-dev-server-cache'
HTTPD=["httpd", "apache2"].select {|p| Kernel.system("which #{p} >/dev/null") }.first
if HTTPD.nil?
  STDERR.puts "Error: Couldn't find Apache binary"
  exit 1
end

def check_args
  if ARGV.size != 1
    return false
  end
  if ARGV[0] != 'start' && ARGV[0] != 'stop' && ARGV[0] != 'clean'
    return false
  end

  return true
end

def clean_mod_cache_directory!(options = {})
  options[:force] ||= false

  if File.directory? TEMP_CACHE_DIR
    puts "Cleaning Apache mod_cache directory..."
    Kernel.system("htcacheclean -t#{options[:force] ? 'r' : ''} -p#{TEMP_CACHE_DIR} -l1K")
  else
    Dir.mkdir TEMP_CACHE_DIR
  end
end


if check_args
  DEV_DIR = File.dirname(File.expand_path(__FILE__))

  case ARGV[0]
  when 'start'
    if !File.exists?("#{DEV_DIR}/var/apache2.pid")
      clean_mod_cache_directory!(:force => true)
      puts "All running; starting Apache."
      if Kernel.system("#{HTTPD} -d \"#{DEV_DIR}\" -DOS_`uname -s` -f httpd.conf")
	puts "Apache is running; try accessing http://localhost:9292"
      else
	STDERR.puts "Error: unable to start Apache"
	exit 1
      end
    else
      STDERR.puts "Error: #{DEV_DIR}/var/apache2.pid file already exists. Perhaps Apache is already running?"
      exit 1
    end
  when 'stop'
    pid = 0
    begin
      pid = File.read("#{DEV_DIR}/var/apache2.pid").chomp.to_i
    rescue Errno::ENOENT
    end

    if pid > 0
      puts "Killing pid #{pid}"
      Process.kill("WINCH", pid)
      clean_mod_cache_directory!
    else
      STDERR.puts "Error: #{DEV_DIR}/var/apache2.pid file not found; are you sure it's running?"
      exit 1
    end
  when 'clean'
    File.delete(*Dir.glob("#{DEV_DIR}/var/*.lock"))
    File.delete(*Dir.glob("#{DEV_DIR}/var/apache2.pid"))
    clean_mod_cache_directory!(:force => true)
  end
else
    STDERR.puts "Usage: #{__FILE__} [start | stop | clean]"
    exit 1
end
