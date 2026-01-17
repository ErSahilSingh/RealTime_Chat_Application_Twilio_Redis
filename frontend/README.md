# Chat Application Frontend (React)

A modern React frontend for the real-time chat application.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will run on `http://localhost:5173`

**Make sure the backend is running on `http://localhost:5000` before starting the frontend.**

## 📁 Project Structure

```
src/
├── components/
│   ├── Auth/
│   │   ├── Login.jsx           # OTP login component
│   │   └── Auth.css
│   ├── Chat/
│   │   ├── ChatList.jsx        # List of conversations
│   │   ├── ChatWindow.jsx       # Message interface
│   │   └── Chat.css
│   ├── Group/
│   │   ├── GroupList.jsx       # List of groups
│   │   └── Group.css
│   └── Dashboard/
│       ├── Dashboard.jsx       # Main app layout
│       └── Dashboard.css
├── contexts/
│   ├── AuthContext.jsx         # User authentication state
│   └── SocketContext.jsx       # Socket.IO connection
├── services/
│   └── api.js                  # API endpoints
├── App.jsx                     # Main component
├── App.css
└── main.jsx                    # React entry point
```

## ✨ Features

- ✅ **OTP Authentication**: Mobile number + OTP login
- ✅ **Real-Time Messaging**: Instant message delivery via Socket.IO
- ✅ **One-to-One Chat**: Private conversations
- ✅ **Group Chat**: Create and manage group conversations
- ✅ **Online Presence**: See who's online
- ✅ **Typing Indicators**: See when someone is typing
- ✅ **Delivery Status**: Message sent/delivered indicators
- ✅ **Modern UI**: Clean, responsive design

## 🔧 Configuration

The API URL is configured in `src/services/api.js`. If your backend runs on a different port, update:

```javascript
const API_URL = "http://localhost:5000/api";
```

Socket.IO connection is configured in `src/contexts/SocketContext.jsx`:

```javascript
const newSocket = io("http://localhost:5000", {
  auth: { token },
  // ...
});
```

## 🧪 Testing

1. Start the backend server
2. Start the frontend: `npm run dev`
3. Open `http://localhost:5173` in your browser
4. Login with a mobile number
5. Open another browser window (or incognito) and login with a different number
6. Start chatting!

## 🎨 Customization

### Colors

The main color palette is in the CSS files:

- Primary: `#667eea` (purple-blue)
- Secondary: `#764ba2` (purple)

Update these colors in the CSS files to match your brand.

### Components

All components are modular and can be easily customized:

- **Login**: Modify `src/components/Auth/Login.jsx`
- **Chat UI**: Modify `src/components/Chat/ChatWindow.jsx`
- **Styling**: Update respective `.css` files

## 📦 Build for Production

```bash
npm run build
```

This creates an optimized build in the `dist/` folder ready for deployment.

## 🚢 Deployment

Deploy to:

- **Vercel**: `vercel --prod`
- **Netlify**: Drag & drop `dist/` folder
- **GitHub Pages**: Use `gh-pages` package

Make sure to update the API URL to your production backend URL before building.

## 🐛 Troubleshooting

**"Cannot connect to backend"**

- Ensure backend is running on port 5000
- Check CORS settings in backend
- Verify API_URL in `api.js`

**"Socket not connecting"**

- Check JWT token in localStorage
- Verify Socket.IO URL in `SocketContext.jsx`
- Look for errors in browser console

**"Messages not sending"**

- Check Socket.IO connection status
- Ensure you're connected (green dot)
- Check backend console for errors

## 📚 Learn More

- [React Documentation](https://react.dev)
- [Socket.IO Client API](https://socket.io/docs/v4/client-api/)
- [Vite Guide](https://vitejs.dev/guide/)
