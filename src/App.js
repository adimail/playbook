// frontend
import "./App.css";
import { MdError } from "react-icons/md";
import React, { useState, useEffect } from "react";
import { GoStarFill, GoStar } from "react-icons/go";
import { FaGithub } from "react-icons/fa";
import { OverlayTrigger, Tooltip } from "react-bootstrap";

// Firebase components
import { useAuthState } from "react-firebase-hooks/auth";
import { db, auth } from "./config/firebase";
import {
  collection,
  limit,
  query,
  deleteDoc,
  doc,
  orderBy,
  onSnapshot,
  updateDoc,
  increment,
  setDoc,
  getDoc,
} from "firebase/firestore";

import { Login, logout } from "./config/user";
import { GameModal, AddGameModal } from "./components/game";
import { DiscussionPanel } from "./components/discussion";

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

const MainComponent = () => {
  const [user] = useAuthState(auth);
  const [gameList, setGameList] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [addingNewGame, setAddingNewGame] = useState(false);
  const [showDiscussionPanel, setShowDiscussionPanel] = useState(false);
  const [showDiscussionModal, setShowDiscussionModal] = useState(false);
  const [userStarredGames, setUserStarredGames] = useState([]);

  const toggleDiscussionPanel = () =>
    setShowDiscussionPanel(!showDiscussionPanel);
    
  const gamesCollectionRef = collection(db, "games");

  const renderTooltip = (text) => <Tooltip>{text}</Tooltip>;

  const openModal = (game) => {
    setSelectedGame(game);
  };

  const starGame = async (gameId) => {
    try {
      const gameRef = doc(db, "games", gameId);

      const gameSnapshot = await getDoc(gameRef);
      const currentStars = gameSnapshot.data().stars || 0;

      if (userStarredGames.includes(gameId)) {
        await updateDoc(gameRef, {
          stars: currentStars > 0 ? increment(-1) : 0,
        });

        const starredGameDoc = doc(
          collection(db, "users", user.uid, "starredGames"),
          gameId,
        );
        await deleteDoc(starredGameDoc);

        setUserStarredGames((prevStarredGames) =>
          prevStarredGames.filter((id) => id !== gameId),
        );
      } else {
        await updateDoc(gameRef, {
          stars: increment(1),
        });

        const starredGamesRef = collection(
          db,
          "users",
          user.uid,
          "starredGames",
        );
        await setDoc(doc(starredGamesRef, gameId), { starred: true });

        setUserStarredGames((prevStarredGames) => [
          ...prevStarredGames,
          gameId,
        ]);
      }
    } catch (error) {
      console.error("Error starring game:", error);
    }
  };

  const getGameList = () => {
    try {
      const q = query(gamesCollectionRef, orderBy("stars", "desc"), limit(30));

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const updatedData = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
          stars: doc.data().stars || 0,
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

    const starredGamesRef = collection(db, "users", user.uid, "starredGames");
    const unsubscribeStarred = onSnapshot(starredGamesRef, (snapshot) => {
      const starredGames = snapshot.docs.map((doc) => doc.id);
      setUserStarredGames(starredGames);
    });

    return () => {
      unsubscribeFromSnapshot();
      unsubscribeStarred();
    };
  }, [user]);

  return (
    <>
      <div className="d-flex w-100 flex-column">
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
            <h1 className="mb-3">Play Book</h1>
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
                    style={{
                      backgroundColor: "#13263d",
                      border: "0.5px solid #ffffff69",
                      color: "white",
                    }}
                  >
                    <div className="card-body flex-grow-1">
                      <h5 className="card-title d-flex justify-content-between w-100">
                        <div>{game.name}</div>
                        <small
                          className="d-flex align-items-center gap-1"
                          onClick={() => starGame(game.id)}
                        >
                          {userStarredGames.includes(game.id) ? (
                            <GoStarFill style={{ color: "gold" }} />
                          ) : (
                            <GoStar style={{ color: "gold" }} />
                          )}{" "}
                          {game.stars}
                        </small>
                      </h5>
                      <div
                        onClick={() => openModal(game)}
                        style={{ cursor: "pointer" }}
                      >
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
        <a href="https://twitter.com/adityagodse381"> Aditya Godse</a>
      </footer>
    </>
  );
};

export default App;
