function sendChat(){
   var msg = document.getElementById("messageBox").value;
   postData("/msg", {"msg" : msg});
}
function chatboxkey(e){
   var key = e.keyCode;
   console.log("you pressed ", key);
   if(key == 13){
      sendChat();
   }
}
function updatemsg(since){
   getData("msg?time="+since, function(res){
      console.log(res);
      document.getElementById("chatView").value+=res.msg;
   });
}
function comet(){
   console.log("need to implement comet functionality");
   postData("/comet/wait", {}, 
      function(res){
         console.log(res['Path']);
         var path = res['Path'];
         if(path.includes("msg")){
            console.log("yeeyee");
            updatemsg();
         } else {
            console.log("unknown path ", res['Path']);
         }
         comet();
      });
}
comet();

