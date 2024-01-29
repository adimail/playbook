import React from "react";
import { auth, googleProvider } from "../config/firebase";
import { signInWithPopup } from "firebase/auth";
import "./auth.css";
import { Tweet } from "react-tweet";
import { FaGoogle } from "react-icons/fa";

export const Login = () => {

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="body gap-5">
      <div className="container gap-3">
        Welcome to the public archive of non digital games
        <button className="button" onClick={signInWithGoogle}>Continue with Google <FaGoogle /></button>
        Be nice  🤗
      </div>
      <div className="tweet">
        Source:
        <Tweet id="1751455973720424658" data-width="10" />
      </div>
    </div>
  );
};

export default Login;
