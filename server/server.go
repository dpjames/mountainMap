package main

import (
   "fmt"
   "github.com/gorilla/mux"
   //"github.com/gorilla/sessions"
   "net/http"
   "log"
)

const PORT string = "8000"
func main() {
   r := mux.NewRouter()
   fmt.Println("Listening on port ", PORT);
   r.PathPrefix("/").Handler(http.FileServer(http.Dir("./public")))
   log.Fatal(http.ListenAndServe(":" + string(PORT), r))
}
