import React from 'react';

//  use context api to pass selected files to child components
export const SelectedFileContext = React.createContext([]);

export const dropboxToCilentModel = (s) => {
  console.log(s);
  const output = {
    id: s.id,
    type: s['.tag'],
    title: s.name,
    datetime: s.client_modified,
    pathLower: s.path_lower,
    hasThumbnail: false,
    thumbnail: '',
    folderColorRgb: '#2196F3',
    modifiedTime: s['client_modified'],
    dbxItem: true,
  };
  return output;
}

export const gDriveToCilentModel = (s) => {
  console.log(s);
  const output = {
    id: s.id,
    type: s.mimeType === 'application/vnd.google-apps.folder' ? 'folder': 'file',
    title: s.name,
    datetime: s.modifiedTime,
    hasThumbnail: s.hasThumbnail,
    thumbnail: s.hasThumbnail ? s.thumbnailLink: s.iconLink,
    folderColorRgb: s.folderColorRgb,
    parents: s.parents,
    webViewLink: s.webViewLink,
    iconLink: s.iconLink,
    modifiedTime: s.modifiedTime,
    dbxItem: false,
  };
  return output;
}

export const dropboxToCilentSearchModel = (src) => {
  const s = src.metadata;
  const output = {
    id: s.id,
    type: s['.tag'],
    title: s.name,
    datetime: s.client_modified,
    pathLower: s.path_lower,
    hasThumbnail: false,
    thumbnail: '',
    folderColorRgb: '#2196F3'
  };
  return output;
}

export const resolveThumbnail = (model, thumbnails) => {
  let _model = model;
  thumbnails.forEach(x => {
    if(x['.tag'] === 'success') {
      const thumbnail = `data:image/png;base64, ${x.thumbnail}`;
      _model = _model.map(el => el.id === x.metadata.id ? {...el, hasThumbnail: true, thumbnail }: el);
    }
  })
  return _model;
} 

export const makePath = (src) => {
  let path = '';
  if(src.length === 1) return path;

  // src.forEach(x => {
  //   path = `${path}/${x.path}`;
  // })
  return src[src.length -1].path;
}

export const sortDropboxFiles = (a, b) => {
  return (a.type === 'folder') ? -1 : 1;
}
export const parseQueryString = (str) => {
  const ret = Object.create(null);

  if (typeof str !== 'string') {
    return ret;
  }

  str = str.trim().replace(/^(\?|#|&)/, '');

  if (!str) {
    return ret;
  }

  str.split('&').forEach((param) => {
    const parts = param.replace(/\+/g, ' ').split('=');
    // Firefox (pre 40) decodes `%3D` to `=`
    // https://github.com/sindresorhus/query-string/pull/37
    let key = parts.shift();
    let val = parts.length > 0 ? parts.join('=') : undefined;

    key = decodeURIComponent(key);

    // missing `=` should be `null`:
    // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
    val = val === undefined ? null : decodeURIComponent(val);

    if (ret[key] === undefined) {
      ret[key] = val;
    } else if (Array.isArray(ret[key])) {
      ret[key].push(val);
    } else {
      ret[key] = [ret[key], val];
    }
  });

  return ret;
}