// npm init -y
// npm install minimist
// npm install puppeteer
// input :- node selfPracticeAutomation.js --url=https://www.hackerrank.com --config=config.json

let minimist = require("minimist");
let fs = require("fs");
let puppeteer = require("puppeteer");

let args =  minimist(process.argv);

let configJSON = fs.readFileSync(args.config);
let configJSO = JSON.parse(configJSON);

async function run() {
    let browser = await puppeteer.launch({
        defaultViewport : null,
        args: [
            '-start-maximized'
        ],
        headless: false
    });
    
    let pages = await browser.pages();
    let page = pages[0];

    await page.goto(args.url);

    await page.waitForSelector("a[data-event-action='Login']");
    await page.click("a[data-event-action='Login']");

    await page.waitForSelector("a[href='https://www.hackerrank.com/login']");
    await page.click("a[href='https://www.hackerrank.com/login']");

    await page.waitForSelector("input[name='username']");
    await page.type("input[name='username']", configJSO.userid, {delay : 30});

    await page.waitForSelector("input[name='password']");
    await page.type("input[name='password']", configJSO.password, {delay : 30});

    await page.waitForTimeout(1500);

    await page.waitForSelector("button[data-analytics='LoginPassword']");
    await page.click("button[data-analytics='LoginPassword']");

    await page.waitForSelector("a[data-analytics='NavBarContests']");
    await page.click("a[data-analytics='NavBarContests']");

    await page.waitForSelector("a[href='/administration/contests/']");
    await page.click("a[href='/administration/contests/']");

    await page.waitForSelector("a[data-attr1='Last']");
    let totalPages = await page.$eval("a[data-attr1='Last']", function (LastTag) {
        let numOfPage = parseInt(LastTag.getAttribute('data-page'));
        return numOfPage;
    })

    for (let i = 0; i < totalPages; i++) {
       await getAllLinksInAPage(page, browser);
    }
}

async function getAllLinksInAPage(page, browser) {
    
    await page.waitForSelector("a.backbone.block-center");
    let curls = await page.$$eval("a.backbone.block-center", function (atags) {

        // let urls = [];

        // for (let i = 0; i < atags.length; i++) {
        //     let url = atags[i].getAttribute("href");
        //     urls.push(url);
        //     return urls
        // }

            // ---------or--------------

        let urls = atags.map(function (atag, i) {
            return atag.getAttribute("href");
        });
        return urls

    });

    for (let i = 0; i < curls.length; i++) {
        await addModeratorsInAContest(browser, page, curls[i]);
    }

    page.waitForTimeout(1000);
    page.waitForSelector("a[data-attr1 ='Right']");
    page.click("a[data-attr1 ='Right']");   
}

async function addModeratorsInAContest(browser, page, curl) {
    
    let newPage = await browser.newPage();
    await newPage.goto(args.url + curl);
    await newPage.waitForTimeout(1000);

    await newPage.waitForSelector("li[data-tab='moderators']");
    await newPage.click("li[data-tab='moderators']");

    for (let i = 0; i < configJSO.moderators.length; i++) {
        let moderator = configJSO.moderators[i];

        await newPage.waitForTimeout(1000);
        await newPage.waitForSelector("input#moderator")
        await newPage.type("input#moderator", moderator, {delay: 30})

        await newPage.keyboard.press("Enter");
        
    }

    await newPage.waitForTimeout(1000);
    await newPage.close();
    await page.waitForTimeout(1000);

}
run();