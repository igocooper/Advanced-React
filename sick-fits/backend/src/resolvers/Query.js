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
};

module.exports = Query;
