import { useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import Card from './Card';
import api from '../../services/api';
import './Board.css';

const Column = ({ column, cards, boardId, onDeleteColumn, onAddCard, onDeleteCard, dragHandleProps }) => {
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

      onAddCard(column._id, data.card);
      setIsAddingCard(false);
      setNewCardTitle('');
    } catch (err) {
      alert('Failed to add card');
    }
  };

  const handleDeleteCard = async (cardId) => {
    try {
      await api.delete(`/cards/${cardId}`);
      onDeleteCard(column._id, cardId);
    } catch (err) {
      alert('Failed to delete card');
    }
  };

  return (
    <div className="column-container">
      <div className="column-header" {...dragHandleProps}>
        {column.title}
        <button 
          className="btn-delete-icon" 
          onClick={() => onDeleteColumn(column._id)}
          title="Delete Column"
        >
          ×
        </button>
      </div>
      
      <Droppable droppableId={column._id} type="CARD">
        {(provided, snapshot) => (
          <div 
            className="column-body"
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{ 
              background: snapshot.isDraggingOver ? 'rgba(255,255,255,0.02)' : 'transparent',
              transition: 'background 0.2s ease'
            }}
          >
            {cards.map((card, index) => (
              <Card 
                key={card._id} 
                card={card}
                index={index}
                onDelete={handleDeleteCard} 
              />
            ))}
            {provided.placeholder}

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
        )}
      </Droppable>
    </div>
  );
};

export default Column;
