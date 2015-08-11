listen 3000
worker_processes Integer(ENV['WORKER_PROCESSES'] || 4)
ENV['UNICORN'] = '1'
