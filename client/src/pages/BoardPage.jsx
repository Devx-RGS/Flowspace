import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { io } from 'socket.io-client';
import { Crown } from 'lucide-react';
import Navbar from '../components/Layout/Navbar';
import Column from '../components/Board/Column';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../components/Board/Board.css';

const socket = io('http://localhost:5000', {
  withCredentials: true,
});

const BoardPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [board, setBoard] = useState(null);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [presentUsers, setPresentUsers] = useState([]);
  const [shareCopied, setShareCopied] = useState(false);
  const [userRole, setUserRole] = useState(null);

  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');

  useEffect(() => {
    fetchBoardData();
  }, [id]);

  useEffect(() => {
    if (user && userRole) {
      socket.emit('board:join', {
        boardId: id,
        user: { _id: user._id, name: user.name, email: user.email, role: userRole }
      });

      socket.on('users:online', (users) => {
        setPresentUsers(users);
      });

      socket.on('user:joined', (joinedUser) => {
        setPresentUsers((prev) => {
          if (prev.find(u => u._id === joinedUser._id)) return prev;
          return [...prev, joinedUser];
        });
      });

      socket.on('user:left', (leftUser) => {
        setPresentUsers((prev) => prev.filter(u => u._id !== leftUser._id));
      });

      socket.on('board-updated', () => {
        fetchBoardData(false); 
      });

      return () => {
        socket.emit('board:leave');
        socket.off('users:online');
        socket.off('user:joined');
        socket.off('user:left');
        socket.off('board-updated');
      };
    }
  }, [id, user, userRole]);

  const fetchBoardData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      
      const boardRes = await api.get(`/boards/${id}`);
      setBoard(boardRes.data.board);
      setUserRole(boardRes.data.role);

      const columnsRes = await api.get(`/columns/board/${id}`);
      const cardsRes = await api.get(`/cards/board/${id}`);

      const cardsByColumn = cardsRes.data.cards.reduce((acc, card) => {
        if (!acc[card.columnId]) acc[card.columnId] = [];
        acc[card.columnId].push(card);
        return acc;
      }, {});

      const columnsWithCards = columnsRes.data.columns.map(col => ({
        ...col,
        cards: cardsByColumn[col._id] || []
      }));

      setColumns(columnsWithCards);
      setError(null);
    } catch (err) {
      if (showLoading) setError('Failed to load board. It may have been deleted or you do not have access.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const notifyUpdate = () => {
    socket.emit('board-updated', id);
  };

  const handleShare = () => {
    if (!board?.inviteCode) return;
    const joinLink = `${window.location.origin}/join/${board.inviteCode}`;
    navigator.clipboard.writeText(joinLink);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const handleCreateColumn = async (e) => {
    e.preventDefault();
    if (!newColumnTitle.trim()) return;

    try {
      const { data } = await api.post('/columns', {
        title: newColumnTitle,
        boardId: id,
      });

      setColumns([...columns, { ...data.column, cards: [] }]);
      setIsAddingColumn(false);
      setNewColumnTitle('');
      notifyUpdate();
    } catch (err) {
      alert('Failed to create column');
    }
  };

  const handleDeleteColumn = async (columnId) => {
    if (!window.confirm('Are you sure you want to delete this list and all its cards?')) return;
    
    try {
      await api.delete(`/columns/${columnId}`);
      setColumns(columns.filter(c => c._id !== columnId));
      notifyUpdate();
    } catch (err) {
      alert('Failed to delete column');
    }
  };

  const handleAddCard = (columnId, newCard) => {
    setColumns(columns.map(col => {
      if (col._id === columnId) {
        return { ...col, cards: [...col.cards, newCard] };
      }
      return col;
    }));
    notifyUpdate();
  };

  const handleDeleteCard = (columnId, cardId) => {
    setColumns(columns.map(col => {
      if (col._id === columnId) {
        return { ...col, cards: col.cards.filter(c => c._id !== cardId) };
      }
      return col;
    }));
    notifyUpdate();
  };

  const onDragEnd = async (result) => {
    const { source, destination, type } = result;

    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;

    if (type === 'COLUMN') {
      const newColumns = Array.from(columns);
      const [removed] = newColumns.splice(source.index, 1);
      newColumns.splice(destination.index, 0, removed);

      setColumns(newColumns);

      try {
        const updatedColumns = newColumns.map((col, index) => ({
          _id: col._id,
          order: index
        }));
        await api.put('/columns/reorder', { items: updatedColumns });
        notifyUpdate();
      } catch (err) {
        alert('Failed to save column order');
        fetchBoardData(); 
      }
      return;
    }

    if (type === 'CARD') {
      const sourceColIndex = columns.findIndex(col => col._id === source.droppableId);
      const destColIndex = columns.findIndex(col => col._id === destination.droppableId);

      const sourceCol = columns[sourceColIndex];
      const destCol = columns[destColIndex];

      const sourceCards = Array.from(sourceCol.cards);
      const destCards = source.droppableId === destination.droppableId 
        ? sourceCards 
        : Array.from(destCol.cards);

      const [removed] = sourceCards.splice(source.index, 1);
      removed.columnId = destination.droppableId;
      destCards.splice(destination.index, 0, removed);

      const newColumns = Array.from(columns);
      newColumns[sourceColIndex] = { ...sourceCol, cards: sourceCards };
      if (source.droppableId !== destination.droppableId) {
        newColumns[destColIndex] = { ...destCol, cards: destCards };
      }

      setColumns(newColumns);

      try {
        const updatedCards = destCards.map((card, index) => ({
          _id: card._id,
          order: index,
          columnId: destination.droppableId
        }));
        
        await api.put('/cards/reorder', { items: updatedCards });
        notifyUpdate();
      } catch (err) {
        alert('Failed to save card order');
        fetchBoardData(); 
      }
    }
  };

  if (loading) return <div className="auth-container"><div className="auth-title">Loading board...</div></div>;
  
  if (error) return (
    <div className="auth-container">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <h2 style={{ color: 'var(--danger)', marginBottom: '16px' }}>Oops!</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>{error}</p>
        <Link to="/dashboard" className="btn-primary">Back to Dashboard</Link>
      </div>
    </div>
  );

  return (
    <div className="board-page-container">
      <Navbar />
      
      <div className="board-header">
        <div className="board-info">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {board.title}
            {userRole === 'owner' && <Crown size={20} color="var(--accent)" title="You are the Owner" />}
          </h1>
          {board.description && <p>{board.description}</p>}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            {presentUsers.map(u => (
              <div 
                key={u._id}
                title={`${u.name} ${u.role === 'owner' ? '(Owner)' : ''}`}
                style={{
                  position: 'relative',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  border: '2px solid var(--bg-secondary)'
                }}
              >
                {u.name.charAt(0).toUpperCase()}
                {u.role === 'owner' && (
                  <div style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    background: 'var(--bg-primary)',
                    borderRadius: '50%',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--border)'
                  }}>
                    <Crown size={12} color="var(--accent)" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {userRole === 'owner' && (
            <button className="btn-primary" onClick={handleShare}>
              {shareCopied ? 'Copied Link!' : 'Share Board'}
            </button>
          )}
          
          <Link to="/dashboard" className="btn-secondary">
            Back
          </Link>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="board" type="COLUMN" direction="horizontal">
          {(provided) => (
            <div 
              className="board-canvas"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {columns.map((column, index) => (
                <Draggable key={column._id} draggableId={column._id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      style={{ ...provided.draggableProps.style, height: '100%' }}
                    >
                      <Column 
                        column={column}
                        cards={column.cards}
                        boardId={board._id}
                        onDeleteColumn={handleDeleteColumn}
                        onAddCard={handleAddCard}
                        onDeleteCard={handleDeleteCard}
                        dragHandleProps={provided.dragHandleProps}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              
              {provided.placeholder}

              <div style={{ minWidth: '300px', maxWidth: '300px' }}>
                {isAddingColumn ? (
                  <form className="add-column-form" onSubmit={handleCreateColumn}>
                    <input
                      type="text"
                      placeholder="Enter list title..."
                      value={newColumnTitle}
                      onChange={(e) => setNewColumnTitle(e.target.value)}
                      autoFocus
                      required
                    />
                    <div className="add-column-actions">
                      <button type="submit" className="btn-primary" style={{ flex: 1, padding: '8px' }}>
                        Add List
                      </button>
                      <button 
                        type="button" 
                        className="btn-secondary" 
                        style={{ flex: 1, padding: '8px' }}
                        onClick={() => {
                          setIsAddingColumn(false);
                          setNewColumnTitle('');
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <button 
                    className="add-column-btn"
                    onClick={() => setIsAddingColumn(true)}
                  >
                    + Add another list
                  </button>
                )}
              </div>
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default BoardPage;
