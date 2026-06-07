import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { io } from 'socket.io-client';
import Navbar from '../components/Layout/Navbar';
import Column from '../components/Board/Column';
import api from '../services/api';
import '../components/Board/Board.css';

// Connect directly to the backend server for sockets
const socket = io('http://localhost:5000', {
  withCredentials: true,
});

const BoardPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');

  useEffect(() => {
    fetchBoardData();

    // Socket.io Room Join
    socket.emit('join-board', id);

    // Listen for updates from other users in the same board
    socket.on('board-updated', () => {
      console.log('Received real-time update. Refetching board...');
      fetchBoardData(false); // fetch silently without loading screen
    });

    return () => {
      socket.off('board-updated');
    };
  }, [id]);

  // showLoading = true by default. Passed false during socket updates to prevent UI flicker
  const fetchBoardData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      
      const boardRes = await api.get(`/boards/${id}`);
      setBoard(boardRes.data.board);

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

    // COLUMNS Reorder
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

    // CARDS Reorder
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
          <h1>{board.title}</h1>
          {board.description && <p>{board.description}</p>}
        </div>
        <Link to="/dashboard" className="btn-secondary">
          &larr; Back to Boards
        </Link>
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
