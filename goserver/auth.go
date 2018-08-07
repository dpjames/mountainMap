package main
import (
      "net/http"
      "fmt"
      "github.com/gorilla/mux"
      "encoding/json"
	   "golang.org/x/crypto/bcrypt"
)
type Login struct {
   Username string
   Password string
}
func authHandle(w http.ResponseWriter, r *http.Request){
   vars := mux.Vars(r)
   switch(vars["op"]){
      case "login":
         fmt.Println("login")
         login(w,r)
         break
      case "signup":
         fmt.Println("signup")
         signup(w,r)
         break
      case "logout":
         fmt.Println("logout")
         logout(w,r)
      default:
         fmt.Println("not found")
         http.NotFound(w,r)
         break
   }
}
func hashPass(password string) []byte{
   fmt.Println(password)
   hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.MinCost)
   if(err != nil){
      fmt.Println(err)
   }
   return hash
}

func checkUserPassword(id int, password string) bool {
   hash := []byte{}
   row, err := db.Query("Select password from users where id = ?", id)
   if( err != nil){
      fmt.Println(err)
   }
   defer row.Close()
   row.Next()
   err = row.Scan(&hash)
   if(err != nil){
      fmt.Println(err)
   }
   err = bcrypt.CompareHashAndPassword(hash, []byte(password))
   if(err != nil){
      fmt.Println(err)
      return false
   }
   return true
}
func logout(w http.ResponseWriter, r *http.Request){
   session, err := store.Get(r, "thisisacookiename")
   if(err != nil){
      http.Error(w, err.Error(), http.StatusInternalServerError)
      return
   }
   for k := range session.Values {
      delete(session.Values, k)
   }
   session.Save(r,w)
}
func login(w http.ResponseWriter, r *http.Request){
   response := ""
   info := new(Login)
   defer r.Body.Close()
   json.NewDecoder(r.Body).Decode(info)
   id := getUserId(info.Username)
   fmt.Println("id is ", id)
   if(checkUserPassword(id, info.Password)){
      session, err := store.Get(r, "thisisacookiename")
      if(err != nil){
         http.Error(w, err.Error(), http.StatusInternalServerError)
         return
      }
      fmt.Println("you are logged in")
      session.Values["loggedin"] = true
      session.Values["username"] = info.Username
      err = session.Save(r, w)
      if(err !=nil){
         fmt.Println(err)
         return
      } else {
         response = "{\"status\" : true}"
      }
   } else {
      fmt.Println("bad password given")
      response = "{\"status\" : false}"
   }
   w.Write([]byte(response))
}


func loggedIn(w http.ResponseWriter, r *http.Request) bool{
   session, err := store.Get(r, "thisisacookiename")
   if(err != nil){
      http.Error(w, err.Error(), http.StatusInternalServerError)
   }
   fmt.Println(session.Values["loggedin"])
   if(session.Values["loggedin"] == nil || !session.Values["loggedin"].(bool)){
      w.Write([]byte("youre not logged in"))
      return false
   }
   return true;
}
