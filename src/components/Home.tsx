import { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  FormControl,
  ListGroup,
  Button,
} from "react-bootstrap";

import { Message, User } from "../types";
import { io } from "socket.io-client";

// 1. When we jump into this page, the socket.io client needs to connect to the server
// 2. If the connection happens successfully, the server will emit an event called "welcome" -> see BE
// 3. If we want to do something when that event happens we shall LISTEN to that event by using socket.on("welcome")
// 4. Once we are connected we want to submit the username to the server --> we shall EMIT an event called "setNewUsername" (containing the username itself as payload)
// 5. The server is listening for the "setUsername" event, when that event is fired the server will broadcast that username to whoever is listening for an event called "loggedIn"
// 6. If a client wants to display the list of online users, it should listen for the "loggedIn" event
// 7. In this way the list of online users is updated only during login, but what happens if a new user joins? In this case we are not updating the list
// 8. When a new user joins server emits another event called "updateOnlineUsersList", this is supposed to update the list when somebody joins or leaves. Clients they should listen for the "updateOnlineUsersList" event to update the list when somebody joins or leaves
// 9. When the client sends a message we should trigger a "sendNewMessage" event
// 10. Server listens for that and then it should broadcast that message to everybody but the sender by emitting an event called "newMessage"
// 11. Anybody who is listening for a "newMessage" event will display that in the chat

//Number 1 form the list
const socket = io("http://localhost:3001", { transports: ["websocket"] });
// if you don't specify the transport ("websocket") socket.io will try to connect to the server by using Polling (old technique)

const Home = () => {
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [myOnlineUsersList, setMyOnlineUsersList] = useState<User[]>([]);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);

  useEffect(() => {
    //Number 3 from the list
    socket.on("welcome", (welcomeMessage) => {
      console.log(welcomeMessage);

      //number 6 from the list
      socket.on("loggedInUsers", (myOnlineUsersList) => {
        console.log(myOnlineUsersList);
        setIsUserLoggedIn(true);
        setMyOnlineUsersList(myOnlineUsersList);
      });

      //number 8 part 2 from the list
      socket.on("updateOnlineUsersList", (myOnlineUsersList) => {
        console.log("A new user connected/disconnected");
        setMyOnlineUsersList(myOnlineUsersList);
      });

      socket.on("newMessage", (newMessage) => {
        console.log(newMessage);
        setChatHistory([...chatHistory, newMessage.message]);
      });
    });
  });

  const submitNewUsername = () => {
    socket.emit("setNewUsername", { username });
  };

  const sendNewMessage = () => {
    const newMessage: Message = {
      sender: username,
      text: message,
      createdAt: new Date().toDateString(),
    };
    socket.emit("sendNewMessage", { message: newMessage });
    setChatHistory([...chatHistory, newMessage]);
  };

  return (
    <Container fluid>
      <Row style={{ height: "95vh" }} className="my-3">
        <Col md={9} className="d-flex flex-column justify-content-between">
          {/* LEFT COLUMN */}
          {/* TOP AREA: USERNAME INPUT FIELD */}
          {/* {!loggedIn && ( */}
          <Form
            onSubmit={(e) => {
              e.preventDefault();
              submitNewUsername();
            }}
          >
            <FormControl
              placeholder="Set your username here"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isUserLoggedIn}
            />
          </Form>
          {/* )} */}
          {/* MIDDLE AREA: CHAT HISTORY */}
          <ListGroup>
            {chatHistory.map((message, index) => (
              <ListGroup.Item key={index}>
                {<strong>{message.sender}</strong>} | {message.text} at{" "}
                {message.createdAt}
              </ListGroup.Item>
            ))}
          </ListGroup>
          {/* BOTTOM AREA: NEW MESSAGE */}
          <Form
            onSubmit={(e) => {
              e.preventDefault();
              sendNewMessage();
            }}
          >
            <FormControl
              placeholder="Write your message here"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={!isUserLoggedIn}
            />
          </Form>
        </Col>
        <Col md={3}>
          {/* ONLINE USERS SECTION */}
          <div className="mb-3">Connected users:</div>
          {myOnlineUsersList.length === 0 && (
            <ListGroup.Item>
              You have to log in first if you want to see who is online
            </ListGroup.Item>
          )}

          <ListGroup>
            {myOnlineUsersList.map((onlineUser, index) => {
              return (
                // key={user.socketId}
                <ListGroup.Item key={index}>
                  {onlineUser.username}
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        </Col>
      </Row>
    </Container>
  );
};

export default Home;
