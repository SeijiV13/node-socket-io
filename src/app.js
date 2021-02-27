const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origins: ['http://localhost:4200']
  }
});
const { DataStore } = require('notarealdb');

const store = new DataStore('./data.json');
const users = store.collection('users');
const messages = store.collection('messages');

io.on('connection', (socket) => {
   


  //user disconnects
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });


  //actions
  //Messages Listensers
  socket.on("GetMessages", (data) => {
    console.log(data);
    let message = messages.list().find(m => {
      return (m.user1 === data.sender || m.user1 === data.receiver) &&  
      (m.user2 === data.sender || m.user2 === data.receiver)
     });
     if(!message) {
       message = [];
     }
    io.emit("ReceiveMessageSender", {user: data.sender, messages: message});
  });

  socket.on('SendMessage', (data) => {
    console.log(data);
    const message = messages.list().find(m => {
      return (m.user1 === data.sender || m.user1 === data.receiver) &&  
      (m.user2 === data.sender || m.user2 === data.receiver)
    } );

    if(!message) {
        messages.create({messages: [{
          message: data.message, 
          sender: data.sender, receiver:
           data.receiver}], user1: data.sender, user2: data.receiver})
     } else {
       message.messages.push({
        message: data.message, 
        sender: data.sender, receiver:
        data.receiver
       }) 
       messages.update(message);
     }
     io.emit('ReceiveMessageBoth', {sender: data.sender, receiver: data.receiver, messages: message})
  });

  //User Listeners
  socket.on('GetUserList', (sentUser) => {
     //find user in list
     if(!sentUser) {
       return;
     }
     const user = users.list().find(u => u.email === sentUser.email);
     if (user) {
        users.update(user);
     }
     else {
        users.create(sentUser);
     }
     io.emit('SendUserList', users.list());
  });

  socket.on("LogOut", (user) => {
    const foundUser = users.list().find(u => u.email === user.email);
    users.delete(foundUser.id);
    io.emit('SendUserList', users.list());
  });
});

http.listen(3000, () => {
  console.log('listening on *:3000');
});