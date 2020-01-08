const express = require('express')
const app = express()
const superagent = require('superagent')
const cheerio = require('cheerio')
const Nightmare = require('nightmare');          // 自动化测试包，处理动态页面
const nightmare = Nightmare({ show: true });     // show:true  显示内置模拟浏览器

let hotNews = [] // 热点新闻
let localNews = [] // 本地新闻

// 模拟浏览器环境访问页面，使js运行，生成动态页面再抓取
nightmare
.goto('http://www.quanben.io/')
.wait('div#local_news')
.evaluate(() => document.querySelector('div#local_news').innerHTML)
.then(htmlStr => {
  localNews = getLocalNews(htmlStr)
})
.catch(error => {
  console.log(`本地新闻抓取失败 = ${error}`)
})

/**
 * [description]- 获取本地新闻数据
 */
let getLocalNews = (htmlStr) => {
  let localNews = [];
  let $ = cheerio.load(htmlStr);

  // 本地新闻
  $('ul#localnews-focus li a').each((idx, ele) => {
    let news = {
      title: $(ele).text(),
      href: $(ele).attr('href'),
    };
    localNews.push(news)
  });

  // 本地资讯
  $('div#localnews-zixun ul li a').each((index, item) => {
    let news = {
      title: $(item).text(),
      href: $(item).attr('href')
    };
    localNews.push(news);
  });

  return localNews
}

let getHotNews = res => {
  let hotNews = []

  // 访问成功后，请求页面返回的数据会包含在res.text中。
  // 使用cheerio模块的cheerio.load()方法，将HTMLdocument作为参数传入函数，以后就可以使用类似jQuery的$(selector)的方式来获取页面元素
  let $ = cheerio.load(res.text)

  // 找到目标数据所在的页面元素，获取数据
  $('.nav a').each((idx, ele) => {
    let news = {
      title: $(ele).text(),
      href: $(ele).attr('href')
    }
    hotNews.push(news)
  })
  return hotNews
}

superagent.get('http://www.quanben.io/').end((err, res) => {
  if (err) {
    console.log(`热点新闻抓取失败 - ${err}`)
  } else {
    // 访问成功
    // 抓取热点新闻数据
    hotNews = getHotNews(res)
  }
})

app.get('/', async (req, res, next) => {
  res.send({
    hotNews: hotNews,
    localNews: localNews
  })
});

let server = app.listen(3000, function() {
  let host = server.address().address
  let port = server.address().port
  console.log(`Your App is running at http://${host}:${port}`);
})