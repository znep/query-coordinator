require 'spec_helper'

describe Chrome::VERSION do
  it 'has a version number' do
    expect(Chrome::VERSION).not_to be nil
  end
end
