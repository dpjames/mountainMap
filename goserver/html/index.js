//libs
//
//
//
//
//
function getData(url, callback){
   fetch(url, {
      method: 'GET', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include',
   })
   .then(res => res.json())
   .then(res => callback(res))
   .catch(err => {
      console.log(err);
   });
}


function postData(url, data, callback) {
   var body = data == null ? null : JSON.stringify(data);
   return fetch(url, {
     body: body, 
     method: 'POST', // *GET, POST, PUT, DELETE, etc.
     credentials: 'include',
     headers : { "content-type" : "application/x-www-form-urlencoded" },
   })
   .then(response => response.json()) // parses response to JSON
   .then(response => callback(response))
   .catch(err => console.log(err));
}
function inject(js, css){
   console.log("injecting");
   console.log(js);
   console.log(css);
   var head = document.head;
   var style = document.createElement('style');
   style.appendChild(document.createTextNode(css));
   head.appendChild(style); 
   var script = document.createElement('script');
   script.appendChild(document.createTextNode(js));
   head.appendChild(script)
}

//end libs
//
//
//
//
//
//

function buildNav(){
   var nav = document.getElementById("navbar");
   
}
function buildContent(){
   var content = document.getElementById("mainContent");
   content.innerHTML = buildPage(content);  
}
function buildFooter(){
   var footer = document.getElementById("footer");
}
function login(){
   console.log("username is ", document.getElementById("username").value);
   console.log("password is ", document.getElementById("password").value);
   postData("auth/login", {
         username : document.getElementById("username").value, 
         password : document.getElementById("password").value
      },
      function(res){
         if(res.status){
            goTo("home");
         }
      });
}


function buildHome(){
   if(home !== undefined){
      nav.innerHTML = home.Navbar;
      content.innerHTML = home.Content;
      footer.innerHTML = home.Footer;
      return;
   }
   getData("home", function (res){
      home = res
      inject(res['Js'], res['Css']);
      nav.innerHTML = res.Navbar;
      content.innerHTML = res.Content;
      footer.innerHTML = res.Footer;
   });
}
function setLoginContent(content){
   content.innerHTML = "";
   content.innerHTML = 
      `
      <div id='loginContent'>
         <div id='loginForm'>
            <table>
               <tr>
                  <td> 
                     <label for='username'>username: </label>
                  </td>
                  <td> 
                     <input id='username' type='text'></input>
                  </td>
               </tr>
               <tr>
                  <td> 
                     <label for='password'>Password: </label>
                  </td>
                  <td> 
                     <input id='password' type='password'></input>
                  </td>
               </tr>
            </table>
         </div>
         <button onclick="login()" type='submit' form='loginForm'>
            Login
         </button>
         <button onclick='goTo("signUp")'>Sign Up</button>
      </div>
      `
}
function buildLogin(){
   nav.innerHTML = "<div id='greeting'> Welcome! </div>";
   setLoginContent(content);
   footer.innerHTML = "";

}
function signup(){
   username = document.getElementById("username").value;
   password1 = document.getElementById("password1").value;
   password2 = document.getElementById("password2").value;
   if(password1 !== password2){
      document.getElementById("password2").value = "DONT MATCH";
      return;
   } else {
      postData("auth/signup", {
            username : document.getElementById("username").value, 
            password : document.getElementById("password1").value
         },
         function(res){
         });
   }
}
function buildSignUp(){
   nav.innerHTML = "<div id='greeting'> Sign Up! </div>"
   content.innerHTML = 
   `
      <div id='signupContent'>
         <div id='signupForm'>
            <table>
               <tr>
                  <td> 
                     <label for='username'>username: </label>
                  </td>
                  <td> 
                     <input id='username' type='text'></input>
                  </td>
               </tr>
               <tr>
                  <td> 
                     <label for='password1'>Password: </label>
                  </td>
                  <td> 
                     <input id='password1' type='password'></input>
                  </td>
               </tr>
               <tr>
                  <td> 
                     <label for='password2'>Confirm Password: </label>
                  </td>
                  <td> 
                     <input id='password2' type='password'></input>
                  </td>

               </tr>
            </table>
         </div>
         <button onclick="signup()"> 
            Create Account
         </button>
         <button onclick='goTo("login")'>Login</button>
      </div>

   `
}

function signout(){
   postData("auth/logout", null,
   function(res){
      console.log("response is " + res); 
   });
   home = undefined;
   goTo("login");
}
/*
 * This can and will be refactored!!
 */
function goTo(where, ignoreHist){
   if(!ignoreHist){
      history.pushState({"place" : where}, where, where);
   }
   switch(where){
      case "login":
         console.log("going to login");
         buildLogin();
         break;
      case "signUp":
         console.log("going to signUp");
         buildSignUp();
         break;
      case "home":
         console.log("going home");
         buildHome();
         break;
      default :
         console.log("not found, going to login");
         buildLogin();
         break;
   }
}
function main(){
   home = undefined;
   nav = document.getElementById("navbar");
   content = document.getElementById("mainContent");
   footer = document.getElementById("footer");
   goTo(document.body.id);
};

