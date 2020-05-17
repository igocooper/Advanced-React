const { forwardTo } = require("prisma-binding");
const { hasPermission } = require("../utils");
const Query = {
  // async items(parent, args, ctx, info) {
  //   const items = await ctx.db.query.items(info);

  //   return items;
  // },
  items: forwardTo("db"),
  item: forwardTo("db"),
  itemsConnection: forwardTo("db"),
  me(parent, args, ctx, info) {
    // check if there is current user id
    if (!ctx.request.userId) {
      return null;
    }
    return ctx.db.query.user(
      {
        where: { id: ctx.request.userId },
      },
      info
    );
  },
  async users(parent, args, ctx, info) {
    // 1. check if they are logged in
    if (!ctx.request.userId) {
      throw new Error("You must be logged in!");
    }

    // 2. chekc if they have permissions to query all users
    hasPermission(ctx.request.user, ["ADMIN", "PERMISSIONUPDATE"]);

    // 3. query all the users

    return ctx.db.query.users({}, info);
  },
  async order(parent, args, ctx, info) {
    // 1. make sure they are loged in
    if (!ctx.request.userId) {
      throw new Error("You must be logged in!");
    }

    // 2. query current order
    const order = await ctx.db.query.order({ where: { id: args.id } }, info);

    // 3. check if they have a permissions to see this order
    const ownOrder = order.user.id === ctx.request.userId;
    const hasPermissionToSeeOrder = ctx.request.user.permissions.includes(
      "ADMIN"
    );

    if (!ownOrder || !hasPermissionToSeeOrder) {
      throw new Error("You cannot see this order");
    }
    // 4. return order
    return order;
  },
  async orders(parent, args, ctx, info) {
    const { userId } = ctx.request;
    if (!userId) {
      throw new Error("You must be logged in!");
    }
    return ctx.db.query.orders(
      {
        where: {
          user: { id: userId },
        },
      },
      info
    );
  },
};

module.exports = Query;
