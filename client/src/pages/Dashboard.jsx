import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Layout/Navbar';
import api from '../services/api';
import '../components/Dashboard/Dashboard.css';

const Dashboard = () => {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newBoardDesc, setNewBoardDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      const { data } = await api.get('/boards');
      setBoards(data.boards);
      setError(null);
    } catch (err) {
      setError('Failed to load boards. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!newBoardTitle.trim()) return;

    setIsCreating(true);
    try {
      const { data } = await api.post('/boards', {
        title: newBoardTitle,
        description: newBoardDesc
      });
      
      // Add new board to the list
      setBoards([data.board, ...boards]);
      
      // Reset modal
      setIsModalOpen(false);
      setNewBoardTitle('');
      setNewBoardDesc('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create board');
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="auth-container">
        <div className="auth-title">Loading your workspace...</div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      
      <main className="dashboard-container">
        <div className="dashboard-header">
          <h1>Your Boards</h1>
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            + Create New Board
          </button>
        </div>

        {error && <div className="auth-error" style={{marginBottom: '20px'}}>{error}</div>}

        {boards.length === 0 && !error ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No boards yet</h3>
            <p>Create your first board to start organizing your tasks.</p>
            <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
              Create Board
            </button>
          </div>
        ) : (
          <div className="boards-grid">
            {boards.map((board) => (
              <Link to={`/board/${board._id}`} key={board._id} className="board-card">
                <div className="board-title">{board.title}</div>
                {board.description && (
                  <div className="board-description">{board.description}</div>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Create Board Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Create New Board</h2>
            
            <form onSubmit={handleCreateBoard} className="auth-form">
              <div className="form-group">
                <label htmlFor="title">Board Title *</label>
                <input
                  type="text"
                  id="title"
                  value={newBoardTitle}
                  onChange={(e) => setNewBoardTitle(e.target.value)}
                  placeholder="e.g. Project Alpha, Marketing Sprint"
                  autoFocus
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Description (Optional)</label>
                <textarea
                  id="description"
                  value={newBoardDesc}
                  onChange={(e) => setNewBoardDesc(e.target.value)}
                  placeholder="What is this board for?"
                  rows="3"
                  style={{ resize: 'none' }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setIsModalOpen(false)}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={isCreating || !newBoardTitle.trim()}
                  style={{ flex: 1 }}
                >
                  {isCreating ? 'Creating...' : 'Create Board'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;
