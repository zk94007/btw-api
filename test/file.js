const { expect } = require('chai');

const superTest = require('supertest');
const uuid = require('uuid/v4');
const bcrypt = require('bcrypt');

const app = require('../server');
const Task = require('../models/Task');
const host = superTest(app);
//const sampleDoc = require('../sampleDocs/image');

//console.log(sampleDoc);

describe('file api', function() {
    describe('/uploadImage endpoint', function() {
 /*  it('fails uploading image - when no file selected', async function() {
            await host.post('/v1/file/upload')
                .set('Content-Type', 'multipart/form-data')
                .attach('file', path.join(sampleDoc))
                .send()
                .expect(400)
                .expect(function (res) {
                    console.log(res);
                    expect(res.body.message).to.equal('File requested to upload is not an image');
                    expect(res.body.message).to.not.equal('null');
                });
        }); */
 
      it('fails uploading image - when no file selected', async function() {
            await  host.post('/v1/file/upload')
                .set('Content-Type', 'application/json')
                .send()
                .expect(404)
                .expect(function (res) {
                    expect(res.body.message).to.equal('No image is found in request');
                    expect(res.body.message).to.not.equal('null');
                });
        });
    });

});
