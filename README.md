# Flowspace — Real-Time Collaborative Task Board

A full-stack Kanban board application where authenticated users can create boards, organize tasks into columns, and collaborate in real time with other users.

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React 19 + Vite | Fast HMR, minimal config, modern JSX support |
| Styling | Vanilla CSS with CSS custom properties | Full control over theming without extra dependencies |
| Backend | Node.js + Express | Lightweight, widely supported, pairs well with Socket.io |
| Database | MongoDB + Mongoose | Flexible schema design suits a board/column/card hierarchy |
| Auth | JWT (HTTP-only cookies) + bcryptjs | Stateless auth with secure password hashing |
| Real-Time | Socket.io | Reliable WebSocket abstraction with room-based broadcasting |
| Drag & Drop | @hello-pangea/dnd | Maintained fork of react-beautiful-dnd with React 19 support |
| Icons | Lucide React | Lightweight, tree-shakable SVG icon library |

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB instance (local or Atlas)
- npm

### Setup

1. **Clone the repo**
```bash
git clone https://github.com/Devx-RGS/Flowspace.git
cd Flowspace
```

2. **Backend setup**
```bash
cd server
npm install
```

Create a `.env` file inside `server/`:
```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
```

3. **Frontend setup**
```bash
cd ../client
npm install
```

4. **Run both servers**

Terminal 1 (Backend):
```bash
cd server
npm run dev
```

Terminal 2 (Frontend):
```bash
cd client
npm run dev
```

5. Open `http://localhost:5173` in your browser.

## Data Model

```
User
├── _id, name, email, password (hashed)

Board
├── _id, title, description, inviteCode (8-char unique string)

BoardMember (RBAC)
├── boardId → Board
├── userId → User
├── role: "owner" | "member"
├── joinedAt

Column
├── _id, title, boardId → Board, order

Card
├── _id, title, description, columnId → Column, boardId → Board, order
```

- **BoardMember** acts as a join table implementing role-based access control. A user can access a board only if they have a corresponding BoardMember record.
- The board creator is automatically added as `role: "owner"`. Users who join via an invite link get `role: "member"`.
- `order` fields on Column and Card maintain drag-and-drop positions.

## Real-Time Sync Architecture

The app uses **Socket.io** with a room-based architecture:

1. When a user opens a board, the client emits `board:join` with user details and their role.
2. The server adds the user to a Socket.io room keyed by `boardId` and tracks active users in memory.
3. When any user performs a mutation (create/delete/move a card or column), the client emits `board-updated` to the room.
4. All other clients in the room receive the event and silently re-fetch the board data without showing a loading state.

**Presence tracking** uses these events:
- `users:online` — sent to a newly joined user with the list of everyone currently in the room.
- `user:joined` / `user:left` — broadcast to existing users when someone joins or leaves.

Each user's avatar (with name initial) is rendered in the board header. The owner's avatar displays a Crown icon badge visible to all members.

## Trade-offs & Next Steps

### Trade-offs made

- **Fetching whole board instead of small updates:** When someone makes a change, Socket.io tells the frontend to re-fetch the whole board data instead of just the changed part. This was much easier to build quickly, even though it uses more network requests.
- **Online users stored in memory:** I'm keeping track of who is online using a simple JavaScript object in the backend. If the server restarts, we lose that online status temporarily. In a real production app, I'd probably use a database or Redis for this.
- **Basic Drag and Drop error handling:** The drag and drop looks instant on the screen, but if the backend API fails for some reason, the board just re-fetches the old data to fix itself. 

### Known limitations

- The Socket.io backend URL is hardcoded to `localhost:5000` right now.
- There is no email invite system, so anyone who gets the share link can join the board.
- If two people edit the exact same card at the exact same second, the last save wins (no conflict warnings).

### What I'd improve with more time

- **Better Sharing System:** Instead of anyone joining via a link, I'd make it so people request access, and the owner has to approve them to keep the board secure.
- **Proper Authentication:** Add email verification (maybe using Nodemailer) or Google Login so we know users are real.
- **Task Details:** Add checkboxes inside cards, show who created the card, and add timestamps for when a task was finished.
- **Mobile Support & UI:** Make the board look better and work smoothly on small mobile screens.
- **Testing:** Write some basic API tests using Jest to make sure the core features don't break when making changes.
