'use strict';

const config = require('config');
const util = require('util');
const jenkins = require('jenkins');
const moment = require('moment-timezone');
const Promise = require('bluebird');

module.exports = class Attenkins{

    setJenkins(jenkins) {
        this.jenkins = jenkins;
    }

    constructor(){
        this.jenkins = jenkins(
            {
                baseUrl: util.format(
                    'http://%s:%s@%s:%s',
                    config.jenkins.basicUser,
                    config.jenkins.basicPass,
                    config.jenkins.host,
                    config.jenkins.port
                ),
                crumbIssuer: true,
                promisify: true
            }
        );
    }

    getServerInfo() {
        return new Promise((resolve, reject) => {
            this.jenkins.info().
            then((data) => {
                console.log(data);
                resolve();
            }).catch((error) => {
                console.log(error);
                reject();
            });
        });
    }

    checkInOutOffice(user, greeting) {
        console.log('now:' + moment().format('HH') + ' o\'clock');
        return new Promise((resolve, reject) => {
            // 15時以降にhiするのは勘違いの可能性大
            if (moment().format('HH') >= config.attenkins.timeLimits.checkIn && greeting == 'hi') {
                return reject('fail-safe');
            }
            // 13時前にbyeするのは勘違いの可能性大
            if (moment().format('HH') < config.attenkins.timeLimits.checkOut && greeting == 'bye') {
                return reject('fail-safe');
            }

            this.jenkins.job.build({
                name: util.format(
                    '%s-%s',
                    config.jenkins.job.checkInOut.prefix,
                    user
                ),
                parameters: {
                    user: user,
                    group: greeting
                }
            }).then(() => {
                console.log(greeting + ' job is kicked by ' + user);
                resolve();
            }).catch(() => {
                console.log(greeting + ' job couldn\'t kicked');
                reject();
            });
        });
    }

    sample() {
        console.log('sample-start');
        return new Promise((resolve, reject) => {
            this.jenkins.info().then(() => {
                console.log('sample-end-resolve');
                resolve();
            }).catch(() => {
                console.log('sample-end-reject');
                reject('error');
            });
        });
    }

    loggingWorkLog(user) {
        return new Promise((resolve, reject) => {
            this.jenkins.job.build({
                name: util.format(
                    '%s-%s',
                    config.jenkins.job.loggingWorkLog.prefix,
                    user
                ),
                parameters: {
                    user: user,
                }
            }).then(() => {
                console.log('logging work log job is kicked by ' + user);
                resolve();
            }).catch(() => {
                console.log('logging work log job couldn\'t kicked');
                reject();
            });
        });
    }

    invite6tree(user, invitationDate) {
        return new Promise((resolve, reject) => {
            if (config.attenkins.admittee6p.indexOf(user) == -1) {
                console.log('You have not been approved to invite!');
                return reject();
            }

            if (!invitationDate.match(/.*\/.*\/.*/)) {
                console.log('date format is not Y/M/D!');
                return reject();
            }

            // 入力補完はYYYY/MM/DDだがISOのフォーマットはYYYY-MM-DDのため
            if (!moment(invitationDate.replace(/\//g, '-')).isValid()) {
                console.log('date is not valid');
                return reject();
            }

            this.jenkins.job.build({
                name: util.format(
                    '%s-%s',
                    config.jenkins.job.invite6tree.prefix,
                    user
                ),
                parameters: {
                    user: user,
                    invitationDate: invitationDate
                }
            }).then(() => {
                console.log(invitationDate + ' invite 6tree job is kicked by ' + user);
                resolve();
            }).catch(() => {
                console.log('invite 6tree job couldn\'t kicked');
                reject();
            });
        });
    }
};
