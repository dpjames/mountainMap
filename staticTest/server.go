package main

import (
   "fmt"
   "github.com/gorilla/mux"
   //"github.com/gorilla/sessions"
   "net/http"
   "log"
   "strings"
   "strconv"
   "bufio"
   "os"
)

const PORT string = "80"
const PEAKS_CSV string = "peaks.csv"
var peaks []Peak;


func sendError(code int, w http.ResponseWriter){
   w.Write([]byte("{'message':'hello world'}"));
}
func getPeaks(w http.ResponseWriter, r *http.Request){
   var query = r.URL.Query()
   var lr = strings.Split(query["lr"][0], ",")
   var ul = strings.Split(query["ul"][0], ",")
   var extentStrings = [4]string{
      ul[0],
      ul[1],
      lr[0],
      lr[1]}
   var extent [4]float64
   for i, e := range extentStrings{
      var err error
      extent[i], err = strconv.ParseFloat(e, 64);
      if(err != nil){
         fmt.Println("you gave bad input");
         sendError(400, w);
      }
   }
   results := findPeaksInExtent(extent);
   var response []Peak;
   for _, p := range results{
      response = append(response, p);
   }
   sendPeaks(response, w);
}
func jsonkvp(k string,v string,c bool) string{
   var commastring = "";
   if(c) {
      commastring = ",";
   }
   return " \""+k+"\": \""+v+"\""+commastring+" "
}
func sendPeaks(response []Peak, w http.ResponseWriter){
   var json string = "";
   json+="{"
   json+=jsonkvp("type","FeatureCollection", true);
   json+=("\"features\": ")
   json+="["
   for _, p := range response {
      json+="{"
      json+=jsonkvp("type", "Feature", true);
      json+=jsonkvp("id", p.ID, true);
      json+="\"geometry\": {"
      json+=jsonkvp("type", "Point", true);
      json+="\"coordinates\": [ "+fmt.Sprint(p.Lon)+", "+fmt.Sprint(p.Lat)+" ]"
      json+="}, "

      json+="\"properties\": {"
      json+=jsonkvp("NAME", p.Name, true);
      json+=jsonkvp("RAW", p.Raw, true);
      json+=jsonkvp("HITS", fmt.Sprint(p.Hits), true);
      json+=jsonkvp("SCORE", fmt.Sprint(p.Score), true);
      json+=jsonkvp("URL", p.Url, false);
      json+="}"

      json+="}, "
   }
   if(len(response) != 0){
      json = json[0:len(json)-2]
   }
   json+="]"
   json+="}"
   w.Write([]byte(json))
}
type Peak struct {
   Name string
   Lat float64
   Lon float64
   Raw string
   Hits int64
   Score float64
   Url string
   ID string
}

func findPeaksInExtent(extent [4]float64) []Peak{
   var results []Peak;
   //offset to not deal with neg values
   extent[0]+=180;
   extent[1]+=90;
   extent[2]+=180;
   extent[3]+=90;
   for _, p := range peaks{
      var lat = p.Lat;
      var lon = p.Lon;
      //offset to not deal with neg values
      lat+=90;
      lon+=180;
      if(lon > extent[0] && lon < extent[2] && lat > extent[1] && lat < extent[3]){
         results = append(results, p);
      }
   }
   return results;
}

func readPeaks() {
   file, err := os.Open(PEAKS_CSV)
   if(err != nil){
      fmt.Println("Cannot read peaks. exiting");
      os.Exit(1);
   }
   defer file.Close();
   scanner := bufio.NewScanner(file);
   i := 0;
   for scanner.Scan(){
      line := scanner.Text();
      values := strings.Split(line, ",");
      name := strings.Replace(strings.Trim(values[0], " "),
         "\"", "\\\"",-1)
      lat, err := strconv.ParseFloat(strings.Trim(values[1], " "), 64);
      lon, err := strconv.ParseFloat(strings.Trim(values[2], " "), 64);
      raw := strings.Trim(values[3], " ");
      hits, err := strconv.ParseInt(strings.Trim(values[4], " "), 10, 64);
      score, err := strconv.ParseFloat(strings.Trim(values[5], " "), 64);
      url := strings.Trim(values[6], " ");
      entry := Peak{
         name,
         lat,
         lon,
         raw,
         hits,
         score,
         url,
         fmt.Sprint(i)};
      i++;
      peaks = append(peaks, entry);
      if err != nil {
         fmt.Println(err);
         fmt.Println(line);
         fmt.Println("error reading peaks. exiting");
         os.Exit(1);
      }
   }
   if err := scanner.Err(); err != nil {
      fmt.Println("error reading peaks. exiting");
      os.Exit(1);
   }
}

func main() {
   r := mux.NewRouter()
   fmt.Println("Listening on port ", PORT);
   r.HandleFunc("/peaks", getPeaks).Methods("GET");
   r.PathPrefix("/").Handler(http.FileServer(http.Dir("./public")))
   log.Fatal(http.ListenAndServe(":" + string(PORT), r))
}
