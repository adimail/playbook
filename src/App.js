import './App.css';
import { Login } from './config/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './config/firebase';
import { MainComponent } from "./components/main";

function App() {

  const [user] = useAuthState(auth)
  
  return (
    <div className="App">
      <header className="App-header">
        {user ? <MainComponent /> : ( <Login /> )}
      </header>
    </div>
  );
}

export default App;
