import React from 'react';

const DropboxConnect = (props) => {

  return (
    <div className="wrapper">
      <p style={{fontWeight: 500}}>Connent your  dropbox account</p>
      <button className="selected" onClick={() => props.connect()}>Connect Dropbox</button>
    </div>
  )
}
export default DropboxConnect;