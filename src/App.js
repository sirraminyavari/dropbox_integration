import './App.css';
import DropboxMain from './components/dropbox'
import { useEffect, useState} from 'react';
import GoogleDrive from './components/google.drive';

function App() {

  const [drive, setDrive] = useState('gdrive');

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
      <div>
        <button onClick={() => setDrive('gdrive')}>GOOGLE DRIVE</button>
        <button onClick={() => setDrive('dropbox')}>DROPBOX</button>
      </div>
      {drive === "gdrive" && <GoogleDrive></GoogleDrive>}
      {drive === "dropbox" && <DropboxMain></DropboxMain>}
    </div>
  );
}

export default App;
