import React from 'react';
import {Editor} from 'amis-editor';
import {inject, observer} from 'mobx-react';
import {RouteComponentProps} from 'react-router-dom';
import {toast} from 'amis';
import {Icon} from '../icons/index';
import {IMainStore} from '../store';
import '../editor/DisabledEditorPlugin'; // 用于隐藏一些不需要的Editor预置组件
import '../renderer/MyRenderer';
import '../editor/MyRenderer';
import axios from "axios";

import {loadSchema,saveSchema} from '../api/SchemaApi';

const iframeUrl = 'editor.html';
const schemaUrl = 'schema.json';

// 如果在 gh-pages 里面

// @ts-ignore
__uri('amis/schema.json');

export default inject('store')(
    observer(function ({
                           store,
                           location,
                           history,
                           match
                       }: { store: IMainStore } & RouteComponentProps<{ id: string }>) {

        function load() {
            loadSchema(schema => {
                store.updateSchema(schema);
                toast.success("加载成功");
            })
        }

        function save() {
            saveSchema(store.schema)
        }

        return (
            <div className="Editor-Base">
                <div className="Editor-header">
                    <div className="Editor-title">可视化页面编辑器</div>
                    <div className="Editor-view-mode-group-container">
                        <div className="Editor-view-mode-group">
                            <div
                                className={`Editor-view-mode-btn ${
                                    !store.isMobile ? 'is-active' : ''
                                }`}
                                onClick={() => {
                                    store.setIsMobile(false);
                                }}
                            >
                                <Icon icon="pc-preview" title="PC模式"/>
                            </div>
                            <div
                                className={`Editor-view-mode-btn ${
                                    store.isMobile ? 'is-active' : ''
                                }`}
                                onClick={() => {
                                    store.setIsMobile(true);
                                }}
                            >
                                <Icon icon="h5-preview" title="移动模式"/>
                            </div>
                        </div>
                    </div>

                    <div className="Editor-header-actions">
                        <div
                            className={`header-action-btn margin-left-space ${
                                store.preview ? 'primary' : ''
                            }`}
                            onClick={() => {
                                store.setPreview(!store.preview);
                            }}
                        >
                            {store.preview ? '编辑' : '预览'}
                        </div>
                        {!store.preview && (
                            <div>
                                <div className={`header-action-btn exit-btn`} onClick={load}>
                                    重新加载
                                </div>
                                <div className={`header-action-btn exit-btn`} onClick={save}>
                                    保存
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="Editor-inner">
                    <Editor
                        theme={store.theme}
                        preview={store.preview}
                        isMobile={store.isMobile}
                        value={store.schema}
                        onChange={(value: any) => store.updateSchema(value)}
                        onPreview={() => {
                            store.setPreview(true);
                        }}
                        onSave={save}
                        className="is-fixed"
                        $schemaUrl={schemaUrl}
                        iframeUrl={iframeUrl}
                        showCustomRenderersPanel={true}
                    />
                </div>
            </div>
        );
    })


);
