import "../App.css"
import React from 'react';
import { auth } from '../config/firebase';

const ChatMessage = (props) => {
  const { text, uid, photoURL, createdAt, isSticker, stickerURL } = props.message;

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

export default ChatMessage;
