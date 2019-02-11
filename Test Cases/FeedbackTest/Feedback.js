var FeedbackTest = require('../../Page Objects/Feedbacklocators');
//importing locators from Feedback Locators.js


var test = require('../Util');
//importing functions from Util.js

//testing the feedback function of the webpage
describe("testing the feedback submition of the webpage", function () {

  beforeEach(function () {
    browser.ignoreSynchronization = true;
    browser.get("https://www.airasia.com/booking/home/en/gb");


  });

  //Clicking on the feedback button
  it("Testing the feedback button", function () {
    test.waitClick(FeedbackTest.FeedbackButton);
    FeedbackTest.ratingButton.click();
    // FeedbackTest.commentText.click();
    FeedbackTest.commentText.sendKeys(FeedbackTest.comment);
    FeedbackTest.Submit.click();


    test.waitMessage(FeedbackTest.thankyou, 'Thank you');


  });


});