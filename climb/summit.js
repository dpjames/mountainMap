const https = require('https');
const NUM_PAGES = 301;
const GET_ALLOW = 1;
const base = "https://www.summitpost.org/mountain/rock/p"; 
const TOTAL_LOCATIONS = 14444;
let CURRENT_GETS = 0;
let PAGES_DOWNLOADED = 0;
let LOCATIONS_GOT = 0;
let pageNumber = 1;
function extractUrls(html){
   urls = [];
   while(true){
      let curIndex = html.indexOf('cci-thumb');
      curIndex = html.indexOf('href', curIndex) + 6;
      endIndex = html.indexOf(">",    curIndex) - 1;
      let thisURL = html.substring(curIndex, endIndex);
      if(thisURL.toLowerCase().indexOf("object") >= 0){
         break;
      }
      urls.push(thisURL);
      html = html.substring(endIndex);
   }
   console.error(PAGES_DOWNLOADED++, " pages downloaded");
   return urls;
}
function handleWrapper(cb){
   CURRENT_GETS++;
   var ret = function(res){
      let content = "";  
      res.on("data", function(chunk){
         content+=chunk.toString();
      });
      res.on("end", function(){
         CURRENT_GETS--;
         cb(content);
      });
   };
   return ret;
}
function printCSV(data){
   if(LOCATIONS_GOT++%100 === 0){
      console.error(LOCATIONS_GOT, " locations got");
   }
   let output = "";
   data.forEach(function(v){
      output+=(String(v).replace(/,/g,''));
      output+=(", ");
   });
   output = output.substring(0, output.length-2);
   console.log(output);
}
function locationHandle(content){
   let index = content.indexOf("Lat/Lon:");
   if(index < 0){
      return;
   }
   //get the name
   let nameStart = content.indexOf('<h1>') + 4;
   let nameEnd   = content.indexOf('</', nameStart);
   let name      = content.substring(nameStart, nameEnd);
   //get the number of hits
   let hitEnd    = content.indexOf('Hits');
   let hitStart  = content.lastIndexOf('>', hitEnd)+1;
   let hits      = content.substring(hitStart, hitEnd);
   //get the score
   let scoreStart= content.indexOf('id="score"', hitEnd)+11; 
   let scoreEnd  = content.indexOf('<', scoreStart);
   let score     = content.substring(scoreStart, scoreEnd);
   //get the location
   index = content.indexOf('<a', index);
   index = content.indexOf('>', index)+1;
   let end = content.indexOf('<', index);
   let loc = (content.substring(index, end));
   //49.75000&deg;N / 70.55&deg;W
   let latlon = loc.split("/");
   let lat = (latlon[0].split('&')[0]).replace(" ", "");
   lat = latlon[0].indexOf('N') > 0 ? lat : '-'+lat;
   let lon = (latlon[1].split('&')[0]).replace(" ", "");
   lon = latlon[1].indexOf('E') > 0 ? lon : '-'+lon;
   printCSV([name,lat,lon,loc,hits,score]);
}
function getLocations(urls){
   urls.forEach(function(url){
      https.get(base + url, handleWrapper(function(content){
         locationHandle(content);
         if(CURRENT_GETS < GET_ALLOW){
            console.error('dispatch');
            next();
         }
      })); 
   });
}
function pageHandle(content){
   let urls = extractUrls(content);
   getLocations(urls);
}
function next(){
   if(pageNumber > NUM_PAGES){
      return;
   }
   https.get(base+pageNumber, handleWrapper(pageHandle));
   pageNumber++;
}
function main(){
   printCSV(['NAME', 'LAT', 'LON', 'RAW', 'HITS', 'SCORE']);
   next();
   /*while(pageNumber <= NUM_PAGES){
      https.get(base+pageNumber, handleWrapper(pageHandle));
      pageNumber++;
   }*/
}
main();
