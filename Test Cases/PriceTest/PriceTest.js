var PriceTest=require('/Users/mindfire/Desktop/ProtractorNew/Test Cases/PriceTest/PriceTestLocators');
//importing locators from price test locators

var test=require('/Users/mindfire/Desktop/ProtractorNew/Test Cases/Util');
//importing functions from Util.js

var preq=require('/Users/mindfire/Desktop/ProtractorNew/Test Cases/FlightSearchTest/FlightSearchLocators');
//importing locators from FlightSearchLocators.js


describe("Testing from the right price",function(){

    beforeEach(function(){
        browser.ignoreSynchronization=true; 
        browser.get("https://www.airasia.com/booking/home/en/gb");
        
        it("Searching flights between two cities",function(){

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
        });
    });
        it("Checking for the prices",function(){

        
        })
    });