exports.config = {
  directConnect: true,
  capabilities: {
    'browserName': 'chrome'
  },
  framework: 'jasmine2',
  // Options to be passed to Jasmine.
  jasmineNodeOpts: {
    defaultTimeoutInterval: 50000
  },
  onPrepare: function(){
    browser.manage().window().maximize(); //maximizes the window 
    },
  
specs: ['Test Cases/FeedbackTest/Feedback.js']
};