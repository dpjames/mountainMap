package main

import (
      "fmt"
      "log"
      "net/http"
      "github.com/gorilla/mux"
      "database/sql"
	   _ "github.com/go-sql-driver/mysql"
      "io/ioutil"
      "encoding/json"

)
//This NEEDS to be changed lol TODO
var store = sessions.NewCookieStore([]byte("something-very-secret"))
var db *sql.DB
var cometChan chan CometMessage
var cometCount int
func setupDB(){
   var err error
   db, err = sql.Open("mysql", "sqlUser:sqlPass@tcp(localhost:3306)/goserver")
   if(err != nil){
      fmt.Println(err)
   }
   err = db.Ping()
   if(err != nil){
      fmt.Println(err)
   }
}
func setupComet(){
   cometChan = make(chan CometMessage)
   cometCount = 0
}

type Message struct {
   Msg string
}
var lastMessage Message

func msgPost(w http.ResponseWriter, r *http.Request){
   if(!loggedIn(w,r)){
      return
   }
   //update msg db
   b, err := ioutil.ReadAll(r.Body)
   if(err != nil){
      fmt.Println(err);
      return;
   }
   json.Unmarshal(b, &lastMessage)
   signal(w,r,"msg?time=now")
}

func msgGet(w http.ResponseWriter, r *http.Request){
   if(!loggedIn(w,r)){
      return
   }
   keys, ok := r.URL.Query()["time"]
   if(!ok){
      fmt.Println("not okay");
   }
   fmt.Println(keys);
   w.Write([]byte("{\"msg\":\"" + lastMessage.Msg + "\"}"))
}

func main() {
   setupDB()
   setupComet()
   r := mux.NewRouter()
   r.HandleFunc("/comet/{op}", comet).Methods("POST")
   r.HandleFunc("/auth/{op}", authHandle).Methods("POST")
   r.HandleFunc("/msg", msgPost).Methods("POST")
   r.HandleFunc("/msg", msgGet).Methods("GET")
   r.HandleFunc("/home", homeHandle)
   r.PathPrefix("/").Handler(http.FileServer(http.Dir("./html")))
   log.Fatal(http.ListenAndServe(":80", r))
   db.Close()
}
