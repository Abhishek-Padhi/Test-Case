import { builtinModules } from "module";

var pricetest=function(){
    var DepartPrice=element(by.css('.fare-date-item ng-star-inserted active .price')).getText();
    var ReturnPrice=element(by.css('.fare-date-item active ng-star-inserted .price')).getText();
    var MinDepartPrice=element(by.xpath('//*[@id="amount-desc"]')).getText();
    var MinReturnPrice=element(by.xpath('//*[@id="low-amount-desc"]')).getText();
    var total=element(by.css('.booking-summary-content bottom-booking-wrapper .amount-text')).getText();
    var continueButton=element(by.className('waves-effect waves-light'));


}
modules.export=new pricetest();
