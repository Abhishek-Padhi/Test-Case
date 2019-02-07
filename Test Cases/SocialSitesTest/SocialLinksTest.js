var SocialLinks=require('/Users/mindfire/Desktop/ProtractorNew/Page Objects/Locators/SocialLinksLocators');
//importing locators form SocialLinksLocators file

var test=require('/Users/mindfire/Desktop/ProtractorNew/Test Cases/Util.js');
//importing from util.js file


describe("Testing the Social Network Buttons",function(){

    beforeEach(function(){
        browser.ignoreSynchronization=true; 
        browser.get("https://www.airasia.com/booking/home/en/gb");
        
        
        });

    it("Testing the Facebook Button",function(){
//Scrolling to the bottom of the page
browser.executeScript('window.scrollTo(0, document.body.scrollHeight)').then(function () {

    //clicking the facebook button

    test.waitClick(SocialLinks.FacebookLocator);
    

    }) 

    //Accessing evry tab opened in the window

         browser.getAllWindowHandles().then(function(handles)  {
             //switching to newly opened tab

             browser.switchTo().window(handles[1]).then(function()  {


                //Getting the URL from the new tab

                browser.wait(browser.getCurrentUrl()).then(function() { 


                 //matches the url of the current page with the desired url

                 expect(browser.getCurrentUrl()).toContain('https://www.facebook.com/AirAsia');

                })

                 //Printing that AirAsia Facebook page is opened

                 console.log('AirAsia Facebook Page opened');

                //closing the opened tab
                 browser.close();


                //Switching back to the first Tab
                browser.switchTo().window(handles[0]);

         });
    });
           
 });


            it("Testing the Twitter Button",function(){
                //Scrolling to the bottom of the page
                browser.executeScript('window.scrollTo(0, document.body.scrollHeight)').then(function () {
                
                    //clicking the twitter button
                
                    test.waitClick(SocialLinks.twitterLocator);
                    
                
                    }) 
                
                    //Accessing evry tab opened in the window
                
                         browser.getAllWindowHandles().then(function(handles)  {
                             //switching to newly opened tab
                
                             browser.switchTo().window(handles[1]).then(function()  {
                
                
                                //Getting the URL from the new tab
                
                                browser.wait(browser.getCurrentUrl()).then(function() { 
                
                
                                 //matches the url of the current page with the desired url
                
                                 expect(browser.getCurrentUrl()).toContain('https://twitter.com/AirAsia');
                
                                })
                
                                 //Printing that AirAsia Twitter page is opened
                
                                 console.log('AirAsia Twitter Page opened');

                                 //closing the opened tab
                
                            browser.close();

                            //Switching back to the first tab
                            browser.switchTo().window(handles[0]);
                
                
                                });
                            });
                            
                        
        });

        it("Testing the Instagram Button",function(){
            //Scrolling to the bottom of the page
            browser.executeScript('window.scrollTo(0, document.body.scrollHeight)').then(function () {
            
                //clicking the Instagram button
            
                test.waitClick(SocialLinks.instagramLocator);
                
             }) 
            
                //Accessing evry tab opened in the window
            
                     browser.getAllWindowHandles().then(function(handles)  {
                         //switching to newly opened tab
            
                         browser.switchTo().window(handles[1]).then(function()  {
            
            
                            //Getting the URL from the new tab
            
                            browser.wait(browser.getCurrentUrl()).then(function() { 
            
            
                             //matches the url of the current page with the desired url
            
                             expect(browser.getCurrentUrl()).toContain('https://www.instagram.com/airasia/');
            
                            })
            
                             //Printing that AirAsia Instagram page is opened
            
                             console.log('AirAsia Instagram Page opened');

                             //closing the opened tab
            
                        browser.close();

                        //Switching back to the first tab
                        browser.switchTo().window(handles[0]);
            
            
                            });
                        });
                        
                    
    });
    it("Testing the Youtube Button",function(){
        //Scrolling to the bottom of the page
        browser.executeScript('window.scrollTo(0, document.body.scrollHeight)').then(function () {
        
            //clicking the Instagram button
        
            test.waitClick(SocialLinks.YoutubeLocator);
            
         }) 
        
            //Accessing evry tab opened in the window
        
                 browser.getAllWindowHandles().then(function(handles)  {
                     //switching to newly opened tab
        
                     browser.switchTo().window(handles[1]).then(function()  {
        
        
                        //Getting the URL from the new tab
        
                        browser.wait(browser.getCurrentUrl()).then(function() { 
        
        
                         //matches the url of the current page with the desired url
        
                         expect(browser.getCurrentUrl()).toContain('https://www.youtube.com/user/airasia');
        
                        })
        
                         //Printing that AirAsia Youtube page is opened
        
                         console.log('AirAsia Youtube Page opened');

                         //closing the opened tab
        
                    browser.close();

                    //Switching back to the first tab
                    browser.switchTo().window(handles[0]);
        
        
                        });
                    });
                    
                
});
});
    

