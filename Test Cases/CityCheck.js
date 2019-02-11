var CityCheck = require('../Page Objects/CityCheckLocators');

var test = require('./Util');

var preq = require('./constants');

var OriginCity = "Bhubaneswar";
var DestinationCity = "Bengaluru";
var DepartureDate = "14/02/2019";
var ReturnDate = "17/02/2019";

describe("Testing for correctness of route", function () {

    preq;

    it("Searching flights between two cities", function () {

        //clicking the Origin Text box to enter city
        test.waitClick(CityCheck.OriginTextBox);
        CityCheck.OriginTextBox.sendKeys(OriginCity);

        //Jump over to the destination test box
        CityCheck.OriginTextBox.sendKeys(protractor.Key.TAB);

        //clicking on the Destination Text box to enter city
        CityCheck.DestinationTextBox.click();
        CityCheck.DestinationTextBox.sendKeys(DestinationCity);

        CityCheck.DestinationTextBox.sendKeys(protractor.Key.TAB);

        //clicking on the departure date
        CityCheck.DepartDate.click();
        CityCheck.DepartDate.sendKeys(DepartureDate);

        //clicking on the return date
        CityCheck.returnDate.click();
        CityCheck.returnDate.sendKeys(ReturnDate);

        CityCheck.DateSubmit.click();

        //Clicking the search button
        CityCheck.SearchButton.click();

browser.sleep(5000);

        //Checking displayed routes
        browser.wait(CityCheck.DepartRoute.isDisplayed(), 20000).then(function () {
            expect(CityCheck.DepartRoute.getText()).toEqual(OriginCity + " to " + DestinationCity).then(function () {

                console.log("Departure Route is correct")
            })

            expect(CityCheck.ReturnRoute.getText()).toEqual(DestinationCity + " to " + OriginCity).then(function () {
                console.log("Return Route are correct");
            })





        });




    });
});
