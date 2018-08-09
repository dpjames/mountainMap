let map = undefined;
let peaksLayer = undefined;
let callout = undefined;
let foundLayer = undefined;
const MAX_ZOOM = 15;

function peaksStyleFunction(feature){
   const num = feature.get("features").length; 
      let image = null;
      let theText = "";
      if(num === 1){
         image = new ol.style.RegularShape({
            points:3,
            radius:20,
            angle:Math.PI/3,
            rotation:Math.PI,
            fill:new ol.style.Fill({color:"black"}),
            stroke: new ol.style.Stroke({color:"red",width:1 })});
      } else {
         theText = num.toString();
         image = new ol.style.Circle({
            radius:20,
            fill:new ol.style.Fill({color:"black"}),
            stroke: new ol.style.Stroke({color:"red",width:1 })});
      }
      let text = new ol.style.Text({
         scale:1.3,
         text: theText,
         fill: new ol.style.Fill({color:"white"}),
         stroke: new ol.style.Stroke({color:"black", width:5}),});
      return [new ol.style.Style({text:text, image:image})];
}



function initMap(){
   initPeaksLayer("./ppeaks.geojson");
   callout = new ol.Overlay({
      element: document.getElementById("popup")});
   layers = [
      new ol.layer.Tile({source: new ol.source.OSM({crossOrigin : null})}),
      peaksLayer];
   const view = new ol.View({
      center: ol.proj.fromLonLat([-122.44, 47.25]),
      zoom: 7});
   map = new ol.Map({
      target:"map",
      layers:layers,
      view: view,
      });
   map.addOverlay(callout);
   map.on("click", mapClick);
   //map.on("moveend", mapMove);
   /*
   map.getView().on('change:resolution',function(e){
      // change cluster distance here (and refresh it)
      console.log(e);
      peaksLayer.getSource().setDistance(10);
   });
   */
}
function mapMove(e){
   const map = e.map;
   const extent = e.frameState.extent;
   const url = getURL(extent); 
   /*
   fetch(url)
      .then(function(res){
         return res.json();
      })
      .then(function(json){
         diffFeatures(json);
      });
   */
   var oldPeaks = peaksLayer;
   initPeaksLayer(url);
   map.addLayer(peaksLayer);
   peaksLayer.on("postcompose", function(e){
      if(peaksLayer.getVisible()){
         map.removeLayer(oldPeaks);
      }
   });
}
function getURL(extent){
   console.log(extent);
   const ul = ol.proj.toLonLat([extent[0],extent[1]])
   const lr = ol.proj.toLonLat([extent[2],extent[3]])
   let url = "/peaks?";
   url+="ul=";
   url+=(ul[0] + "," + ul[1]);
   url+="&lr=";
   url+=(lr[0] + "," + lr[1]);
   return url;
}
function diffFeatures(json){
   let geojsonformat = new ol.format.GeoJSON();
   let newfeatures = geojsonformat.readFeatures(json, {featureProjection: 'EPSG:3857'});
   let clusterFeatures = peaksLayer.getSource().features
   let oldfeatures = [];
   clusterFeatures.forEach(function(f){
      f.get("features").forEach(function(ff){
         oldfeatures.push(ff); 
      });
   });
   let goodfeatures = []
   newfeatures.forEach(function(nf, nfindex){
      oldfeatures.forEach(function(of, ofindex){
         if(of.get("NAME") === nf.get("NAME")){
            newfeatures.splice(nfindex, 1);
            oldfeatures.splice(ofindex, 1);
            goodfeatures.push(of);
            return;
         } 
      });
   });
   peaksLayer.getSource().getSource().addFeatures(newfeatures);
   fsrc = peaksLayer.getSource().getSource();
   oldfeatures.forEach(function(f){
      fsrc.removeFeature(f);
   });
   /*
   newfeatures.forEach(function(f){
      peaksLayer.getSource().getSource().addFeature(f);
   });
   */
} 
function initPeaksLayer(url){
   const src = new ol.source.Vector({
      format: new ol.format.GeoJSON(),
      url:getURL,
      strategy: ol.loadingstrategy.bbox});
   const clusterSrc = new ol.source.Cluster({
      distance: 100,
      source: src});
   peaksLayer = new ol.layer.Vector({
      title: "peaks layer",
      source: clusterSrc,
      style: peaksStyleFunction});
}
function populateCallout(f, c){
   const props = f.getProperties();
   let link = document.getElementById("link");
   link.setAttribute("href", "https://www.summitpost.org"+props.URL.replace(" ",""));
   link.innerHTML = props.NAME;
   document.getElementById("rating").innerHTML = props.SCORE;
   document.getElementById("hits").innerHTML = props.HITS;
   populateBetaView(props.URL);
   callout.setPosition(c);
}
function zoomTo(e){
   map.getView().fit(JSON.parse(e), map.getSize());
   if(map.getView().getZoom() > MAX_ZOOM){
      map.getView().setZoom(MAX_ZOOM);
   }
}
function populateBetaView(url){
   document.getElementById("betaView").setAttribute("src", "https://www.summitpost.org"+url.replace(" ",""));
}
function populateOverlay(features){
   const ro = document.getElementById("rollover");
   ro.innerHTML = "";
   var count = 0;
   features.forEach(function(f){
      if(count >= 100){
         return;
      }
      count++;
      const props = f.getProperties();
      const name = props.NAME;
      const hits = props.HITS;
      const rate = props.SCORE;
      const link = props.URL;
      const extent = f.getGeometry().getExtent();
      const entry = [
         "<div class='entry' id='"+name+"Entry'>",
         "<h4>",
         "<div class='entryName' onclick='populateBetaView(\""+link+"\")'>",
         name,
         "</div>",
         "</h4>",
         "<div>",
         hits,
         " hits",
         "</div>",
         "<div>",
         rate,
         "% rating",
         "</div>",
         "<button onclick='zoomTo(\""+JSON.stringify(extent)+"\")'>",
         "Zoom To",
         "</button>",
         "</div>",
      ].join("");
      ro.innerHTML += entry;
   });
}
function isSmallScreen(){
   return (getWidth() < 1200)
}
function toggleLeftTab(){
   const leftTab = document.getElementById("leftTab");
   leftTab.classList.toggle("hide");
   const toggle = document.getElementById("leftTabToggle");
   const expand = toggle.innerHTML === "&gt;";
   if(expand){
      toggle.innerHTML = "&lt;";
      if(isSmallScreen()){
         toggle.style.left = (leftTab.offsetWidth - toggle.offsetWidth) + "px";
      } else {
         toggle.style.left = leftTab.offsetWidth+"px";
      }
   }else{
      toggle.innerHTML = "&gt;";
      toggle.style.left = "0";
   }
}
function mapClick(evt){
   let hasFeature = false;
   map.forEachFeatureAtPixel(evt.pixel, function(cluster){
      hasFeature = true;
      const features = cluster.get("features");
      if(features.length === 1){
         populateCallout(features[0], evt.coordinate);   
      } else {
         populateOverlay(features);
      }
   });
   if(!hasFeature){
      callout.setPosition(undefined);
   }
}
function main(){
   initMap();
}
function showSubset(found){
   map.removeLayer(foundLayer);
   const source = new ol.source.Vector({features:found});   
   const clusterSource = new ol.source.Cluster({
      distance: 40,
      source: source});
   foundLayer = new ol.layer.Vector({
      title: "search results",
      source: clusterSource,
      style: peaksStyleFunction,
   });
   map.addLayer(foundLayer);
}
function hidePeaks(){
   map.removeLayer(peaksLayer)
}
function showPeaks(){
   map.removeLayer(foundLayer);
   map.addLayer(peaksLayer);
}
function search(){
   let searchStr = document.getElementById("searchString").value;
   filter(function(f){
      return f.getProperties().NAME.toLowerCase().indexOf(searchStr) >=0;
   });
}
function filter(condition){
   let all = peaksLayer.getSource().getFeatures();
   let found = [];
   all.forEach(function(cluster){
      cluster.get("features").forEach(function(feature){
         if(condition(feature)){
            found.push(feature);
         }
      });
   });
   hidePeaks();
   showSubset(found);
   populateOverlay(found);
}
function filterClick(){
   const fieldEl = document.getElementById("filterField");
   const field = fieldEl.options[fieldEl.selectedIndex].value
   const opEl = document.getElementById("filterOperator");
   const op = opEl.options[opEl.selectedIndex].value
   const value = document.getElementById("filterValue").value;
   var opFunction = function(op1, op2){
      switch(op){
         case "<":
            return op1 < op2;
         case ">":
            return op1 > op2;
         case "=":
            return op1 == op2;
      }
   };
   filter(function(f){
      const props = f.getProperties();
      const fvalue = props[field] 
      return opFunction(fvalue, value);
   });
}

function getWidth() {
   return Math.max(
      document.body.scrollWidth,
      document.documentElement.scrollWidth,
      document.body.offsetWidth,
      document.documentElement.offsetWidth,
      document.documentElement.clientWidth
   );
}

function getHeight() {
   return Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight,
      document.documentElement.clientHeight
   );
}

window.onload = main;
