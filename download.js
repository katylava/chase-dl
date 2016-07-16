#! /usr/bin/env node

const url = require('url')

const moment = require('moment')
const Nightmare = require('nightmare')
const vo = require('vo')

require('nightmare-download-manager')(Nightmare)
require('dotenv').config()

const chaseUrl = 'https://secure05b.chase.com/web/auth/dashboard#/dashboard/index/index'

vo(function* () {
    var nightmare = Nightmare({ show: true })

    nightmare.on('download', function(state, downloadItem){
        if(state == 'started'){
            nightmare.emit('download', `${process.env.CHASE_DOWNLOAD_PATH}/chase.QFX`, downloadItem)
        }
    })

    yield nightmare.downloadManager().viewport(1200, 800)

    const signinUrl = yield nightmare
        .goto(chaseUrl)
        .wait('iframe#logonbox')
        .evaluate(() => document.querySelector('iframe#logonbox').src)

    const balance = yield nightmare
        .goto(signinUrl)
        .wait('#userId-input-field')
        .type('#userId-input-field', process.env.CHASE_USERNAME)
        .type('#password-input-field', process.env.CHASE_PASSWORD)
        .click('button#signin-button')
        .wait('#motion-chk-accountActivity')
        .evaluate(() => $('td.date:contains(Pending)').last().closest('tr').next().children('td:last').text())

    console.log(balance)

    yield nightmare
        .click('#downloadIcon')
        .wait('#header-styledSelect0')
        .click(`div.list-container a[rel="${process.env.CHASE_DOWNLOAD_TYPE}"]`)
        .wait(500)
        .click('div.list-container a[rel="selectDateRangeOption"]')
        .wait('#input-accountActivityFromDate-input-field')
        .type('#input-accountActivityFromDate-input-field', moment().add(-1, 'month').format('MM/DD/YYYY'))
        .type('#input-accountActivityToDate-input-field', moment().format('MM/DD/YYYY'))
        .click('button#download')
        .waitDownloadsComplete()

    yield nightmare.run(console.log)
    yield nightmare.end()

})(console.log)
