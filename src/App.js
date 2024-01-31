// frontend
import "./App.css";
import Select from "react-select";
import { Tweet } from "react-tweet";
import { ImBin } from "react-icons/im";
import { MdError } from "react-icons/md";
import { BiSolidGame } from "react-icons/bi";
import React, { useState, useEffect } from "react";
import { FaGoogle, FaGithub } from "react-icons/fa";
import { Modal, Button, OverlayTrigger, Tooltip } from "react-bootstrap";
import { HiMiniArrowSmallDown, HiMiniArrowSmallUp } from "react-icons/hi2";

// Firebase components
import { signOut, signInWithPopup } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { db, auth, googleProvider } from "./config/firebase";
import {
  addDoc,
  collection,
  limit,
  query,
  deleteDoc,
  doc,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

// App entrypoint
function App() {
  const [user] = useAuthState(auth);

  return (
    <>
      <div className="App">
        <header className="App-header">
          {user ? <MainComponent /> : <Login />}
        </header>
      </div>
    </>
  );
}

function ChatMessage(props) {
  const { text, uid, photoURL, createdAt } = props.message;

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
          <p>{text}</p>
          <span>{dateString}</span>
        </div>
      </div>
    </>
  );
}

const DiscussionPanel = ({ show, handleClose, user }) => {
  const [discussionMessage, setDiscussionMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const messageRef = collection(db, "discussion");

  const getMessages = () => {
    try {
      const unsubscribe = onSnapshot(
        query(messageRef, orderBy("createdAt", "asc"), limit(25)),
        (querySnapshot) => {
          const filteredData = querySnapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
          }));
          setMessages(filteredData);
        },
      );

      return () => unsubscribe();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const unsubscribe = getMessages();
    return () => unsubscribe();
  }, []);

  const handleSendMessage = async () => {
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

      await addDoc(collection(db, "discussion"), newMessage);

      setDiscussionMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
      size="xl"
      dialogClassName="discussion-modal"
    >
      <Modal.Header className="d-flex flex-column" closeButton>
        <Modal.Title>Discussion Panel</Modal.Title>
        Follow community guidlines and be nice.
      </Modal.Header>
      <Modal.Body>
        <div className="discussion-panel d-flex flex-column gap-3">
          {messages &&
            messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <div className="d-flex justify-content-between w-100">
          <input
            value={discussionMessage}
            onChange={(e) => setDiscussionMessage(e.target.value)}
            placeholder="Enter your message"
            className="flex-grow-1"
            style={{ marginRight: "8px" }}
          />
          <button
            className="btn btn-sm btn-primary"
            variant="primary"
            onClick={handleSendMessage}
            style={{ width: "max-content" }}
          >
            Send Message
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

const Login = () => {
  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="body gap-5" style={{ transform: "scale(0.8)" }}>
      <div className="container gap-3">
        <h1>Welcome to PlayBook 🪁 🧩</h1>
        <span>
          A public archive and memory box to store and discuss games from our
          childhood
        </span>
        <button className="button" onClick={signInWithGoogle}>
          Continue with Google <FaGoogle />
        </button>
        Be nice 🤗
      </div>
      <div className="tweet">
        <span>Idea:</span>
        <Tweet id="1751455973720424658" data-width="10" />
      </div>
    </div>
  );
};

const logout = async () => {
  try {
    await signOut(auth);
  } catch (err) {
    console.error(err);
  }
};

const MainComponent = () => {
  const [user] = useAuthState(auth);

  const [gameList, setGameList] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [addingNewGame, setAddingNewGame] = useState(false);
  const [showDiscussionPanel, setShowDiscussionPanel] = useState(false);
  const [showDiscussionModal, setShowDiscussionModal] = useState(false);

  const toggleDiscussionPanel = () =>
    setShowDiscussionPanel(!showDiscussionPanel);
  const gamesCollectionRef = collection(db, "games");

  const renderTooltip = (text) => <Tooltip>{text}</Tooltip>;

  const openModal = (game) => {
    setSelectedGame(game);
  };

  const getGameList = () => {
    try {
      const q = query(gamesCollectionRef, limit(10));

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const updatedData = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setGameList(updatedData);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const unsubscribeFromSnapshot = getGameList();

    return () => unsubscribeFromSnapshot();
  }, []);

  return (
    <>
      <div className="d-flex w-100">
        <div className="userimage">
          <OverlayTrigger
            placement="bottom"
            overlay={renderTooltip(`${user.displayName}`)}
          >
            {user && <img src={user.photoURL} alt="Profile" />}
          </OverlayTrigger>
          <div className="git-icon">
            <a
              style={{ color: "white" }}
              href="https://github.com/adimail/playbook"
            >
              <FaGithub />
            </a>
          </div>
        </div>
        <div className="main container">
          <div className="text-center">
            <h1 className="mt-5 mb-4">Play Book</h1>
          </div>
          <div className="d-flex gap-3 w-100 justify-content-around">
            <OverlayTrigger
              placement="bottom"
              overlay={renderTooltip("Click to add a new game")}
            >
              <button
                style={{ fontSize: "13px", maxWidth: "180px" }}
                className="pagebuttons btn btn-sm btn-success mb-4"
                onClick={() => setAddingNewGame(true)}
              >
                Add Game 🎲
              </button>
            </OverlayTrigger>

            <OverlayTrigger
              placement="bottom"
              overlay={renderTooltip("Chat with community")}
            >
              <button
                style={{ fontSize: "13px", maxWidth: "180px" }}
                className="pagebuttons btn btn-sm btn-secondary mb-4"
                onClick={() => toggleDiscussionPanel()}
              >
                Discussions 💭
              </button>
            </OverlayTrigger>

            <OverlayTrigger
              placement="bottom"
              overlay={renderTooltip("Click to log out")}
            >
              <button
                style={{ fontSize: "13px", maxWidth: "180px" }}
                className="pagebuttons btn btn-sm btn-danger mb-4"
                onClick={logout}
              >
                Log out 👋
              </button>
            </OverlayTrigger>
          </div>
          <hr style={{ background: "#fff" }} />
          {gameList.length !== 0 ? (
            <div className="row w-100">
              {gameList.map((game) => (
                <div key={game.id} className="game col-md-12 mb-4">
                  <div
                    className="card d-flex flex-column h-100"
                    onClick={() => openModal(game)}
                    style={{
                      cursor: "pointer",
                      backgroundColor: "#13263d",
                      border: "0.5px solid #ffffff69",
                      color: "white",
                    }}
                  >
                    <div className="card-body flex-grow-1">
                      <h5 className="card-title">{game.name}</h5>
                      <p className="description">{game.description}</p>
                      <div className="lable-container">
                        {game.labels.map((label, index) => (
                          <div className="game-label" key={index}>
                            {label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="error">
              <span>
                Error connecting to firebase instance <MdError />
              </span>
              <br />
              <span>
                Chances are, daily quota for document read requests (50k) for my
                firebase instance is over. Try again after some time
              </span>
            </div>
          )}

          <GameModal
            setSelectedGame={setSelectedGame}
            selectedGame={selectedGame}
            user={user}
            showDiscussionModal={showDiscussionModal}
            setShowDiscussionModal={setShowDiscussionModal}
          />

          <AddGameModal
            addingNewGame={addingNewGame}
            setAddingNewGame={setAddingNewGame}
            user={user}
          />

          <DiscussionPanel
            show={showDiscussionPanel}
            handleClose={toggleDiscussionPanel}
            user={user}
          />
        </div>
      </div>
      <footer className="footer">
        Made with love by{" "}
        <a href="https://twitter.com/adityagodse381">Aditya Godse</a>
      </footer>
    </>
  );
};

// ... (your other imports)

const GameModal = ({
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
        },
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
        <Modal.Title>{discussionOpen ? `${selectedGame?.name} Discussion` : selectedGame?.name}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {discussionOpen ? (
          <div className="discussion-panel d-flex flex-column gap-3">
            {gameMessages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
          </div>
        ) : (
          selectedGame && selectedGame.description && (
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
        <Button
          variant="primary"
          onClick={discussionOpen ? handleCloseDiscussion : handleOpenDiscussion}
          style={{ width: "fit-content", padding: "3px 10px" }}
        >
          {discussionOpen ? 'Close Discussion' : 'Open Discussion'}
        </Button>
        {discussionOpen && (
          <div className="d-flex justify-content-between w-100">
            <input
              value={discussionMessage}
              onChange={(e) => setDiscussionMessage(e.target.value)}
              placeholder="Enter your message"
              className="flex-grow-1"
              style={{ marginRight: "8px" }}
            />
            <button
              className="btn btn-sm btn-primary"
              onClick={handleSendGameMessage}
              style={{ width: "max-content" }}
            >
              Send Message
            </button>
          </div>
        )}
      </Modal.Footer>

      <AddGameModal
        addingNewGame={editing}
        setAddingNewGame={setEditing}
        selectedGame={selectedGame}
      />
    </Modal>
  );
};

// ... (rest of the code)


const AddGameModal = ({ addingNewGame, setAddingNewGame, selectedGame }) => {
  const [gameName, setGameName] = useState(
    selectedGame ? selectedGame.name : "",
  );
  const [gameDescription, setGameDescription] = useState(
    selectedGame ? selectedGame.description : "",
  );
  const [selectedLabels, setSelectedLabels] = useState(
    selectedGame
      ? selectedGame.labels.map((label) => ({ value: label, label }))
      : [],
  );
  const [rules, setRules] = useState(
    selectedGame
      ? selectedGame.rules.map((rule, index) => ({
          id: index + 1,
          value: rule,
          collapsed: false,
        }))
      : [{ id: 1, value: "", collapsed: false }],
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
  ];

  const handleLabelChange = (selectedOptions) => {
    setSelectedLabels(selectedOptions);
  };

  const handleAddRule = () => {
    const isValidToAdd =
      rules.length > 0 && !rules.some((rule) => rule.value.trim() === "");

    if (isValidToAdd) {
      const newRule = { id: rules.length + 1, value: "", collapsed: false };
      setRules([...rules, newRule]);
    }
  };

  const handleRuleChange = (id, value) => {
    const newRules = rules.map((rule) =>
      rule.id === id ? { ...rule, value } : rule,
    );
    setRules(newRules);
  };

  const handleToggleCollapse = (id) => {
    const newRules = rules.map((rule) =>
      rule.id === id ? { ...rule, collapsed: !rule.collapsed } : rule,
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
      };

      if (selectedGame) {
        await deleteDoc(doc(db, "games", selectedGame.id));

        const newDocRef = await addDoc(collection(db, "games"), gameToAdd);
        console.log(
          "Game edited with ID: ",
          selectedGame.id,
          "New entry added with ID: ",
          newDocRef.id,
        );
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
                            style={{ fontSize: "24px" }}
                            onClick={() => handleToggleCollapse(rule.id)}
                          />
                        ) : (
                          <HiMiniArrowSmallUp
                            className="collapsible-button"
                            style={{ fontSize: "24px" }}
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

export default App;
