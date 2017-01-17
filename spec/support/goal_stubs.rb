module GoalStubs
  def stub_goal_accessibility(uid, options)
    goal_double = double('Goal')
    allow(goal_double).to receive(:accessible?).and_return(options[:accessible])
    allow(goal_double).to receive(:unauthorized?).and_return(options[:unauthorized])
    allow(OpenPerformance::Goal).to(
      receive(:new).
      with(uid).
      and_return(goal_double)
    )
  end
end

RSpec.configure do |config|
  config.include GoalStubs
end
