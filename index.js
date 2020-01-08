const express = require('express')
const app = express()
const superagent = require('superagent')
const cheerio = require('cheerio')
const Nightmare = require('nightmare');          // 自动化测试包，处理动态页面
const nightmare = Nightmare({ show: true });     // show:true  显示内置模拟浏览器
var async = require("async");

const url = 'http://www.quanben.io'

let novel_types = [] // 小说类型
let novel_info = {} // 小说信息

nightmare
.goto(url)
.wait('.nav')
.inject('js', 'jquery.min.js')
.evaluate(() => {
  let novel_types = []
  $('.nav a').each((idx, ele) => {
    let type = {
      title: $(ele).find('span').text(),
      href: $(ele).attr('href')
    }
    novel_types.push(type)
  })
  return novel_types
})
.then((res) => {
  novel_types = res
  async.eachSeries(novel_types, getNovelInfo, function(err) {
    console.log('done!')
  })
})
.catch(err => console.log('err'))

app.get('/', async (req, res, next) => {
  res.send({
    novel_types,
    novel_info
  })
});

function getNovelInfo(item, callback) {
  const link = item.href
  nightmare
  .goto(`${url}${link}`)
  .wait('div.list2')
  .inject('js', 'jquery.min.js')
  .evaluate(() => {
    let novel_info = []
    $('.list2').each((idx, ele) => {
      let info = {
        coverImg: $(ele).find('img').attr('src'),
        url: $(ele).find('a').attr('href'),
        name: $(ele).find('a span').text(),
        author: $(ele).find('span[itemprop="author"]').text(),
        decription: $(ele).find('p[itemprop="description"]').text()
      }
      novel_info.push(info)
    })
    return novel_info
  })
  .then((res) => {
    novel_info[item.title] = res
    callback()
  })
  .catch(err => console.log('err'))
}

let server = app.listen(3000, function() {
  let host = server.address().address
  let port = server.address().port
  console.log(`Your App is running at http://${host}:${port}`);
})