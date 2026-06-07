import { useState } from 'react';
import Card from './Card';
import api from '../../services/api';
import './Board.css';

const Column = ({ column, boardId, initialCards, onDeleteColumn }) => {
  const [cards, setCards] = useState(initialCards || []);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');

  const handleAddCard = async (e) => {
    e.preventDefault();
    if (!newCardTitle.trim()) return;

    try {
      const { data } = await api.post('/cards', {
        title: newCardTitle,
        columnId: column._id,
        boardId: boardId,
      });

      setCards([...cards, data.card]);
      setIsAddingCard(false);
      setNewCardTitle('');
    } catch (err) {
      alert('Failed to add card');
    }
  };

  const handleDeleteCard = async (cardId) => {
    try {
      await api.delete(`/cards/${cardId}`);
      setCards(cards.filter(c => c._id !== cardId));
    } catch (err) {
      alert('Failed to delete card');
    }
  };

  return (
    <div className="column-container">
      <div className="column-header">
        {column.title}
        <button 
          className="btn-delete-icon" 
          onClick={() => onDeleteColumn(column._id)}
          title="Delete Column"
        >
          ×
        </button>
      </div>
      
      <div className="column-body">
        {cards.map(card => (
          <Card 
            key={card._id} 
            card={card} 
            onDelete={handleDeleteCard} 
          />
        ))}

        {isAddingCard ? (
          <form className="add-card-form" onSubmit={handleAddCard}>
            <textarea
              placeholder="Enter a title for this card..."
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              autoFocus
              required
              rows={2}
            />
            <div className="add-card-actions">
              <button type="submit" className="btn-primary btn-sm">Add Card</button>
              <button 
                type="button" 
                className="btn-secondary btn-sm"
                onClick={() => {
                  setIsAddingCard(false);
                  setNewCardTitle('');
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button 
            className="add-card-btn" 
            onClick={() => setIsAddingCard(true)}
          >
            + Add a card
          </button>
        )}
      </div>
    </div>
  );
};

export default Column;
