require 'rails_helper'
require 'refinements/attemptable'

describe FrontendRefinements::Attemptable do
  using FrontendRefinements::Attemptable

  subject { Object.new }

  it 'should call a method that exists' do
    expect(subject).to respond_to(:class)
    expect(subject.attempt(:class)).to eq(Object)
  end

  it 'should return itself if calling a method that does not exist' do
    expect(subject).not_to respond_to(:foo)
    expect(subject.attempt(:foo)).to eq(subject)
  end
end
