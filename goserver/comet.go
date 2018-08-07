package main

import (
      "fmt"
      "net/http"
      "github.com/gorilla/mux"
      "encoding/json"
)
type CometMessage struct {
   //This is the path to be requested to GET the updated info
   Path string
}
func wait(w http.ResponseWriter, r *http.Request){
   fmt.Println("waiting on lock")
   cometCount++
   msg := <-cometChan
   b, err := json.Marshal(msg)
   if(err != nil ){
      w.Write([]byte("something happened"))
      return
   }
   w.Write(b)
}
func signal(w http.ResponseWriter, r *http.Request, path string){
   fmt.Println("unlock all")
   for cometCount > 0 {
      fmt.Println("cometCount is ", cometCount)
      cometCount--
      cometChan <- CometMessage{path}
   }
   fmt.Println("unlocked all")

}
func comet(w http.ResponseWriter, r *http.Request){
   if(!loggedIn(w, r)){
      return
   }
   fmt.Println("in")
   vars := mux.Vars(r)
   switch(vars["op"]){
      case "wait":
         wait(w, r)
         break
      case "signal":
         go signal(w, r, "unknown")
         break
   }
}
