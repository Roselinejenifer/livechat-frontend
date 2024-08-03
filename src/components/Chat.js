import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { Button, Card, Container, IconButton, TextField } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import {jwtDecode} from 'jwt-decode';
import "./chat.css";
import { useNavigate } from 'react-router-dom';

const Chat = () => {
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const socketRef = useRef(null);
    const messageEndRef = useRef(null);
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const decoded = jwtDecode(token);
    const userId = decoded?.id; // Assuming the decoded token contains user ID
    const username = decoded?.username;
    console.log(decoded);

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const config = {
                    headers: { Authorization: `Bearer ${token}` }
                };
                const response = await axios.get('https://live-chat-be.onrender.com/api/chat', config);
                setMessages(response.data);
            } catch (error) {
                console.error('Error fetching messages:', error);
            }
        };

        fetchMessages();

        socketRef.current = io('https://live-chat-backend-0gyo.onrender.com/');

        socketRef.current.on('connect', () => {
            console.log('Connected to WebSocket server');
        });

        socketRef.current.on('message', (data) => {
            setMessages((prevMessages) => [...prevMessages, data]);
        });

        socketRef.current.on('disconnect', () => {
            console.log('Disconnected from WebSocket server');
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [token]);

    useEffect(() => {
        if (messageEndRef.current) {
            messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const sendMessage = async () => {
        if (!token) return;

        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };

        const messageData = { text, sender: userId };

        try {
            const response = await axios.post('https://live-chat-be.onrender.com/api/chat', messageData, config);
            if (response.data.msg === 'Message sent') {
                const updatedMessages = await axios.get('https://live-chat-be.onrender.com/api/chat', config);
                setMessages(updatedMessages.data);
            }

            socketRef.current.emit('message', messageData);

            setText('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };
    const logout = () => {
        localStorage.removeItem('token');
        navigate('/');
        // window.location.reload();
    }

    return (
        <Container className="container">
            <div className="chat">
                <Card sx={{ display: "flex", height:"100%", }}>
                    <div className="message-container">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={msg.sender === username ? 'sent-message' : 'received-message'}
                            >
                                <strong>{msg?.sender === username ? 'You' : msg.sender}: </strong>{msg?.text}
                            </div>
                        ))}
                        <div ref={messageEndRef} /> {/* Ref to scroll into view */}
                    </div>
                </Card>
                <div className="input-container">
                    <TextField
                        id="standard-basic"
                        placeholder="Type a message"
                        variant="standard"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                    <IconButton onClick={sendMessage}><SendIcon /></IconButton>
                </div>
            <Button onClick={logout}  sx={{position:"relative", right:0}}>Logout</Button>
            </div>
        </Container>
    );
};

export default Chat;