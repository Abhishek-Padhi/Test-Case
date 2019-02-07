var logloc=function(){
    this.select=element(by.css('.login .text-item'));
    this.email=element(by.xpath('//*[@id="username-input--login"]'));
    this.password=element(by.id('password-input--login'));
    this.loginButton=element(by.id('loginbutton'));
    
    



}
module.exports= new logloc();
