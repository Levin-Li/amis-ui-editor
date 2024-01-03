/**
 * @file entry of this example.
 */

// import './css/iconfont/iconfont.css';
import 'animate.css/animate.css';

import * as React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import '@fortawesome/fontawesome-free/css/all.css';
import '@fortawesome/fontawesome-free/css/v4-shims.css';
import 'amis/lib/themes/cxd.css';
import 'amis/lib/helper.css';
import 'amis/sdk/iconfont.css';
import 'amis-editor-core/lib/style.css';
import './scss/style.scss';
import {setDefaultTheme} from 'amis';


setDefaultTheme('cxd');

export function createLink(url: string, id?: string) {
    const link = document.createElement("link");
    link.href = url;
    link.type = "text/css";
    link.rel = "stylesheet";
    if (id) {
        link.id = id;
    }

    setTimeout(() => {
        document.getElementsByTagName("head").item(0)?.appendChild(link);
    }, 0);
}

// react < 18
ReactDOM.render(<App />, document.getElementById('root'));
