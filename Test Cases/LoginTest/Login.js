var Login = require('/Users/mindfire/Desktop/ProtractorNew/Page Objects/Locators/Login Locators');
//Importing locators from Login Locatos.js


var test = require('/Users/mindfire/Desktop/ProtractorNew/Test Cases/Util.js');
//importing functions from Util.js

//Checking login feature with valid input
describe("Checking the login function", function () {



    it("Testing the function", function () {


        //Navigating to the site
        browser.get("https://www.airasia.com/booking/home/en/gb");


        browser.ignoreSynchronization = true;
        test.waitClick(Login.select);

        Login.email.sendKeys("abhishekpadhidps@gmail.com");
        Login.password.sendKeys("Heyman123#");
        Login.loginButton.click();

    });

});



