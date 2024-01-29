import { Modal } from 'react-bootstrap';

export const GameModal = ({ setSelectedGame, selectedGame }) => {
  return (
    <Modal show={selectedGame !== null} onHide={() => setSelectedGame(null)} size="xl" >
      <Modal.Header closeButton>
        <Modal.Title>Discussions</Modal.Title>
        <span>Be nice</span>
      </Modal.Header>
      <Modal.Body >
        {selectedGame && selectedGame.description && (
          <div>
            <p className="description-modal">{selectedGame.description}</p>
            <ul>
              {selectedGame.rules && selectedGame.rules.map((rule, index) => (
                <li key={index}>{rule}</li>
              ))}
            </ul>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <div className="lable-container">
          {selectedGame && selectedGame.labels && selectedGame.labels.map((label, index) => (
            <div className="game-label" key={index}>
              {label}
            </div>
          ))}
        </div>
        <button className="btn btn-success" style={{ width: 'fit-content' }}> Add rules </button>
      </Modal.Footer>
    </Modal>
  )
}