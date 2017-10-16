const express = require('express');
const {
  delay,
  status,
} = require('../index');
const request = require('supertest');
const assert = require('assert');

const app = express();
const options = {
  timeout: 500,
};

app.get('/status/:id', status());

app.get('/quick/:responseCode', delay(options), (req, res) => {
  res.sendStatus(Number.parseInt(req.params.responseCode, 10));
});

app.get('/slow', delay(options), (req, res) => {
  setTimeout(() => {
    res.status(200).json({
      message: 'success',
    });
  }, 1000);
});

describe('express-delayed-response', () => {
  const source = request(app);

  [200, 201, 202, 203, 400, 401, 402, 403, 404, 500, 501, 502, 503, 504].forEach((statusCode) => {
    it(`should return ${statusCode}`, () => source.get(`/quick/${statusCode}`).expect(statusCode));
  });

  it('should respond 202 for long responses then eventually resolve', () => (
    source.get('/slow').expect(202).then((response) => {
      assert(response.body && response.body.id);
    })
  ));

  it('should respond 202 on initial status query', () => (
    source.get('/slow').expect(202).then((response) => {
      assert(response.body && response.body.id);
      return source.get(`/status/${response.body.id}`).expect(202);
    })
  ));
});
