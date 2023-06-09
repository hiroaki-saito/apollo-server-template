import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import cors from "cors";
import express from "express";
import bodyParser from "body-parser";
import http from "http";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import typeDefs from "./schemata";
import resolvers from "./resolvers";
import initialSetting from "./util/plugins/initialSetting";
import {
  simpleEstimator,
  createComplexityRule,
} from "graphql-query-complexity";

const app = express();
const httpServer = http.createServer(app);

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [
    initialSetting(),
    ApolloServerPluginDrainHttpServer({ httpServer }),
  ],
  validationRules: [
    createComplexityRule({
      estimators: [simpleEstimator({ defaultComplexity: 1 })],
      maximumComplexity: 1000,
      onComplete: (complexity: number) => {
        console.log("Query Complexity:", complexity);
      },
    }),
  ],
});

const run = async () => {
  await server.start();

  app.use(
    "/",
    cors<cors.CorsRequest>(),
    bodyParser.json(),
    // expressMiddleware accepts the same arguments:
    // an Apollo Server instance and optional configuration options
    expressMiddleware(server, {
      context: async ({ req }) => ({}),
    })
  );

  // Modified server startup
  await new Promise<void>((resolve) =>
    httpServer.listen({ port: 4000 }, resolve)
  );
  console.log(`🚀 Server ready at http://localhost:4000/`);
};

run();
