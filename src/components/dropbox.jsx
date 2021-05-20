import React, { useState, useEffect } from 'react';
import {Dropbox} from 'dropbox';

const STORAGE_KEY = 'pwnzolgprg7hngfkjscg59vd'
const CLIENT_ID = `gguc9kwsbgr920c`;
const REDIRECT_URI = 'http://localhost:3000';


const dbxInitialState = () => {
  try {
    // Get from local storage by key
    const item = window.localStorage.getItem(STORAGE_KEY);
    // Parse stored json or if none return initialValue
    return item ? JSON.parse(item) : { loggedIn: false, accessToken: undefined};
  } catch (error) {
    // If error also return initialValue
    return { loggedIn: false, accessToken: undefined};
  }
} 

const DropboxMain = () => {

  const [dbxData, setDbxData] = useState(() => dbxInitialState());

  useEffect(() => {
    window.addEventListener('message', e => {

      // Do we trust the sender of this message? (might be
      // different from what we originally opened, for example).
      if (e.origin !== 'http://localhost:3000') {
        return;
      }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ loggedIn: true, accessToken: e.data}));
      setDbxData({ loggedIn: true, accessToken: e.data})
    });
  });

  const login = async() => {

    const dbx = new Dropbox({ clientId: CLIENT_ID });
    const url = await dbx.auth.getAuthenticationUrl(REDIRECT_URI);
    const features ='toolbar=no, menubar=no, width=600, height=700, top=100, left=100';

    window.open(url, 'login', '_blank', features);
  }

 
  const logout = () => {

  }

  return (
    <div>
      <div>Drop Box</div>
      { !dbxData.loggedIn &&  <button onClick={() => login()}>login</button>}
      { dbxData.loggedIn &&  <div >Your Logged In</div>}
    </div>
  )
}
export default DropboxMain;