require 'spec_helper'

describe Chrome::Auth do
  it 'fails to initialize if missing a domain, email, or password' do
    expect { Chrome::Auth.new }.to raise_error(ArgumentError)
  end

  it 'initializes successfully with arguments for domain, email, and password' do
    @auth = Chrome::Auth.new('dylan.demo.socrata.com', 'user@socrata.com', 'wrong_password')
    expect { @auth }.to_not raise_error
  end
end
