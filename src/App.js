import './App.css';
import DropboxMain from './components/dropbox'
import { useEffect} from 'react';

function App() {

  useEffect(() => {
    
    const hash = window.location.hash;
    const search = window.location.search;
  
    if (window.opener) {
      const data = {hash, search}
      window.opener.postMessage(data);
      window.close();
    }
  
  }, []);

  return (
    <div className="App">
      <DropboxMain></DropboxMain>
    </div>
  );
}

export default App;
