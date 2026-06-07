import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const JoinBoardPage = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Joining board...');

  useEffect(() => {
    const joinBoard = async () => {
      try {
        const { data } = await api.post(`/boards/join/${code}`);
        if (data.success) {
          setStatus('Successfully joined! Redirecting...');
          setTimeout(() => {
            navigate(`/board/${data.boardId}`);
          }, 1500);
        }
      } catch (err) {
        setStatus(err.response?.data?.message || 'Failed to join the board. Invalid code.');
      }
    };

    joinBoard();
  }, [code, navigate]);

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>Joining Board</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>{status}</p>
        <Link to="/dashboard" className="btn-secondary">Back to Dashboard</Link>
      </div>
    </div>
  );
};

export default JoinBoardPage;
