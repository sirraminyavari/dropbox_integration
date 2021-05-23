import React, { useState, useEffect } from 'react';
import {Dropbox} from 'dropbox';
import { parseQueryString, resolveThumbnail, sortDropboxFiles } from './utils'
import { EMPTY, from, of } from 'rxjs';
import { tap, map, switchMap } from 'rxjs/operators';
import { dropboxToCilentModel } from './utils'
import ListView from './list.view'
import { catchError } from 'rxjs/operators';


const STORAGE_KEY = 'pwnzolgprg7hngfkjscg59vd';
const CLIENT_ID = `gguc9kwsbgr920c`;
const REDIRECT_URI = 'http://localhost:3000';


const initQuery = {pageToken: '', value: '', parent: 'root'};
const initPath = [{name: 'root', id: ''}];
const initEmbed = { status: false, url: ''};
const fetchDataErrorInit = { status: false, message: null, code: 0}

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
  const [loadNext, setLoadNext] = useState(false);
  const [files, setFiles] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [pageToken, setPageToken] = useState(undefined);
  const [loading, setLoading] = useState(false);
  const [grid, setGrid] = useState(false);
  const [path, setPath] = useState(initPath);
  const [query, setQuery] = useState(initQuery);
  const [embed, setEmbed] = useState(initEmbed)
  const [selected, setSelected] = useState([]);
  const [fetchDataError, setFetchDataError] = useState(fetchDataErrorInit);

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
      setDbx(new Dropbox({ accessToken: dbxData.accessToken}));
    }
  }, [dbxData]);


  useEffect(() => {

    const load$ = load().subscribe();
    
    return () => { load$.unsubscribe(); }
  }, [dbx, path]);


  useEffect(() => {
    
    let loadNext$ = EMPTY
    if(pageToken) {
      loadNext$ = next().subscribe();
    }

    return () => { }
  }, [loadNext]);

  const load = () => {
    setLoading(true);
    if (dbx === null) return EMPTY;
    return from(dbx.filesListFolder({
      path: path.id,
      limit: 3
    })).pipe(
      tap(x => {
        setPageToken(x.result.cursor);
        setHasMore(x.result.has_more);
      }),
      map(x => x.result),
      map(x => x.entries.map(y => dropboxToCilentModel(y))),
      switchMap(x => {
        const model = x;
        return loadThumbnails(x).pipe(
          map(res => resolveThumbnail(model, res.result.entries)),
          map(x => files.concat(x) ),
          tap(x => { setFiles(x); setLoading(false)}),
          tap(() => files.sort((a, b) => sortDropboxFiles(a, b))),
          catchError(err => {
            setLoading(false);
            return of(err);
          })
        );
      })
    );
  }

  const next = () => {
    setLoading(true);
    return from(dbx.filesListFolderContinue({
      cursor: pageToken
    })).pipe(
      tap(x => {
        console.log(x);
        setPageToken(x.result.cursor);
        setHasMore(x.result.has_more);
      }),
      map(x => x.result),
      map(x => x.entries.map(y => dropboxToCilentModel(y))),
      switchMap(x => {
        const model = x;
        return loadThumbnails(x).pipe(
          map(res => resolveThumbnail(model, res.result.entries)),
          map(x => files.concat(x) ),
          tap(x => { setFiles(x); setLoading(false)}),
          tap(() => files.sort((a, b) => sortDropboxFiles(a, b))),
          catchError(err => {
            setLoading(false);
            return of(err);
          })
        );
      })
    )
  }

  const loadThumbnails = (files) => {
    return of(files)
      .pipe(
        map(x => x.filter(x => x.type !== 'folder')),
        map(x => x.map( y => ({
          path: y.pathLower,
          size: 'w64h64'
        }))),
        switchMap(x => {
          return from(dbx.filesGetThumbnailBatch({
            entries: JSON.parse(JSON.stringify(x))
          }))
        })
      );
  }


  const login = async() => {

    const dbx = new Dropbox({ clientId: CLIENT_ID });
    const url = await dbx.auth.getAuthenticationUrl(REDIRECT_URI);
    const features ='toolbar=no, menubar=no, width=600, height=700, top=200, left=200';

    window.open(url, 'login', '_blank', features, true);
  }

 
  const disconnect = () => {
      window.localStorage.removeItem(STORAGE_KEY);
      setDbxData({ loggedIn: false, undefined})
  }

  /*
   *  OPEN FOLDER TYPE ITEMS AND LOAD FOLDER FILES
      this method triggers when an item clicked. when the item type is folder the path state to this folder.
  */
    const openFolder = (file) => {
    }

        /*
    *   OPEN EMBEDED FILE PREVIEW
    */
        const closeEmbed = () => {
          
      }
  
  
      /*
      *   CLOSE EMBEDED FILE PREVIEW
      */
      const openEmbed = (file) => {
          
      }

          /*
    *   ADD FILE TO SELECTED FILES
    */
    const addToSelected = (file) => {
 
  }

  /*
  *   REMOVE ITEM FROM SELECTED FILES
  */
  const removeFromSelected = (file) => {

  }

  return (
    <div>
      <div>Drop Box</div>
      { !dbxData.loggedIn &&  <button onClick={() => login()}>login</button>}
      { dbxData.loggedIn &&  <div >Your Logged In</div>}
      {/* { dbxData.loggedIn &&  <button onClick={() => logout()}>logout</button>} */}
        <div className="wrapper">

            <div className="disconnect-box">
                {/* <button
                    disabled={selected.length === 0}
                    className="insert-btn"
                    onClick={() => insert()}>
                    INSERT
                </button>
                <button
                    disabled={selected.length === 0}
                    className="insert-btn"
                    onClick={() => flushSelectedFiles()}>
                    CANCEL
                </button>

                <div style={{flexGrow: 3}}></div> */}

                <button
                    className="disconnect-btn"
                    onClick={() => disconnect()}>
                    DISCONNECT
                </button>
            </div>


            {/* search feild */}
            {/* <div className="search-box">
                <div>
                    <input className="search-field"
                           value={query.value}
                           type="text"
                           placeholder="Search"
                           onChange={e => search(e)}/>
                </div>
            </div> */}

            
            <div className="search-box">
                <div className="filter-box">
                    {/* <button className="filter-btn" onClick={() => reset()}>RESET SEARCH</button> */}
                    <div style={{flexGrow: 4}}></div>
                    <button className={grid ? 'filter-btn' : 'selected'}
                            onClick={() => setGrid(false)}>LIST
                    </button>
                    <button className={!grid ? 'filter-btn' : 'selected'}
                            onClick={() => setGrid(true)}>GRID
                    </button>
                </div>
            </div>

            {/* <PathView paths={path} navigate={navigatePath}></PathView> */}

            {/* { !fetchDataError.status &&
            <SelectedFileContext.Provider value={selected}> */}
                <ListView files={files}
                          open={openFolder}
                          preview={openEmbed}
                          grid={grid} addToSelected={addToSelected}
                          removeFromSelected={removeFromSelected}>
                </ListView>
            {/* </SelectedFileContext.Provider>
            } */}

            {
                !loading && !fetchDataError.status &&
                <div style={{display: (!hasMore) ? 'none' : 'block'}}>
                    <button onClick={() => setLoadNext(!loadNext)} className="load-more-btn">LOAD MORE</button>
                </div>
            }

            {
                loading && !fetchDataError.status &&
                <div> ... loading ...</div>
            }

            {/* {embed.status && <EmbedFilePreview close={closeEmbed} url={embed.url} api={gapi}></EmbedFilePreview>} */}

            {/* {fetchDataError.status && <ErrorPage error={fetchDataError}
                                                 back={returnToHome}
                                                 reload={reset}></ErrorPage>} */}
        </div>
    </div>
  )
}
export default DropboxMain;