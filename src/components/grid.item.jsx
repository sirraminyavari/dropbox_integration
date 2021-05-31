import React from 'react';
import FolderIcon from "./folder.icon";
import Checkbox from "./check.box";
import {localDate, localTime} from "./util";
import NoneIcon from './none.icon';

const GridItem = (props) => {

    const {file} = props;

    const toggleSelect = (e) => {
        props.select(e.target.checked, file);
    }

    return (
        <div className="grid-item">
            <div style={{display: 'flex', padding: '5px'}}>

                {
                    file.type !== 'folder' &&
                    <div className="checkbox-container">
                        <Checkbox select={toggleSelect} file={file}></Checkbox>
                    </div>
                }

                {file.type === 'folder' &&
                <div className="checkbox-placeholder">

                </div>
                }


                {file.type !== 'folder' && !file.dbxItem &&
                <img src={file.hasThumbnail ? file.thumbnail: file.iconLink}
                     className={file.hasThumbnail ? 'file-thumbnail': 'file-icon'} alt=""/>}

                {file.type !== 'folder' && file.dbxItem && file.hasThumbnail &&
                <img src={file.thumbnail}
                     className={file.hasThumbnail ? 'file-thumbnail': 'file-icon'} alt=""/>}

                {file.type !== 'folder' && file.dbxItem && !file.hasThumbnail && <NoneIcon></NoneIcon>}

                {file.type === 'folder' &&
                <FolderIcon color={file.folderColorRgb}></FolderIcon>}

                <div className="grid-item-details">
                    <div>{file.title}</div>
                    <div style={{fontSize: '12px', color: '#bdbdbd'}}>{
                        `${localDate(file.modifiedTime)} - ${localTime(file.modifiedTime)}`
                    }</div>
                </div>
            </div>
        </div>
    )
}
export default GridItem;
