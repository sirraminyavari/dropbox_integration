import React, { useState, useEffect } from 'react';
import {Dropbox} from 'dropbox';
import { parseQueryString, resolveThumbnail, sortDropboxFiles,
  dropboxToCilentSearchModel, SelectedFileContext } from './utils'
import { EMPTY, from, of } from 'rxjs';
import { tap, map, switchMap, filter, mergeMap, first } from 'rxjs/operators';
import { dropboxToCilentModel, makePath } from './utils'
import ListView from './list.view'
import { catchError } from 'rxjs/operators';
import PathView from './path.view';
import DropboxConnect from './dropbox.connect'
import DropboxEmbedd from './dropbox.embedd';

const STORAGE_KEY = 'pwnzolgprg7hngfkjscg59vd';
const CLIENT_ID = `gguc9kwsbgr920c`;
const REDIRECT_URI = 'http://localhost:3000';


const initLocation = [{name: 'root', path: ''}];
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

const DropboxMain = (props) => {

  const [dbxData, setDbxData] = useState(() => dbxInitialState());
  const [dbx, setDbx] = useState(null);
  const [loadNext, setLoadNext] = useState(false);
  const [files, setFiles] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [pageToken, setPageToken] = useState(undefined);
  const [loading, setLoading] = useState(false);
  const [grid, setGrid] = useState(false);
  const [location, setLocation] = useState(initLocation);
  const [query, setQuery] = useState('');
  const [embed, setEmbed] = useState(initEmbed)
  const [selected, setSelected] = useState([]);
  const [fetchDataError, setFetchDataError] = useState(fetchDataErrorInit);
  const [searching, setSearching] = useState(false);

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

    const load$ = of(location.path).pipe(
      filter(() => !searching),
      switchMap(x => load())
    ).subscribe();

    const searchFiles$ = of(location.path).pipe(
      filter(() => searching),
      switchMap(x => searchFiles())
    ).subscribe();
    
    
    return () => { 
      load$.unsubscribe(); 
      searchFiles$.unsubscribe();
    }
  }, [dbx, location, searching]);


  useEffect(() => {
    const loadNext$ = of(pageToken).pipe(
      filter(() => pageToken && !searching),
      switchMap(x => next())
    ).subscribe();
    return () => { loadNext$.unsubscribe()}
  }, [loadNext]);

  const load = () => {
    setFiles([]);
    setLoading(true);
    if (dbx === null) return EMPTY;
    const { path } = location;
    return from(dbx.filesListFolder({
      path: makePath(location),
      limit: 20
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
          tap(res => { 
            setFiles(res); setLoading(false); }),
          tap(() => files.sort((a, b) => sortDropboxFiles(a, b))),
        );
      }),
      catchError(err => {
        setLoading(false);
        return of(err);
      })
    );
  }

  const next = () => {
    setLoading(true);
    return from(dbx.filesListFolderContinue({
      cursor: pageToken
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
          map(res => files.concat(res) ),
          tap(res => { setFiles(res); setLoading(false); }),
          tap(() => files.sort((a, b) => sortDropboxFiles(a, b))),
        );
      }),
      catchError(err => {
        setLoading(false);
        return of(err);
      })
    )
  }

  const searchFiles = () => {
    setFiles([]);
    setLoading(true);
    return from(dbx.filesSearch({
      path: makePath(location),
      mode: 'filename',
      query
    })).pipe(
      map(x => x.result),
      map(x => x.matches.map(y => dropboxToCilentSearchModel(y))),
      switchMap(x => {
        const model = x;
        return loadThumbnails(x).pipe(
          map(res => resolveThumbnail(model, res.result.entries)),
          tap(res => { setFiles(res); setLoading(false); }),
          tap(() => files.sort((a, b) => sortDropboxFiles(a, b))),
        );
      }),
      catchError(err => {
        setLoading(false);
        return of(err);
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


  const connect = async() => {

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
      if (file.type !== 'folder') {
        return;
      }
      const filePath = file.pathLower;
      const lastInex = filePath.length;
      const lastPortionindex = file.pathLower.lastIndexOf('/') + 1;
      const pathName = filePath.slice(lastPortionindex, lastInex);
      setLocation([...location, {name: pathName, path: filePath}])
    }

    const navigatePath = (selectedLocation) => {
      const fileIndex = location.indexOf(selectedLocation)
      const newLocation = location.slice(0, fileIndex + 1);
      setFiles([]);
      setLocation(newLocation);
    }

    const search = (e) => {
      setQuery(e.target.value);
      if(e.target.value !== '') {
        setSearching(true);
      } else {
        setSearching(false);
      }
    }

    const reset = () => {
      setQuery('');
      setSearching(false);
    }

    /*
    *   OPEN EMBEDED FILE PREVIEW
    */
  const closeEmbed = () => {
        setEmbed({ status: false, url: ''})
  }
  
  
  /*
  *   CLOSE EMBEDED FILE PREVIEW
  */
  const openEmbed = (file) => {
      from(dbx.sharingCreateSharedLink({
        path: file.pathLower,
        short_url: false
      })).pipe(
        first(),
        map(x => x.result),
        tap(x => {
          console.log(dbx)
          setEmbed({ status: true, url: x.url})
        })
      ).subscribe();
  }

  const openInNewTab = (file) => {
    from(dbx.sharingCreateSharedLink({
      path: file.pathLower,
      short_url: true
    })).pipe(
      first(),
      map(x => x.result),
      tap(x => {
        const newWindow = window.open(x.url, '_blank', 'noopener,noreferrer')
        if (newWindow) newWindow.opener = null;
      })
    ).subscribe();
  }

  /*
      *   ADD FILE TO SELECTED FILES
      */
  const addToSelected = (file) => {
    const exist = selected.find(x => x.id === file.id);
    if (!exist) {
        setSelected([...selected, file]);
    }
  }

  /*
  *   REMOVE ITEM FROM SELECTED FILES
  */
  const removeFromSelected = (file) => {
    const removed = selected.filter(x => x.id !== file.id);
    setSelected(removed);
  }

  /*
  *   EMPTY SELECTED FILES ARRAY
  */
  const flushSelectedFiles = () => {
    setSelected([]);
  }

/*
*   PASS SELECTED FILES TO PARENT COMPONENT
*/
const insert = () => {
  props.selected(selected);
  flushSelectedFiles();
}


  if (!dbxData.loggedIn) {
    return <DropboxConnect connect={() => connect()}></DropboxConnect>
  }


  return (
    <div>
        <div className="wrapper">

            <div className="disconnect-box">
                <button
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

                <div style={{flexGrow: 3}}></div>

                <button
                    className="disconnect-btn"
                    onClick={() => disconnect()}>
                    DISCONNECT
                </button>
            </div>


            {/* search feild */}
            <div className="search-box">
                <div>
                    <input className="search-field"
                           value={query}
                           type="text"
                           placeholder="Search"
                           onChange={e => search(e)}/>
                </div>
            </div>

            
            <div className="search-box">
                <div className="filter-box">
                    <button className="filter-btn" onClick={() => reset()}>RESET SEARCH</button>
                    <div style={{flexGrow: 4}}></div>
                    <button className={grid ? 'filter-btn' : 'selected'}
                            onClick={() => setGrid(false)}>LIST
                    </button>
                    <button className={!grid ? 'filter-btn' : 'selected'}
                            onClick={() => setGrid(true)}>GRID
                    </button>
                </div>
            </div>

           {!searching &&  <PathView paths={location} navigate={navigatePath}></PathView>}

            { !fetchDataError.status &&
            <SelectedFileContext.Provider value={selected}>
                <ListView files={files}
                          open={openFolder}
                          preview={openEmbed}
                          openFile={openInNewTab}
                          grid={grid} addToSelected={addToSelected}
                          removeFromSelected={removeFromSelected}>
                </ListView>
            </SelectedFileContext.Provider>
            }

            {
                !loading && !fetchDataError.status && !searching &&
                <div style={{display: (!hasMore) ? 'none' : 'block'}}>
                    <button onClick={() => setLoadNext(!loadNext)} className="load-more-btn">LOAD MORE</button>
                </div>
            }

            {
                loading && !fetchDataError.status &&
                <div> ... loading ...</div>
            }

            {embed.status && <DropboxEmbedd close={closeEmbed} url={embed.url}></DropboxEmbedd>}

            <a 
  href="https://www.dropbox.com/s/u0bdwmkjmqld9l2/dbx-supporting-distributed-work.gif?dl=0" 
  className="dropbox-embed"
  data-height="300px"
></a>
            {/* {fetchDataError.status && <ErrorPage error={fetchDataError}
                                                 back={returnToHome}
                                                 reload={reset}></ErrorPage>} */}
        </div>
    </div>
  )
}
export default DropboxMain;