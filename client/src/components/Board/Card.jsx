import './Board.css';

const Card = ({ card, onDelete }) => {
  return (
    <div className="card-container">
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
  );
};

export default Card;
