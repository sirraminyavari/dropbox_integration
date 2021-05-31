import React from 'react';
import FolderIcon from "./folder.icon";
import Checkbox from "./check.box";
import {localDate, localTime} from "./util";
import NoneIcon from './none.icon'

const ListItem = (props) => {

    const {file} = props;

    const toggleSelect = (e) => {
        props.select(e.target.checked, file);
    }

    return (
        <div className="list-item-container">

            {file.type !== 'folder' &&
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


            <div className="list-item-name">{file.title}</div>

            <div className="list-item-date">{
                `${localDate(file.modifiedTime)} - ${localTime(file.modifiedTime)}`
            }</div>
        </div>
    )
}

export default ListItem;
