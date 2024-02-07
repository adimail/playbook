import "../App.css";
import Select from "react-select";
import { ImBin } from "react-icons/im";
import { IoSend } from "react-icons/io5";
import { BiSolidGame } from "react-icons/bi";
import { stickersMap } from "../config/stickers";
import { PiStickerFill } from "react-icons/pi";
import React, { useState, useEffect } from "react";
import { IoChevronBackCircle } from "react-icons/io5";
import { Modal, Button } from "react-bootstrap";
import { HiMiniArrowSmallDown, HiMiniArrowSmallUp } from "react-icons/hi2";

import { db, auth } from "../config/firebase";
import {
  addDoc,
  collection,
  limit,
  query,
  doc,
  orderBy,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";

function ChatMessage(props) {
  const { text, uid, photoURL, createdAt, isSticker, stickerURL } =
    props.message;

  const messageClass = uid === auth.currentUser.uid ? "sent" : "received";
  const formattedDate = new Date(createdAt.toDate());
  const dateString = formattedDate.toLocaleString();

  return (
    <>
      <div className={`message ${messageClass}`}>
        <img
          alt="Profile"
          src={
            photoURL || "https://api.adorable.io/avatars/23/abott@adorable.png"
          }
        />
        <div>
          {isSticker ? (
            <>
              <img
                src={stickerURL}
                alt="Sticker"
                style={{ width: "100px", height: "100px" }}
              />
              <span>{dateString}</span>
            </>
          ) : (
            <>
              <p>{text}</p>
              <span>{dateString}</span>
            </>
          )}
        </div>
      </div>
    </>
  );
}
export const GameModal = ({
  setSelectedGame,
  selectedGame,
  setShowDiscussionModal,
  user,
}) => {
  const [editing, setEditing] = useState(false);
  const [discussionMessage, setDiscussionMessage] = useState("");
  const [gameMessages, setGameMessages] = useState([]);
  const [discussionOpen, setDiscussionOpen] = useState(false);
  const discussionRef = collection(db, `discussion-${selectedGame?.id}`);
  const [showStickerModal, setShowStickerModal] = useState(false);

  const handleSelectSticker = (sticker) => {
    setShowStickerModal(false);

    const newMessage = {
      createdAt: new Date(),
      photoURL: user.photoURL,
      isSticker: true,
      stickerURL: sticker,
      uid: user.uid,
    };

    addStickerToDiscussion(newMessage);
  };

  const addStickerToDiscussion = async (stickerMessage) => {
    try {
      await addDoc(
        collection(db, `discussion-${selectedGame?.id}`),
        stickerMessage
      );
    } catch (error) {
      console.error("Error sending sticker message:", error);
    }
  };

  const handleSendGameMessage = async () => {
    try {
      if (discussionMessage.trim() === "") {
        return;
      }
      const newMessage = {
        createdAt: new Date(),
        photoURL: user.photoURL,
        text: discussionMessage,
        uid: user.uid,
      };

      await addDoc(discussionRef, newMessage);

      setDiscussionMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const getGameMessages = () => {
    try {
      const unsubscribe = onSnapshot(
        query(discussionRef, orderBy("createdAt", "asc"), limit(25)),
        (querySnapshot) => {
          const filteredData = querySnapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
          }));
          setGameMessages(filteredData);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedGame !== null && selectedGame) {
      const unsubscribe = getGameMessages();
      return () => unsubscribe();
    }
  }, [selectedGame !== null, selectedGame]);

  const handleEdit = () => {
    setEditing(true);
  };

  const handleOpenDiscussion = () => {
    setDiscussionOpen(true);
    setShowDiscussionModal(true);
  };

  const handleCloseDiscussion = () => {
    setDiscussionOpen(false);
    setShowDiscussionModal(false);
  };

  return (
    <Modal
      show={selectedGame !== null}
      onHide={() => {
        setSelectedGame(null);
        setDiscussionOpen(false);
      }}
      size="xl"
    >
      <Modal.Header closeButton>
        <Modal.Title>
          {discussionOpen ? (
            <div className="d-flex align-items-center gap-3">
              <IoChevronBackCircle
                style={{
                  marginRight: "10px",
                  cursor: "pointer",
                  color: "black",
                }}
                onClick={handleCloseDiscussion}
              />
              {selectedGame?.name} Discussion
            </div>
          ) : (
            selectedGame?.name
          )}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: "68vh", overflowY: "auto" }}>
        {discussionOpen ? (
          <>
            {gameMessages.length > 0 ? (
              <div className="discussion-panel d-flex flex-column gap-3">
                {gameMessages.map((msg) => (
                  <ChatMessage key={msg.id} message={msg} />
                ))}
              </div>
            ) : (
              <div className="err-msg d-flex flex-column align-items-center">
                <h3>No messages yet.</h3> Start a discussion!
              </div>
            )}
          </>
        ) : (
          selectedGame &&
          selectedGame.description && (
            <div style={{ fontSize: "small" }}>
              <p className="description-modal">{selectedGame.description}</p>
              <hr />
              <ul>
                {selectedGame.rules &&
                  selectedGame.rules.map((rule, index) => (
                    <li key={index}>{rule}</li>
                  ))}
              </ul>
            </div>
          )
        )}
        {!discussionOpen && (
          <Button
            variant="primary"
            onClick={handleOpenDiscussion}
            style={{ width: "fit-content", padding: "3px 10px" }}
          >
            Open Discussion
          </Button>
        )}
      </Modal.Body>
      <Modal.Footer
        className="d-flex gap-3"
        style={{ backgroundColor: "#d8d8d8" }}
      >
        {discussionOpen ? null : (
          <div className="lable-container">
            {selectedGame &&
              selectedGame.labels &&
              selectedGame.labels.map((label, index) => (
                <div className="modal-game-label" key={index}>
                  {label}
                </div>
              ))}
          </div>
        )}
        {discussionOpen ? null : (
          <Button
            variant="primary"
            onClick={handleEdit}
            style={{ width: "fit-content", padding: "3px 10px" }}
          >
            Edit Game
          </Button>
        )}

        {discussionOpen && (
          <div
            className="d-flex justify-content-between align-items-center w-100 gap-2 mb-2 mt-2"
            style={{ height: "30px" }}
          >
            <input
              value={discussionMessage}
              onChange={(e) => setDiscussionMessage(e.target.value)}
              placeholder="Enter your message"
              className="flex-grow-1"
            />
            <PiStickerFill
              className="sticker"
              onClick={() => setShowStickerModal(true)}
            />
            <button
              className="btn btn-sm btn-primary d-flex align-items-center"
              onClick={handleSendGameMessage}
              style={{ width: "max-content", height: "30px" }}
            >
              <IoSend />
            </button>
          </div>
        )}
      </Modal.Footer>

      <StickerModal
        show={showStickerModal}
        handleClose={() => setShowStickerModal(false)}
        onSelectSticker={handleSelectSticker}
      />

      <AddGameModal
        addingNewGame={editing}
        setAddingNewGame={setEditing}
        selectedGame={selectedGame}
      />
    </Modal>
  );
};

export const StickerModal = ({ show, handleClose, onSelectSticker }) => {
  const stickers = Object.values(stickersMap);

  return (
    <Modal show={show} onHide={handleClose} style={{ background: "#0000009e" }}>
      <Modal.Header closeButton>
        <Modal.Title>Choose a Sticker</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="sticker-list gap-3">
          {stickers.map((sticker, index) => (
            <img
              key={index}
              src={sticker}
              alt={`Sticker ${index + 1}`}
              className="sticker-image"
              onClick={() => onSelectSticker(sticker)}
            />
          ))}
        </div>
      </Modal.Body>
    </Modal>
  );
};

export const AddGameModal = ({
  addingNewGame,
  setAddingNewGame,
  selectedGame,
}) => {
  const [gameName, setGameName] = useState(
    selectedGame ? selectedGame.name : ""
  );
  const [gameDescription, setGameDescription] = useState(
    selectedGame ? selectedGame.description : ""
  );
  const [selectedLabels, setSelectedLabels] = useState(
    selectedGame
      ? selectedGame.labels.map((label) => ({ value: label, label }))
      : []
  );
  const [rules, setRules] = useState(
    selectedGame
      ? selectedGame.rules.map((rule, index) => ({
          id: index + 1,
          value: rule,
          collapsed: false,
        }))
      : [{ id: 1, value: "", collapsed: false }]
  );

  const labelOptions = [
    { value: "Card Games", label: "Card Games" },
    { value: "Indoor Games", label: "Indoor Games" },
    { value: "Outdoor Games", label: "Outdoor Games" },
    { value: "Mobile Games", label: "Mobile Games" },
    { value: "Arcade", label: "Arcade" },
    { value: "Pen & Paper", label: "Pen & Paper" },
    { value: "Party Game", label: "Party Game" },
    { value: "Two Player", label: "Two Player" },
    { value: "MultiPlayer", label: "MultiPlayer" },
    { value: "Other", label: "Other" },
  ];

  const handleLabelChange = (selectedOptions) => {
    setSelectedLabels(selectedOptions);
  };

  const handleAddRule = () => {
    const isValidToAdd =
      rules.length > 0 && !rules.some((rule) => rule.value.trim() === "");

    if (isValidToAdd) {
      const newRule = {
        id: rules.length + 1,
        value: "",
        collapsed: false,
      };
      setRules([...rules, newRule]);
    }
  };

  const handleRuleChange = (id, value) => {
    const newRules = rules.map((rule) =>
      rule.id === id ? { ...rule, value } : rule
    );
    setRules(newRules);
  };

  const handleToggleCollapse = (id) => {
    const newRules = rules.map((rule) =>
      rule.id === id ? { ...rule, collapsed: !rule.collapsed } : rule
    );
    setRules(newRules);
  };

  const handleDeleteRule = (event, id) => {
    event.stopPropagation();

    if (rules.length > 1) {
      const updatedRules = rules.filter((rule) => rule.id !== id);
      const reorderedRules = updatedRules.map((rule, index) => ({
        ...rule,
        id: index + 1,
      }));
      setRules(reorderedRules);
    }
  };

  const handleSubmitGame = async () => {
    try {
      const gameToAdd = {
        name: gameName,
        description: gameDescription,
        labels: selectedLabels.map((label) => label.value),
        rules: rules.map((rule) => rule.value),
        stars: 0,
      };

      if (selectedGame) {
        gameToAdd.stars = selectedGame.stars;

        await updateDoc(doc(db, "games", selectedGame.id), gameToAdd);
        console.log("Game edited with ID: ", selectedGame.id);
      } else {
        const docRef = await addDoc(collection(db, "games"), gameToAdd);
        console.log("Game added with ID: ", docRef.id);
      }

      setGameName("");
      setGameDescription("");
      setSelectedLabels([]);
      setRules([{ id: 1, value: "", collapsed: false }]);
      setAddingNewGame(false);
    } catch (error) {
      console.error("Error adding/editing game: ", error);
    }
  };

  return (
    <Modal
      style={{ backgroundColor: "#000000ab" }}
      show={addingNewGame !== false}
      onHide={() => setAddingNewGame(false)}
      className="custom-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title style={{ alignItems: "center", display: "flex" }}>
          {" "}
          <BiSolidGame /> Add a New Game to the Public Archive
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ backgroundColor: "#19365a" }}>
        <div className="d-flex flex-column gap-4">
          <div className="d-flex flex-row gap-3">
            <img
              src="https://64.media.tumblr.com/6f5909b8f25f8d5203c1568d3a7063f6/tumblr_pi1kc68Jqx1ro8ysbo1_500.gif"
              alt=""
              style={{ height: "100px", width: "100px" }}
            />

            <div className="d-flex flex-column gap-1" style={{ width: "100%" }}>
              <input
                className="form-control"
                placeholder="Name"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
              />
              <textarea
                className="form-control"
                placeholder="Description"
                value={gameDescription}
                onChange={(e) => setGameDescription(e.target.value)}
              />
            </div>
          </div>

          <Select
            className="select-input"
            placeholder="Labels"
            isMulti
            options={labelOptions}
            value={selectedLabels}
            onChange={handleLabelChange}
          />

          <div className="accordion">
            {rules.map((rule) => (
              <div key={rule.id} className={`accordion-item`}>
                <div className={`accordion-header`}>
                  <button
                    className="accordion-button"
                    type="button"
                    onClick={() => handleToggleCollapse(rule.id)}
                  >
                    <div
                      className="d-flex justify-content-between align-items-center"
                      style={{ width: "100%" }}
                    >
                      <span>Rule {rule.id}</span>
                      <div className="d-flex justify-content-between align-items-center gap-2">
                        <ImBin
                          className={`delete-button ${
                            rules.length <= 1 ? "disabled" : ""
                          }`}
                          onClick={(e) =>
                            rules.length > 1 && handleDeleteRule(e, rule.id)
                          }
                          disabled={rules.length <= 1}
                        >
                          Delete
                        </ImBin>
                        {rule.collapsed ? (
                          <HiMiniArrowSmallDown
                            className="collapsible-button"
                            style={{
                              fontSize: "24px",
                            }}
                            onClick={() => handleToggleCollapse(rule.id)}
                          />
                        ) : (
                          <HiMiniArrowSmallUp
                            className="collapsible-button"
                            style={{
                              fontSize: "24px",
                            }}
                            onClick={() => handleToggleCollapse(rule.id)}
                          />
                        )}
                      </div>
                    </div>
                  </button>
                </div>
                <div
                  className={`accordion-collapse ${
                    rule.collapsed ? "collapse" : "show"
                  }`}
                >
                  <div>
                    <textarea
                      className="form-control"
                      placeholder={`Enter Rule ${rule.id}`}
                      value={rule.value}
                      onChange={(e) =>
                        handleRuleChange(rule.id, e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="d-flex gap-5 ">
            <button
              className="btn btn-success"
              variant="primary"
              onClick={handleAddRule}
              disabled={
                rules.length === 0 ||
                rules.some((rule) => rule.value.trim() === "")
              }
            >
              Add Another Rule
            </button>
            <button
              className="btn btn-success"
              variant="primary"
              onClick={handleSubmitGame}
              disabled={
                gameName.length === 0 ||
                gameDescription.length === 0 ||
                selectedLabels.length === 0 ||
                rules.length === 0 ||
                rules.some((rule) => rule.value.trim() === "")
              }
            >
              Submit Game
            </button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};
