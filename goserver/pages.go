package main

import (
      "fmt"
      "net/http"
	   _ "github.com/go-sql-driver/mysql"
      "io/ioutil"
      "encoding/json"
)
func homeRouter(w http.ResponseWriter, r *http.Request){
   // asking for {navbar : data, content : data, footer : data}
   b, err := json.Marshal(homePage())
   if(err != nil){
      w.Write([]byte("something happened"))
      return
   }
   w.Write(b)
}
func homeHandle(w http.ResponseWriter, r *http.Request){
   if(!loggedIn(w,r)){
      return
   }
   homeRouter(w, r)
}
type Page struct {
   Navbar string
   Content string
   Footer string
   Js string
   Css string
}
func homePage() Page{
   nav, err := ioutil.ReadFile("pages/nav.html")
   if(err != nil){
      fmt.Println(err)
      return Page{"err","err","err","err","err"}
   }
   cont, err := ioutil.ReadFile("pages/home.html")
   if(err != nil){
      fmt.Println(err)
      return Page{"err","err","err","err","err"}
   }
   foot, err := ioutil.ReadFile("pages/foot.html")
   if(err != nil){
      fmt.Println(err)
      return Page{"err","err","err","err","err"}
   }
   js, err := ioutil.ReadFile("pages/home.js")
   if(err != nil){
      fmt.Println(err)
      return Page{"err","err","err","err","err"}
   }
   css, err := ioutil.ReadFile("pages/home.css")
   return Page{string(nav), string(cont), string(foot), string(js), string(css)}
}
