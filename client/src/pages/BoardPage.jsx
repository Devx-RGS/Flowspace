import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import Navbar from '../components/Layout/Navbar';
import Column from '../components/Board/Column';
import api from '../services/api';
import '../components/Board/Board.css';

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
  }, [id]);

  const fetchBoardData = async () => {
    try {
      setLoading(true);
      const boardRes = await api.get(`/boards/${id}`);
      setBoard(boardRes.data.board);

      const columnsRes = await api.get(`/columns/board/${id}`);
      const cardsRes = await api.get(`/cards/board/${id}`);

      // Group cards by columnId
      const cardsByColumn = cardsRes.data.cards.reduce((acc, card) => {
        if (!acc[card.columnId]) acc[card.columnId] = [];
        acc[card.columnId].push(card);
        return acc;
      }, {});

      // Add cards array to each column object
      const columnsWithCards = columnsRes.data.columns.map(col => ({
        ...col,
        cards: cardsByColumn[col._id] || []
      }));

      setColumns(columnsWithCards);
      setError(null);
    } catch (err) {
      setError('Failed to load board. It may have been deleted or you do not have access.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateColumn = async (e) => {
    e.preventDefault();
    if (!newColumnTitle.trim()) return;

    try {
      const { data } = await api.post('/columns', {
        title: newColumnTitle,
        boardId: id,
      });

      // Add new column with empty cards array
      setColumns([...columns, { ...data.column, cards: [] }]);
      setIsAddingColumn(false);
      setNewColumnTitle('');
    } catch (err) {
      alert('Failed to create column');
    }
  };

  const handleDeleteColumn = async (columnId) => {
    if (!window.confirm('Are you sure you want to delete this list and all its cards?')) return;
    
    try {
      await api.delete(`/columns/${columnId}`);
      setColumns(columns.filter(c => c._id !== columnId));
    } catch (err) {
      alert('Failed to delete column');
    }
  };

  // Card Handlers
  const handleAddCard = (columnId, newCard) => {
    setColumns(columns.map(col => {
      if (col._id === columnId) {
        return { ...col, cards: [...col.cards, newCard] };
      }
      return col;
    }));
  };

  const handleDeleteCard = (columnId, cardId) => {
    setColumns(columns.map(col => {
      if (col._id === columnId) {
        return { ...col, cards: col.cards.filter(c => c._id !== cardId) };
      }
      return col;
    }));
  };

  // Drag and Drop Logic
  const onDragEnd = async (result) => {
    const { source, destination, type } = result;

    // Dropped outside the list
    if (!destination) return;

    // Dropped in the same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;

    // Reordering COLUMNS
    if (type === 'COLUMN') {
      const newColumns = Array.from(columns);
      const [removed] = newColumns.splice(source.index, 1);
      newColumns.splice(destination.index, 0, removed);

      // Update local state immediately
      setColumns(newColumns);

      // Send to backend
      try {
        const updatedColumns = newColumns.map((col, index) => ({
          _id: col._id,
          order: index
        }));
        await api.put('/columns/reorder', { items: updatedColumns });
      } catch (err) {
        alert('Failed to save column order');
        fetchBoardData(); // revert
      }
      return;
    }

    // Reordering CARDS
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
      
      // Update columnId of the dragged card if moving across columns
      removed.columnId = destination.droppableId;
      
      destCards.splice(destination.index, 0, removed);

      const newColumns = Array.from(columns);
      newColumns[sourceColIndex] = { ...sourceCol, cards: sourceCards };
      if (source.droppableId !== destination.droppableId) {
        newColumns[destColIndex] = { ...destCol, cards: destCards };
      }

      setColumns(newColumns);

      // Send to backend
      try {
        const updatedCards = destCards.map((card, index) => ({
          _id: card._id,
          order: index,
          columnId: destination.droppableId
        }));
        
        // If moving across columns, we technically only need to update the dest column's cards
        // but for safety, we update the source column's cards too if we want perfect ordering.
        // For now, updating destination column's cards order is sufficient.
        await api.put('/cards/reorder', { items: updatedCards });
      } catch (err) {
        alert('Failed to save card order');
        fetchBoardData(); // revert
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
              {/* Render Existing Columns */}
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

              {/* Add New Column Section */}
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
