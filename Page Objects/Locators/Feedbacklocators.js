var feedback = function () {
    this.FeedbackButton = element(by.css(".personalization-feedback-button"));
    this.ratingButton = element.all(by.css(".nps-score")).get(3);
    this.commentText = element(by.xpath('//*[@id="nps-modal"]//textarea'));
    this.Submit = element(by.buttonText('Submit Feedback'));
    this.comment = "prefer indigo";
    this.thankyou = element(by.css('#nps-modal .nps-modal-content'));
}
module.exports = new feedback();
