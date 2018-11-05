const Mutation = {
  createDog(parent, {name}, ctx, info) {
    const dog = {
      name
    };
    global.dogs = global.dogs || [];
    global.dogs = [...global.dogs, dog];

    return dog
  }
};

module.exports = Mutation;
