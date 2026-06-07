import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Layout/Navbar';
import Column from '../components/Board/Column';
import api from '../services/api';
import '../components/Board/Board.css';

const BoardPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [columns, setColumns] = useState([]);
  const [allCards, setAllCards] = useState([]);
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
      // Fetch board details
      const boardRes = await api.get(`/boards/${id}`);
      setBoard(boardRes.data.board);

      // Fetch columns
      const columnsRes = await api.get(`/columns/board/${id}`);
      setColumns(columnsRes.data.columns);
      
      // Fetch all cards for this board
      const cardsRes = await api.get(`/cards/board/${id}`);
      setAllCards(cardsRes.data.cards);
      
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

      setColumns([...columns, data.column]);
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

      <div className="board-canvas">
        {/* Render Existing Columns */}
        {columns.map((column) => (
          <Column 
            key={column._id}
            column={column}
            boardId={board._id}
            initialCards={allCards.filter(card => card.columnId === column._id)}
            onDeleteColumn={handleDeleteColumn}
          />
        ))}

        {/* Add New Column Section */}
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
  );
};

export default BoardPage;
