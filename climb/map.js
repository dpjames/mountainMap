let map = undefined;
let peaksLayer = undefined;
let callout = undefined;
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

function initPeaksLayer(){
   const src = new ol.source.Vector({
      url:"./peaks.geojson", 
      format: new ol.format.GeoJSON()});
   const clusterSrc = new ol.source.Cluster({
      distance: 40,
      source: src});
   peaksLayer = new ol.layer.Vector({
      title: "peaks layer",
      source: clusterSrc,
      style: peaksStyleFunction,
      });
}

function initMap(){
   initPeaksLayer();
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
}
function populateCallout(f, c){
   const props = f.getProperties();
   let googleLink = document.getElementById("link");
   googleLink.setAttribute("href",
      "https://www.google.com/search?q="
      +"site:www.summitpost.org+"
      +props.NAME.replace(" ", "+"));
   googleLink.innerHTML = props.NAME;
   document.getElementById("rating").innerHTML = props.SCORE;
   document.getElementById("hits").innerHTML = props.HITS;
   document.getElementById("betaView").setAttribute("src", "https://www.summitpost.org"+props.URL.replace(" ",""));
   callout.setPosition(c);
}
function zoomTo(e){
   map.getView().fit(JSON.parse(e), map.getSize());
   if(map.getView().getZoom() > MAX_ZOOM){
      map.getView().setZoom(MAX_ZOOM);
   }
}
function populateOverlay(features){
   const ro = document.getElementById("rollover");
   ro.innerHTML = "";
   features.forEach(function(f){
      const props = f.getProperties();
      console.log(props);
      const name = props.NAME;
      const hits = props.HITS;
      const rate = props.SCORE;
      const link = "https://www.google.com/search?q="
                  +"site:www.summitpost.org+"
                  + name.replace(" ", "+");
      const extent = f.getGeometry().getExtent();
      const entry = [
         "<div id='"+name+"Entry'>",
         "<h4>",
         "<a href='"+link+"'>",
         name,
         "</a>",
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
function mapClick(evt){
   map.forEachFeatureAtPixel(evt.pixel, function(cluster){
      const features = cluster.get("features");
      if(features.length === 1){
         populateCallout(features[0], evt.coordinate);   
      } else {
         populateOverlay(features);
      }
   });
}
function main(){
   initMap();
}

window.onload = main;
