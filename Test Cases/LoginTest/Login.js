var Login = require('../../Page Objects/Login Locators');
//Importing locators from Login Locatos.js


var test = require('/Users/mindfire/Desktop/ProtractorNew/Test Cases/Util.js');
//importing functions from Util.js

var preq = require("../constants");

var emailId = "abhishekpadhidps@gmail.com";
var PassWord = "Heyman123";

//Checking login feature with valid input
describe("Checking the login function", function () {



    it("Testing the function", function () {


        //Navigating to the site
        preq;
        test.waitClick(Login.select);

        Login.email.sendKeys(emailId);
        Login.password.sendKeys(PassWord);
        Login.loginButton.click();

    });

});



