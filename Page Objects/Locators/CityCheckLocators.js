var CityCheckLocators = function () {

    this.DepartRoute = element.all(by.css('.origin-destination-label #origin-destination-label-desc')).get(0);
    this.ReturnRoute = element.all(by.css('.origin-destination-label #origin-destination-label-desc')).get(1);
    this.OriginTextBox = element(by.id('-origin-autocomplete-heatmap'));
    this.DestinationTextBox = element(by.id("-destination-autocomplete-heatmap"));
    this.DepartDate = element(by.id("-depart-autocomplete-heatmap"));
    this.returnDate = element(by.id("-return-autocomplete-heatmap"));
    this.DateSubmit = element(by.className('calendar-button'));
    this.SearchButton = element(by.id("flight-search-airasia-button-inner-button-select-flight-heatmap"));

}
module.exports=new CityCheckLocators();
// //*[@id="origin-destination-label-desc"]