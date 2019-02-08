var FlightSearchLocators=function(){
    this.OriginTextBox=element(by.id('-origin-autocomplete-heatmap'));
    this.DestinationTextBox=element(by.id("-destination-autocomplete-heatmap"));
    this.DepartDate=element(by.id("-depart-autocomplete-heatmap"));
    this.returnDate=element(by.id("-return-autocomplete-heatmap"));
    this.DateSubmit=element(by.className('calendar-button'));
    this.SearchButton=element(by.id("flight-search-airasia-button-inner-button-select-flight-heatmap"));
    this.OriginCity="Bhubaneswar";
    this.DestinationCity="Bengaluru";
    this.DepartureDate="14/02/2019";
    this.ReturnDate="17/02/2019";
    this.check=element.all(by.css('.origin-destination-label')).get(1);
}
module.exports= new FlightSearchLocators();
