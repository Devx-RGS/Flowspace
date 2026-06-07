import { Draggable } from '@hello-pangea/dnd';
import './Board.css';

const Card = ({ card, index, onDelete }) => {
  return (
    <Draggable draggableId={card._id} index={index}>
      {(provided, snapshot) => (
        <div 
          className="card-container"
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            boxShadow: snapshot.isDragging ? '0 5px 15px rgba(0,0,0,0.25)' : 'none',
            border: snapshot.isDragging ? '1px solid var(--accent)' : '1px solid var(--border-light)'
          }}
        >
          <div className="card-header">
            <h4 className="card-title">{card.title}</h4>
            <button 
              className="btn-delete-icon" 
              onClick={() => onDelete(card._id)}
              title="Delete Card"
            >
              ×
            </button>
          </div>
          {card.description && (
            <div className="card-description">{card.description}</div>
          )}
        </div>
      )}
    </Draggable>
  );
};

export default Card;
