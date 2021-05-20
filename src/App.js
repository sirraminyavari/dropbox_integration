import logo from './logo.svg';
import './App.css';
import DropboxMain from './components/dropbox'
import { useEffect, useState, useCallback } from 'react';
import { parseQueryString } from './components/utils'

function App() {

  useEffect(() => {
    const accessToken = parseQueryString(window.location.hash).access_token;

    if (window.opener && accessToken) {
      window.opener.postMessage(accessToken);
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
