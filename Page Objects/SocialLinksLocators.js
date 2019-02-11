var socloc=function(){

    this.FacebookLocator=element.all(by.css("img[alt='AirAsia Facebook']")).get(0);
    this.twitterLocator=element.all(by.css("img[alt='AirAsia Twitter']")).get(0);
    this.instagramLocator=element.all(by.css("img[alt='AirAsia Instagram']")).get(0);
    this.YoutubeLocator=element.all(by.css("img[alt='AirAsia Youtube']")).get(0);

    
}
module.exports=new socloc();
