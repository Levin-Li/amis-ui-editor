import React from 'react';
import {Editor, ShortcutKey, BasePlugin, __uri} from 'amis-editor';
import {inject, observer} from 'mobx-react';
import {RouteComponentProps} from 'react-router-dom';
import {toast, Select, confirm} from 'amis';
import {currentLocale} from 'i18n-runtime';
import {Icon} from '../icons/index';
import {IMainStore} from '../store';
import '../editor/DisabledEditorPlugin'; // 用于隐藏一些不需要的Editor预置组件

import {loadSchema, saveSchema} from '../api/SchemaApi';

require('amis/schema.json');

const schemaUrl = 'schema.json';

export default inject('store')(
    observer(function ({
                           store,
                           location,
                           history,
                           match
                       }: { store: IMainStore } & RouteComponentProps<{ id: string }>) {

        function load() {
            confirm("重新加载将导致变更丢失，确定要重新加载？", "加载提示", "确定")
                .then((ok) => {
                    if (ok) {
                        loadSchema(schema => {
                            store.updateSchema(schema);
                            toast.info("页面已加载", '系统消息')
                        }, store)
                    }
                })
        }

        function save() {
            confirm("确定要保存？", "保存提示", "确定")
                .then((ok) => {
                    if (ok) {
                        saveSchema(store.schema, store)
                    }
                })
        }

        return (
            <div className="Editor-Demo">
                <div className="Editor-header">
                    <div className="Editor-title">{store.title || '可视化页面编辑器'}</div>
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
                            {store.preview ? '返回编辑' : '预览'}
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
                        showCustomRenderersPanel={true}
                        amisEnv={{
                            fetcher: store.fetcher,
                            notify: store.notify,
                            alert: store.alert,
                            copy: store.copy
                        }}
                    />
                </div>
            </div>
        );
    })
);
