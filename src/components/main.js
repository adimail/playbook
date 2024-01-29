import React, { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { db, auth } from "../config/firebase";
import { GameModal } from "./gameModal";
import { AddGameModal } from "./addgame";
import { getDocs, collection } from "firebase/firestore";
import { MdError } from "react-icons/md";
import { FaGithub } from "react-icons/fa";
import "./main.css";

export const MainComponent = () => {
  const [gameList, setGameList] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [addingNewGame, setAddingNewGame] = useState(false);

  const gamesCollectionRef = collection(db, "games");

  const getGameList = async () => {
    try {
      const data = await getDocs(gamesCollectionRef);
      const filteredData = data.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setGameList(filteredData);
    } catch (err) {
      console.error(err);
    }
  };

  const openModal = (game) => {
    setSelectedGame(game);
  };

  useEffect(() => {
    getGameList();
  });

  return (
    <div className="main container">
      <div className="text-center">
        <h1 className="mt-4 mb-4">Play Book</h1>
      </div>
      <div className="d-flex gap-3 w-100">
        <button
          className="btn btn-success mb-4"
          onClick={() => setAddingNewGame(true)}
        >
          Add Game
        </button>
        <button className="btn btn-secondary mb-4">Discussions</button>
        <button className="btn btn-danger mb-4" onClick={logout}>
          Log out
        </button>
        <div style={{ display:"flex", color:"white"}}>
        <a href="https://github.com/adimail/playbook">
        <FaGithub style={{fontSize:"40px", color:"white"}} />
        </a>
        </div>
      </div>
      {gameList.length !== 0 ? 
      <div className="row">
        {gameList.map((game) => (
          <div key={game.id} className="col-md-12 mb-4">
            <div
              className="card d-flex flex-column h-100"
              style={{ cursor: "pointer" }}
              onClick={() => openModal(game)}
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
      </div>:
      <div className="error">
        <span>Error connecting to firebase instance <MdError /></span>
        <br/>
        <span>Read console outputs for more info about error</span>
      </div>
    }

      <GameModal
        setSelectedGame={setSelectedGame}
        selectedGame={selectedGame}
      />

      <AddGameModal
        addingNewGame={addingNewGame}
        setAddingNewGame={setAddingNewGame}
      />
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
