
var FeedbackTest = require('Page Objects\Locators\Feedbacklocators.js');

//import functions from Util.js
var test = require('/Users/mindfire/Desktop/ProtractorNew/Test Cases/Util');

var ThanksText = 'Thank you';

describe("testing the feedback submition of the webpage", function () {

  beforeEach(function () {
    browser.ignoreSynchronization = true;
    browser.get("https://www.airasia.com/booking/home/en/gb");


  });

  it("Testing the feedback button", function () {
    test.waitClick(FeedbackTest.FeedbackButton);
    FeedbackTest.ratingButton.click();

    // FeedbackTest.commentText.click();
    FeedbackTest.commentText.sendKeys(FeedbackTest.comment);
    FeedbackTest.Submit.click();


    test.waitMessage(FeedbackTest.thankyou, ThanksText);


  });
});