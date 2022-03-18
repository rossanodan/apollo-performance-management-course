const { ApolloServer, gql, UserInputError } = require("apollo-server");
const {
  ApolloServerPluginLandingPageGraphQLPlayground,
} = require("apollo-server-core"); // to enable the graphql playground
const axios = require("axios");

const typeDefs = gql`
  type Speaker {
    id: ID!
    firstName: String
    lastName: String
    favorite: Boolean
  }
  type SpeakerResults {
    datalist: [Speaker]
  }
  input SpeakerInput {
    firstName: String!
    lastName: String!
    favorite: Boolean
  }
  type Query {
    speakers: SpeakerResults
  }
  type Mutation {
    toggleSpeakerFavorite(id: ID!): Speaker
    addSpeaker(speaker: SpeakerInput): Speaker
    deleteSpeaker(id: ID!): Speaker
  }
`;

const resolvers = {
  Query: {
    speakers: async (parent, args, context, info) => {
      const response = await axios.get("http://localhost:5000/speakers");
      return {
        datalist: response.data,
      };
    },
  },
  Mutation: {
    toggleSpeakerFavorite: async (parent, args, context, info) => {
      const response = await axios.get(
        `http://localhost:5000/speakers/${args.id}`
      );
      const toggledData = {
        ...response.data,
        favorite: !response.data.favorite,
      };
      await axios.put(`http://localhost:5000/speakers/${args.id}`, toggledData);
      return toggledData;
    },
    addSpeaker: async (
      parent,
      { speaker: {firstName, lastName, favorite}},
      context,
      info
    ) => {
      const response = await axios.get("http://localhost:5000/speakers");
      const foundRec = response.data.find(
        (speaker) => speaker.first === firstName && speaker.last === lastName
      );
      if (foundRec) {
        throw new UserInputError("Firstname and lastname already exist", {
          invalidArgs: Object.keys({ firstName, lastName, favorite }),
        });
      }
      const newSpeakerResponse = await axios.post(
        "http://localhost:5000/speakers",
        { first: firstName, last: lastName, favorite }
      );
      return newSpeakerResponse.data;
    },
    deleteSpeaker: async (parent, { id }, context, info) => {
      const url = `http://localhost:5000/speakers/${id}`;
      const foundRec = await axios.get(url);
      await axios.delete(url);
      return foundRec.data;
    },
  },
  SpeakerResults: {
    datalist: (parent, args, context, info) => {
      return parent.datalist;
    },
  },
  Speaker: {
    id: (parent, args, context, info) => parent.id,
    firstName: (parent, args, context, info) => parent.first,
    lastName: (parent, args, context, info) => parent.last,
    favorite: (parent, args, context, info) => parent.favorite,
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginLandingPageGraphQLPlayground({})],
});

server.listen(process.env.PORT || 4001).then(({ url }) => {
  console.log(`Apollo Server is up and running at ${url}`);
});
