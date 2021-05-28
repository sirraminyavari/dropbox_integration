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


  const getSelectedItems = (files) => {
    console.log(files);
  }

  return (
    <div className="App">
      <div>
        <button onClick={() => setDrive('gdrive')}>GOOGLE DRIVE</button>
        <button onClick={() => setDrive('dropbox')}>DROPBOX</button>
      </div>
      {drive === "gdrive" && <GoogleDrive selected={getSelectedItems}></GoogleDrive>}
      {drive === "dropbox" && <DropboxMain selected={getSelectedItems}></DropboxMain>}
    </div>
  );
}

export default App;
