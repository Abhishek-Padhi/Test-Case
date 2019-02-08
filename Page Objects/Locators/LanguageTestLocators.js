var langtest=function(){
this.LangButton=element.all(by.css('.text-item')).get(0);
this.Thai=element(by.xpath("//span[text()='ภาษาไทย']"));
this.Indonesian=element(by.xpath("//span[text()='Bahasa Indonesia']"));
this.TraditionalChinese=element(by.xpath("//span[text()='繁體中文']"));
this.Malaysian=element(by.xpath("//span[text()='Bahasa Malaysia']"));
this.English=element(by.xpath("//span[text()='English']"));
this.CustomerSupport=element(by.xpath('//*[@class="navMenu-wrapper"]/ul/li[4]/a'));
this.FlightStatus=element(by.xpath('//*[@class="navMenu-wrapper"]/ul/li[3]/a'));
this.CheckIn=element(by.xpath('//*[@class="navMenu-wrapper"]/ul/li[2]/a'));
this.MyBookings=element(by.xpath('//*[@class="navMenu-wrapper"]/ul/li[1]/a'));


}
module.exports=new langtest();
