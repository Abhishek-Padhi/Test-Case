//importing locators from LanguageTestLocators.js
var LanguageTest = require(".././Page Objects/LanguageTestLocators");

//import functions from Util.js
var test = require('./Util');

var preq=require('./constants');

describe("Testing change of language", function () {

    preq;

    it("Testing for Thai Language", function () {
        test.waitClick(LanguageTest.LangButton);
        test.waitClick(LanguageTest.Thai);

        browser.wait(LanguageTest.CustomerSupport.getText().isDisplayed(), 30000).then(function () {
            expect(LanguageTest.CustomerSupport.getText()).toEqual("บริการช่วยเหลือของแอร์เอเชีย");
            console.log("working");
        })

        browser.wait(LanguageTest.FlightStatus.getText().isDisplayed(), 20000).then(function () {
            expect(LanguageTest.FlightStatus.getText()).toEqual("สถานะเที่ยวบิน");
        })
        browser.wait(LanguageTest.CheckIn.getText().isDisplayed(), 20000).then(function () {
            expect(LanguageTest.CheckIn.getText()).toEqual("เช็คอิน");

        })
        browser.wait(LanguageTest.MyBookings.getText().isDisplayed(), 20000).then(function () {
            expect(LanguageTest.MyBookings.getText()).toMatch("จัดการบุ๊คกิ้ง");

        })
    });



    it("testing for traditiona Chinese", function () {
        test.waitClick(LanguageTest.LangButton);
        test.waitClick(LanguageTest.TraditionalChinese);

        browser.wait(LanguageTest.CustomerSupport.getText().isDisplayed(), 20000).then(function () {
            expect(LanguageTest.CustomerSupport.getText()).toEqual("顧客支援");
            console.log("working");
        })

        browser.wait(LanguageTest.FlightStatus.getText().isDisplayed(), 20000).then(function () {
            expect(LanguageTest.FlightStatus.getText()).toEqual("航班狀態");
        })
        browser.wait(LanguageTest.CheckIn.getText().isDisplayed(), 20000).then(function () {
            expect(LanguageTest.CheckIn.getText()).toEqual("報到");

        })
        browser.wait(LanguageTest.MyBookings.getText().isDisplayed(), 20000).then(function () {
            expect(LanguageTest.MyBookings.getText()).toMatch("我的預訂");

        })



    });



    it("testing for Indonesian", function () {
        test.waitClick(LanguageTest.LangButton);
        test.waitClick(LanguageTest.Indonesian);

        browser.wait(LanguageTest.CustomerSupport.getText().isDisplayed(), 20000).then(function () {
            expect(LanguageTest.CustomerSupport.getText()).toEqual("Pelayanan Pelanggan");
            console.log("working");
        })

        browser.wait(LanguageTest.FlightStatus.getText().isDisplayed(), 20000).then(function () {
            expect(LanguageTest.FlightStatus.getText()).toEqual("Status Penerbangan");
        })
        browser.wait(LanguageTest.CheckIn.getText().isDisplayed(), 20000).then(function () {
            expect(LanguageTest.CheckIn.getText()).toEqual("Check-in");

        })
        browser.wait(LanguageTest.MyBookings.getText().isDisplayed(), 20000).then(function () {
            expect(LanguageTest.MyBookings.getText()).toMatch("Pembelian Saya");

        })



    });


    it("testing for Malaysian", function () {
        test.waitClick(LanguageTest.LangButton);
        test.waitClick(LanguageTest.Malaysian);

        browser.wait(LanguageTest.CustomerSupport.getText().isDisplayed(), 20000).then(function () {
            expect(LanguageTest.CustomerSupport.getText()).toEqual("Khidmat Bantuan Pelanggan");
            console.log("working");
        })

        browser.wait(LanguageTest.FlightStatus.getText().isDisplayed(), 20000).then(function () {
            expect(LanguageTest.FlightStatus.getText()).toEqual("Status penerbangan");
        })
        browser.wait(LanguageTest.CheckIn.getText().isDisplayed(), 20000).then(function () {
            expect(LanguageTest.CheckIn.getText()).toEqual("Daftar masuk");

        })
        browser.wait(LanguageTest.MyBookings.getText().isDisplayed(), 20000).then(function () {
            expect(LanguageTest.MyBookings.getText()).toMatch("Tempahan saya");

        })



    });



});

