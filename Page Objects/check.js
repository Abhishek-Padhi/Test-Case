

describe("sample",function(){

    it("test",function(){
    browser.ignoreSynchronization=true;
    browser.get("https://www.airasia.com/booking/home/en/gb");
    browser.sleep(8000);
    element.all(by.css('.text-item')).get(0).click();
    browser.sleep(3000);
    element(by.xpath("//span[text()='ภาษาไทย']")).click();
    browser.sleep(6000);
    console.log("Working");
    browser.sleep(3000);
    var lan=element(by.xpath('//*[@class="navMenu-wrapper"]/ul/li[2]/a')).getText();
    expect(lan).toEqual("สถานะเที่ยวบิน");

    console.log("working");
    browser.sleep(5000);




    })

    
})