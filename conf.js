var HtmlReporter = require('protractor-beautiful-reporter');

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
  
  
specs: ['Test Cases/SocialSitesTest/SocialLinksTest.js'],
onPrepare: function(){
  browser.manage().window().maximize(); //maximizes the window 
  },

onPrepare: function() {
  // Add a screenshot reporter and store screenshots to `/tmp/screenshots`:
  jasmine.getEnv().addReporter(new HtmlReporter({
     baseDirectory: 'Reports/screenshots'
  }).getJasmine2Reporter());
}

};