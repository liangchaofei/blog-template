import React, { useEffect, useState, useCallback } from 'react'
import { Table, Space, Input, message, Modal, Row, Col } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';

import { Drawer, Button, Form, Pagination, Popconfirm, Spin, Popover } from 'antd';
import CustomLayout from '@/components/CustomLayout'
import MonacoEditor from 'react-monaco-editor';
import './article.scss'
import {
    articleList, articleAdd, articleDel, tagList, categoryList,
    articleUpdata, getArticleDetail
} from '@/api'
import dayjs from 'dayjs'
import { Select, Switch } from 'antd';
import Draggable from 'react-draggable';
import './markdown.scss'
import marked from 'marked'
import hljs from "highlight.js";
import cloneDeep from 'lodash.clonedeep'
import 'highlight.js/styles/monokai-sublime.css';
marked.setOptions({
    renderer: new marked.Renderer(),
    highlight: function (code) {
        return hljs.highlightAuto(code).value;
    },
    pedantic: false,
    gfm: true,
    tables: true,
    breaks: false,
    sanitize: false,
    smartLists: true,
    smartypants: false,
    xhtml: false
});

const { TextArea } = Input;
const { Option } = Select;
const initArticle = {
    title: '',
    summary: '',
    content: '',
    covery_img: '',
    published: '1',
    status: '1',
    tag_ids: [],
    category_id: ''
}

const ArticleList = () => {
    const [form] = Form.useForm()
    const [data, setData] = useState([]);
    const [tag, setTagList] = useState([])
    const [ca, setCa] = useState([])
    const [count, setCount] = useState(0);
    const [visible, setVisible] = useState(false);
    const [isAdd, setIsAdd] = useState(true);
    const [article, setArticleFn] = useState(initArticle)
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false)
    const [loading2, setLoading2] = useState(false);

    //
    const [showArticleDetailModal, setShowArticleDetailModal] = useState(false)
    const [articleDetail, setArticleDetail] = useState({})
    const [showViewBox, setShowViewBox] = useState(false)


    const size = 10;
    //????????????

    const [filter, setFilter] = useState(() => {
        return {
            title: '',
            ca: '',
            published: 'all'
        }
    })
    const onClose = useCallback(() => {
        console.log('onClose')
        form.resetFields()
        setArticleFn(initArticle)
        setVisible(false);
        setIsAdd(true)
    }, [])
    const getArticle = useCallback(
        async (page, size) => {
            try {
                setLoading(true)
                let res = await articleList({ page, size, filter });
                if (res.rows) {
                    setCount(res.count);
                    setData(res.rows)
                }
            } catch (error) {

            } finally {
                setLoading(false)
            }

        }, [article, page, size, filter])
    const save = useCallback(
        async () => {
            if (!article.title) {
                message.error('??????????????????')
                return
            }
            let res = await articleAdd(article)
            if (res?.code === '0000') {
                getArticle(page, size)
                message.success('???????????????', 1, onClose)
            }
        }, [article, page, size])
    const updata = useCallback(
        async (article, source) => {
            if (source === 'detail') {
                setLoading2(true)
            }
            let res = await articleUpdata(article)
            if (res.isOk) {
                message.success('????????????', 1, onClose);
                getArticle(page, size)
            }
            setLoading2(false)
        }, [article, page, size])
    const del = useCallback(
        async (id) => {
            let res = await articleDel({ id })
            if (res.isOk) {
                message.success('????????????', 1);
                getArticle(page, size)
            }
        }, [])
    const taglist = useCallback(
        async () => {
            let res = await tagList();
            if (res) {
                setTagList(res.rows)
            }
        }, [])
    const caList = useCallback(
        async () => {
            let res = await categoryList();
            if (res) {
                setCa(res.rows)
            }
        }, [])
    const showDrawer = useCallback(() => {
        setVisible(true);
    }, [])

    const editorDidMount = useCallback((editor, monaco) => {
        editor.focus();
    }, [])
    const setArticle = useCallback((article, obj) => {
        setArticleFn(() => {
            return {
                ...article,
                ...obj
            }
        })
    }, [])
    const columns = [
        {
            title: '??????',
            dataIndex: 'title',
            key: 'title',
            render: (text, record) => {
                return (
                    <a
                        onClick={async () => {
                            setShowArticleDetailModal(true);
                            let res = await getArticleDetail({ id: record.key })
                            if (res.id) {
                                setArticleDetail(res)
                                console.log(res)
                            } else {
                                message.error(res.msg || '????????????!')
                            }
                        }}
                        className='title-ccc'>{text}
                    </a>
                )
            },
        },
        {
            title: '????????????',
            dataIndex: 'published',
            key: 'published',
            render: (status, record) => {
                return (
                    <Switch
                        checked={status === '0' ? false : true}
                        checkedChildren="??????"
                        unCheckedChildren="??????"
                        onChange={(checked) => {
                            let temp = data.slice()
                            let f = temp.find(d => d.id == record.key);
                            f.published = checked ? '1' : '0'
                            setData(temp)
                        }}
                    />
                )
            }
        },
        {
            title: '??????',
            dataIndex: 'category',
            key: 'category',
            render: (cate, record) => {
                const f = ca.find(d => d.id == cate)
                return (
                    <Select
                        value={f ? f.name : ""}
                        style={{ width: 120 }}
                        onChange={(e) => {
                            let temp = data.slice()
                            let f = temp.find(d => d.id == record.key);
                            f.category_id = e
                            setData(temp)
                        }}>
                        { ca.map(d => <Option key={d.id} value={d.id}>{d.name}</Option>)}
                    </Select>
                )
            }
        },
        {
            title: 'Tags',
            key: 'tag_ids',
            dataIndex: 'tag_ids',
            render: (tags, record) => {
                return (
                    <Select
                        mode="multiple"
                        style={{ width: '100%', minWidth: "50px" }}
                        placeholder="select one tag"
                        value={tags.filter(Boolean)}
                        onChange={(e) => {
                            let temp = data.slice()
                            let f = temp.find(d => d.id == record.key);
                            f.tag_ids = e
                            setData(temp)
                        }}
                        optionLabelProp="label"
                    >
                        {
                            tag.map(d => (
                                <Option key={d.id} value={d.id + ''} label={d.name}>
                                    <div className="demo-option-label-item">
                                        <span role="img" aria-label="China">
                                            {d.name}
                                        </span>
                                    </div>
                                </Option>
                            ))
                        }
                    </Select>
                )
            },
        },
        {
            title: '????????????',
            dataIndex: 'publish_time',
            key: 'publish_time',
            render: (text) => {
                return text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '--'
            }
        },
        {
            title: '??????',
            key: 'action',
            render: (text, record) => (
                <Space size="middle">
                    <Button type='primary' onClick={() => {
                        let article = data.find(d => d.id == record.key)
                        updata(article, 'list')
                    }}>??????</Button>
                    <Popover
                        content={
                            <div>
                                <p> <a target="_blank" href={`/article/edit?id=${record.key}`}>???????????????</a></p>
                            </div>
                        }
                    >
                        <Button type="dashed" onClick={() => {
                            const f = data.find(d => d.id == record.key);
                            let temp = cloneDeep(f);
                            console.log('temp', temp)
                            setIsAdd(false);
                            setArticleFn(temp)
                            form.setFieldsValue(temp)
                            setVisible(true)

                        }}>??????</Button>
                    </Popover>

                    <Popconfirm
                        title="Are you sure to delete this task?"
                        onConfirm={() => del(record.key)}
                        onCancel={() => { }}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button danger>??????</Button>
                    </Popconfirm>

                </Space>
            ),
        },
    ];

    useEffect(() => {
        getArticle(page, size)
        taglist();
        caList()
    }, [])
    return (
        <>
            <CustomLayout className='article-list-c'>
                <Drawer
                    className='article-Drawer'
                    title={isAdd ? '????????????' : '????????????'}
                    footer={
                        <div>
                            <Button type="primary" onClick={() => { isAdd ? save() : updata(article, 'detail') }}>
                                {isAdd ? "??????" : "??????"}
                            </Button>
                            &nbsp;
                            &nbsp;
                            <Button onClick={() => { setShowViewBox(true) }}>
                                {"??????"}
                            </Button>
                        </div>
                    }
                    placement="right"
                    closable={false}
                    onClose={onClose}
                    width={'100%'}
                    visible={visible}
                >
                    <Spin tip="Loading..." spinning={loading2}>
                        <Form
                            layout={{ labelCol: { span: 2 }, wrapperCol: { span: 20 } }}
                            form={form}
                            name="basic"
                            style={{ paddingLeft: '30px' }}
                        >
                            <Form.Item
                                label="??????"
                                name="title"
                                style={{ textAlign: 'left' }}
                            >
                                <Input
                                    value={article.title}
                                    style={{ width: '300px' }}
                                    onChange={(e) => setArticle(article, { title: e.target.value })}
                                />
                            </Form.Item>
                            <Form.Item
                                label="??????"
                                name="summary"
                                style={{ textAlign: 'left' }}
                            >
                                <TextArea
                                    style={{ width: "600px" }}
                                    rows={4}
                                    value={article.summary}
                                    onChange={(e) => setArticle(article, { summary: e.target.value })}
                                />
                            </Form.Item>
                            <Form.Item
                                label="??????"
                                name="category_id"
                                style={{ textAlign: 'left' }}
                            >
                                <Select
                                    value={article.category_id + ""}
                                    style={{ width: 120 }}
                                    onChange={(value) => { setArticle(article, { category_id: value + '' }) }}>
                                    {ca.map(d => <Option key={d.id} value={d.id + ""}>{d.name}</Option>)}
                                </Select>
                            </Form.Item>
                            <Form.Item
                                label="??????"
                                name="tag_ids"
                                style={{ textAlign: 'left' }}
                            >
                                <Select
                                    mode="multiple"
                                    style={{ width: '300px' }}
                                    placeholder="select one tag"
                                    optionLabelProp="label"
                                    value={article.tag_ids.filter(Boolean)}
                                    onChange={(v) => { console.log('v', v); setArticle(article, { tag_ids: v }) }}
                                >
                                    {
                                        tag.map(d => (
                                            <Option key={d.id} value={d.id + ""} label={d.name}>
                                                <div className="demo-option-label-item" >
                                                    <span role="img" aria-label="China">
                                                        {d.name}
                                                    </span>
                                                </div>
                                            </Option>
                                        ))
                                    }
                                </Select>
                            </Form.Item>
                            <Form.Item
                                label="??????"
                                name="published"
                                style={{ textAlign: 'left' }}
                            >
                                <Switch
                                    checked={article.published == '1'}
                                    checkedChildren="??????"
                                    unCheckedChildren="??????"
                                    onChange={(checked) => { setArticle(article, { published: checked ? '1' : '0' }) }}
                                />
                            </Form.Item>
                            <Form.Item
                                label="??????"
                                name="covery_img"
                                style={{ textAlign: 'left' }}
                            >
                                <div>
                                    <Input
                                        style={{ width: "600px" }}
                                        value={article.covery_img}
                                        onChange={(e) => setArticle(article, { covery_img: e.target.value })}
                                    />
                                    <div style={{ textAlign: 'left', padding: '10px 0' }}>
                                        <img style={{ maxWidth: "600px" }} src={article.covery_img} alt="" />
                                    </div>
                                </div>
                            </Form.Item>
                            <Form.Item
                                label="??????"
                                name="content"
                            >
                                <div className="article-box">
                                    <MonacoEditor
                                        // width="900"
                                        width={
                                            document.documentElement.clientWidth ?
                                                document.documentElement.clientWidth * 0.8
                                                : 900
                                        }
                                        height='600'
                                        height={(document.documentElement.clientHeight || 800) - 200}
                                        language="javascript"
                                        // style={{ height: '900px' }}
                                        //  theme="vs-dark"
                                        value={article.content}
                                        options={{ selectOnLineNumbers: true }}
                                        onChange={(value) => { setArticle(article, { content: value }) }}
                                        editorDidMount={editorDidMount}
                                    />
                                </div>
                            </Form.Item>
                        </Form>
                    </Spin>
                </Drawer>
                <Row style={{ marginBottom: '20px' }}>
                    <Col span={4} style={{ textAlign: "left" }}>
                        <Button type="primary" onClick={showDrawer}>
                            ????????????
                    </Button>
                    </Col>
                    <Col span={20} style={{ textAlign: "right" }}>
                        <Form
                            layout={'inline'}
                        // form={form}
                        // initialValues={{ layout: formLayout }}
                        // onValuesChange={onFormLayoutChange}
                        >

                            <Form.Item label="?????????">
                                <Input value={filter.title} allowClear
                                    onChange={(e) => {
                                        console.log(e.target.value)
                                        setFilter((filter) => {
                                            return {
                                                ...filter,
                                                title: e.target.value
                                            }
                                        })
                                    }} placeholder="?????????????????????" />
                            </Form.Item>
                            <Form.Item label="??????">
                                <Select
                                    value={filter.ca}
                                    style={{ textAlign: 'center', width: 120 }}
                                    onChange={(e) => {
                                        let temp = {
                                            ...filter,
                                            ca: e
                                        }
                                        console.log(temp)
                                        setFilter(temp)
                                    }}>
                                    <Option key={'d.id'} value={''}>??????</Option>
                                    {ca.map(d => <Option key={d.id} value={d.id}>{d.name}</Option>)}
                                </Select>
                            </Form.Item>
                            <Form.Item label="????????????">
                                <Select
                                    value={filter.published}
                                    style={{ textAlign: 'center', width: 120 }}
                                    onChange={(e) => {
                                        let temp = {
                                            ...filter,
                                            published: e
                                        }
                                        console.log(temp)
                                        setFilter(temp)
                                    }}>
                                    <Option key={'all'} value={'all'}>??????</Option>
                                    <Option key={'1'} value={'1'}>?????????</Option>
                                    <Option key={'0'} value={'0'}>?????????</Option>
                                </Select>
                            </Form.Item>
                            <Form.Item >
                                <Button type="primary" onClick={() => getArticle(1, size)}>??????</Button>
                                &nbsp;
                                &nbsp;
                                &nbsp;
                                <Button onClick={() => {
                                    setFilter({
                                        title: '',
                                        ca: '',
                                        published: 'all'
                                    })
                                }}>??????</Button>
                            </Form.Item>
                        </Form>

                    </Col>
                </Row>


                <Spin tip="Loading..." spinning={loading}>

                    <Table
                        columns={columns}
                        dataSource={data.map((item, index) => {
                            return {
                                key: item.id,
                                title: item.title,
                                published: item.published,
                                category: item.category_id,
                                tag_ids: item.tag_ids,
                                publish_time: item.publish_time,
                            }
                        })}
                        pagination={false}
                    />
                    <div style={{ padding: '10px' }}>
                        <Pagination
                            current={page}
                            total={count}
                            onChange={(page) => {
                                setPage(page);
                                getArticle(page, size)
                            }}
                        />
                    </div>
                </Spin>

            </CustomLayout >
            {
                showViewBox ?
                    <Draggable
                        // axis="x"
                        handle=".handle"
                        defaultPosition={{ x: 0, y: 0 }}
                        position={null}
                        grid={[25, 25]}
                        scale={1}
                        style={{ zIndex: '99999' }}
                    // onStart={this.handleStart}
                    // onDrag={this.handleDrag}
                    // onStop={this.handleStop}
                    >
                        <div className='markdown-views-box handle' style={{ display: visible ? 'flex' : 'none' }}>
                            <div className='mv-ti'>
                                <p>
                                    ?????????????????????<span>?????????????????????</span>???
                        </p>
                                <div className="close" onClick={() => {
                                    setShowViewBox(false)
                                }}>
                                    <CloseCircleOutlined />
                                </div>
                            </div>
                            <div className="content-box">
                                <div className="markdown-body"
                                    dangerouslySetInnerHTML={{ __html: marked(article.content) }}>
                                </div>
                            </div>
                        </div>
                    </Draggable>
                    : null
            }
            {/* ?????????????????????????????? */}
            <Modal
                title={articleDetail.title}
                visible={showArticleDetailModal}
                footer={null}
                width='1000px'
                centered
                destroyOnClose
                onCancel={() => {
                    setShowArticleDetailModal(false)
                    setArticleDetail({})
                }}
            >
                <div className='article-detail-views-8ui' style={{ height: "calc(100vh - 200px)", overflowY: 'auto' }}>
                    <div className="top-div tc" style={{ paddingTop: '30px' }}>
                        {articleDetail.covery_img ? <img className='toutu' src={articleDetail.covery_img} alt="" /> : ''}
                        <div className="tit tc">
                            {articleDetail.title}
                        </div>
                        <p className="fa">????????? {dayjs(articleDetail.publish_time).format('YYYY-MM-DD HH:mm:ss')}
                        &nbsp;&nbsp;  ??? &nbsp; ?????????  {articleDetail.read_nums || 0}</p>
                    </div>
                    {
                        articleDetail.summary ? <p style={{ padding: '20px' }}>{articleDetail.summary}</p> : null
                    }
                    <div
                        className="markdown-body"
                        dangerouslySetInnerHTML={{
                            __html: marked(articleDetail.content || '')
                        }}
                    >
                    </div>
                </div>
            </Modal>
        </>
    )

}
export default ArticleList