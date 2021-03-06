var FlightSearch = require('../../Page Objects/FlightSearchLocators');
//importing locators from FlightSearchLocators.js

var test = require('../Util');
//importing functions from Util.js

var preq = require('../constants');


describe("Testing the search functionality", function () {

    beforeEach(function () {
        Preq;

    });

    //Testing the flight search functionality
    it("Searching flights between two cities", function () {

        //clicking the Origin Text box to enter city
        test.waitClick(FlightSearch.OriginTextBox);
        FlightSearch.OriginTextBox.sendKeys(FlightSearch.OriginCity);

        //Jump over to the destination test box
        FlightSearch.OriginTextBox.sendKeys(protractor.Key.TAB);

        //clicking on the Destination Text box to enter city
        FlightSearch.DestinationTextBox.click();
        FlightSearch.DestinationTextBox.sendKeys(FlightSearch.DestinationCity);

        FlightSearch.DestinationTextBox.sendKeys(protractor.Key.TAB);

        //clicking on the departure date
        FlightSearch.DepartDate.click();
        FlightSearch.DepartDate.sendKeys(FlightSearch.DepartureDate);

        //clicking on the return date
        FlightSearch.returnDate.click();
        FlightSearch.returnDate.sendKeys(FlightSearch.ReturnDate);

        FlightSearch.DateSubmit.click();

        //Clicking the search button
        FlightSearch.SearchButton.click();

        test.waitExit(FlightSearch.check);



    })


})