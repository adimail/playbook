// frontend
import "../App.css";
import React, { useState, useEffect } from "react";

import { IoSend } from "react-icons/io5";
import ChatMessage from "./chatmessage";
import { PiStickerFill } from "react-icons/pi";
import { StickerModal } from "./game";

import { Modal } from "react-bootstrap";

// Firebase components
import { db } from "../config/firebase";
import {
  addDoc,
  collection,
  limit,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

import { debounce } from "./debounce";

export const DiscussionPanel = ({ show, handleClose, user }) => {
  const [discussionMessage, setDiscussionMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [showStickerModal, setShowStickerModal] = useState(false);
  const messageRef = collection(db, "discussion");

  const getMessages = () => {
    try {
      const q = query(messageRef, orderBy("createdAt", "asc"), limit(25));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const filteredData = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setMessages(filteredData);
      });

      return unsubscribe;
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const unsubscribe = getMessages();
    return () => unsubscribe();
  }, []);

  const handleSendMessage = debounce(async () => {
    try {
      if (discussionMessage.trim() === "") {
        return;
      }
      const newMessage = {
        createdAt: new Date(),
        photoURL: user.photoURL,
        text: discussionMessage,
        uid: user.uid,
        isSticker: false,
        stickerURL: "",
      };

      await addDoc(collection(db, "discussion"), newMessage);

      setDiscussionMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }, 300);

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
      await addDoc(collection(db, "discussion"), stickerMessage);
    } catch (error) {
      console.error("Error sending sticker message:", error);
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
        Follow community guidelines and be nice.
      </Modal.Header>
      <Modal.Body style={{ maxHeight: "68vh", overflowY: "auto" }}>
        <div className="discussion-panel d-flex flex-column gap-3">
          {messages &&
            messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <div
          className="d-flex justify-content-between align-items-center w-100 gap-2 mb-2 mt-2"
          style={{ height: "30px" }}
        >
          <input
            value={discussionMessage}
            onChange={(e) => setDiscussionMessage(e.target.value)}
            placeholder="Enter your message"
            className="flex-grow-1"
            style={{ marginRight: "8px" }}
          />
          <PiStickerFill
            className="sticker"
            onClick={() => setShowStickerModal(true)}
          />
          <button
            className="btn btn-sm btn-primary d-flex align-items-center"
            variant="primary"
            onClick={handleSendMessage}
            style={{ width: "max-content", height: "30px" }}
          >
            <IoSend />
          </button>
        </div>
      </Modal.Footer>
      <StickerModal
        show={showStickerModal}
        handleClose={() => setShowStickerModal(false)}
        onSelectSticker={handleSelectSticker}
      />
    </Modal>
  );
};
