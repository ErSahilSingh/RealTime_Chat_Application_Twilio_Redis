# Chat Application Backend

## 🚀 Setup Instructions

### Prerequisites

- Node.js (v16+)
- MongoDB (running locally or connection string ready)
- Redis (running locally or connection string ready)
- Twilio Account (for OTP SMS)

### Installation

1. **Install Dependencies**

```bash
cd backend
npm install
```

2. **Configure Environment Variables**

```bash
cp .env.example .env
```

Then edit `.env` with your actual values:

- **MongoDB URI**: Your MongoDB connection string
- **Redis**: Your Redis host/port
- **Twilio Credentials**: Get from https://www.twilio.com/console
- **JWT Secret**: Use a long random string

3. **Start Services**

```bash
# Start MongoDB (if running locally)
mongod

# Start Redis (if running locally)
redis-server

# Start backend in development mode
npm run dev
```

The server will start on `http://localhost:5000`

### API Endpoints

#### Authentication

- `POST /api/auth/send-otp` - Send OTP to mobile
- `POST /api/auth/verify-otp` - Verify OTP and login
- `POST /api/auth/logout` - Logout (protected)

#### Users

- `GET /api/users/me` - Get current user (protected)
- `PUT /api/users/me` - Update profile (protected)
- `GET /api/users/search?query=...` - Search users (protected)
- `GET /api/users/:id` - Get user by ID (protected)

#### Chats

- `GET /api/chats/:userId` - Get chat history with user (protected)
- `GET /api/chats/unread` - Get unread counts (protected)
- `PUT /api/chats/messages/:id/read` - Mark message as read (protected)

#### Groups

- `POST /api/groups` - Create group (protected)
- `GET /api/groups` - Get user's groups (protected)
- `GET /api/groups/:id` - Get group details (protected)
- `PUT /api/groups/:id` - Update group (protected)
- `DELETE /api/groups/:id` - Delete group (protected)
- `POST /api/groups/:id/members` - Add members (protected)
- `DELETE /api/groups/:id/members/:userId` - Remove member (protected)
- `POST /api/groups/:id/leave` - Leave group (protected)
- `GET /api/groups/:id/messages` - Get group messages (protected)

### Socket.IO Events

#### Client → Server

- `private_message` - Send private message
- `group_message` - Send group message
- `join_my_groups` - Join all user's groups
- `join_group` - Join specific group
- `leave_group` - Leave group
- `typing` - Send typing indicator
- `message_read` - Mark message as read
- `group_message_read` - Mark group message as read

#### Server → Client

- `connected` - Connection successful
- `receive_message` - Receive private message
- `group_message_received` - Receive group message
- `user_online` - User came online
- `user_offline` - User went offline
- `typing_status` - Someone is typing
- `message_delivered` - Message delivered
- `message_read_receipt` - Message was read
- `member_left` - Member left group
- `error` - Error occurred

### Testing

#### Test OTP Authentication

```bash
# In development mode, OTP is logged to console
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber": "+1234567890"}'

# Check console for OTP, then verify
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber": "+1234567890", "otp": "123456"}'
```

#### Test with Postman

Import the API endpoints above and test each one.

### Project Structure

```
backend/
├── src/
│   ├── config/          # DB & Redis connections, Socket.IO setup
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Auth, error handling
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic (Twilio, Redis, Socket)
│   ├── utils/           # Helper functions
│   └── app.js           # Express app setup
├── .env                 # Environment variables
├── .env.example         # Example env file
├── package.json
└── server.js            # Entry point
```

### Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Use MongoDB Atlas for database
3. Use Redis Cloud for Redis
4. Deploy to services like:
   - Heroku
   - Railway
   - Render
   - AWS EC2

### Troubleshooting

**MongoDB Connection Error**

- Ensure MongoDB is running: `mongod --version`
- Check connection string in `.env`

**Redis Connection Error**

- Ensure Redis is running: `redis-cli ping`
- Should return `PONG`

**Twilio Errors**

- Verify Account SID and Auth Token
- Ensure phone number is in E.164 format: `+1234567890`
- Check Twilio account credits

**Socket.IO Not Connecting**

- Check CORS settings in `src/config/socket.js`
- Verify JWT token is being sent in `auth` field

### Learning Resources

- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [Redis Commands](https://redis.io/commands/)
- [JWT Best Practices](https://auth0.com/blog/jwt-handbook/)
- [Twilio Node.js SDK](https://www.twilio.com/docs/libraries/node)
