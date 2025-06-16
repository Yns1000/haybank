// swagger.js
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API LA2',
      version: '1.0.0',
      description: 'Documentation Swagger API - Younes Boughriet, Amine Merabet, Hakim Fidjel',
    },
  },
  apis: ['./routes/*.js'], // toutes les routes à documenter
};

const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };
