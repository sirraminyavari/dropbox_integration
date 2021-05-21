import React, { useState, useEffect } from 'react';
import {Dropbox} from 'dropbox';
import { parseQueryString } from './utils'


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
  const [dbx, setDbx] = useState(null);

  useEffect(() => {
    window.addEventListener('message', e => {
      const data = e.data;
      if (data) {
        const { hash, search } = e.data;
        // Do we trust the sender of this message? (might be
        // different from what we originally opened, for example).
        if (e.origin !== 'http://localhost:3000') {
          return;
        }
        const accessToken = parseQueryString(hash).access_token;
        if(accessToken) {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ loggedIn: true, accessToken}));
          setDbxData({ loggedIn: true, accessToken});
          setDbx(new Dropbox({ accessToken}));
        }
      }
    }, false);
  });

  useEffect(() => {
    if(dbxData.loggedIn) {
      setDbx(new Dropbox({ accessToken: dbxData.accessToken , fetch}));
    }
  }, [dbxData]);

  useEffect(() => {
    if (dbx !== null) {
      initializeFiles();
    }
  }, [dbx]);

  const initializeFiles = () => {
    console.log(dbx);
    dbx.filesListFolder({
      path: '',
      limit: 2
    }).then(res => { console.log(res)}).catch(e => console.log(e));
  }

  const login = async() => {

    const dbx = new Dropbox({ clientId: CLIENT_ID });
    const url = await dbx.auth.getAuthenticationUrl(REDIRECT_URI);
    const features ='toolbar=no, menubar=no, width=600, height=700, top=200, left=200';

    window.open(url, 'login', '_blank', features, true);
  }

 
  const logout = () => {
      window.localStorage.removeItem(STORAGE_KEY);
      setDbxData({ loggedIn: false, undefined})
  }

  return (
    <div>
      <div>Drop Box</div>
      { !dbxData.loggedIn &&  <button onClick={() => login()}>login</button>}
      { dbxData.loggedIn &&  <div >Your Logged In</div>}
      { dbxData.loggedIn &&  <button onClick={() => logout()}>logout</button>}
    </div>
  )
}
export default DropboxMain;