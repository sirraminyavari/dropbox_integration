import React, {useEffect, useState} from 'react';


const DropboxEmbedd =  React.memo(({url, close}) => {

  return (
    <div className="embed-file-container">

      <div className="embed-file-wrapper">

        <div className="embed-file-wrapper">
          <iframe src={url} className="dropbox-embed embed-file-wrapper">
        </iframe>
        </div>
      </div>

      
      <div className="fab" onClick={() => close()}>&#10005;</div>
    </div>
  );
})
export default DropboxEmbedd;