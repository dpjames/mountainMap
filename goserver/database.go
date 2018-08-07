package main

import (
      "encoding/json"
      "net/http"
      "time"
      "fmt"
	   _ "github.com/go-sql-driver/mysql"
)


func insertNewUser(username string, hash []byte){
   stmt, err := db.Prepare("INSERT INTO users (username, password, created) VALUES (?, ?, ?)")
   if(err != nil){
      fmt.Println(err)
      return
   }
   _, err = stmt.Exec(username, hash, time.Now().Unix());
   if(err != nil){
      fmt.Println(err)
   }
}

func signup(w http.ResponseWriter, r *http.Request){
   info := new(Login)
   defer r.Body.Close()
   json.NewDecoder(r.Body).Decode(info)
   hash := hashPass(info.Password)
   fmt.Println(hash)
   if(getUserId(info.Username) != -1){
      w.Write([]byte("{\"type\" : \"DB\", \"msg\" : \"User already exists\" }"))
   } else {
      insertNewUser(info.Username, hash)
   }
}

func getUserId(username string) int {
   id := -1
   rows, err := db.Query("select id from users where username = ?", username)
   if(err != nil){
      fmt.Println("one")
      fmt.Println(err)
   }
   defer rows.Close()
   for rows.Next() {
      err := rows.Scan(&id)
      if(err != nil){
         fmt.Println("two")
         fmt.Println(err)
      }
      fmt.Println(id)
   }
   err = rows.Err()
   if(err != nil){
         fmt.Println("three")
         fmt.Println(err)
   }
   return id
}
