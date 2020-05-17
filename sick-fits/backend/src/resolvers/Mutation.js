const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { randomBytes } = require("crypto");
const { promisify } = require("util");
const { hasPermission } = require("../utils");
const { transport, makeANiceEmail } = require("../mail");
const stripe = require("../stripe");

const Mutation = {
  async createItem(parent, args, ctx, info) {
    if (!ctx.request.userId) {
      throw new Error("You should be logged in order to create item");
    }
    const item = await ctx.db.mutation.createItem(
      {
        data: {
          // this is how to create relations in prisma
          user: {
            connect: {
              id: ctx.request.userId,
            },
          },
          ...args,
        },
      },
      info
    );

    return item;
  },
  updateItem(parent, args, ctx, info) {
    // Copy updates
    const updates = { ...args };
    // remove id from updates
    delete updates.id;

    return ctx.db.mutation.updateItem(
      {
        data: updates,
        where: {
          id: args.id,
        },
      },
      info
    );
  },
  async deleteItem(parent, args, ctx, info) {
    const where = {
      id: args.id,
    };
    // find the item
    const item = await ctx.db.query.item(
      {
        where,
      },
      `{id title user { id }}`
    );
    // check if they has right to delete this item
    const ownItem = item.user.id === ctx.request.userId;
    const hasPermission = ctx.request.user.permissions.some(permission =>
      ["ADMIN", "ITEMDELETE"].includes(permission)
    );

    if (!ownItem && !hasPermission) {
      throw new Error("You don't have a permission to do that!");
    }

    // delete item
    return ctx.db.mutation.deleteItem(
      {
        where,
      },
      info
    );
  },
  async signup(parent, args, ctx, info) {
    // lowercase their email
    args.email = args.email.toLowerCase();
    // hash password
    const salt = 10;
    const password = await bcrypt.hash(args.password, salt);
    // create user in db
    const user = ctx.db.mutation.createUser(
      {
        data: {
          ...args,
          password,
          permissions: { set: ["USER"] },
        },
      },
      info
    );
    // create JWT token
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    // set token to cookie
    ctx.response.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365, // 1 yaer cookie
    });

    // finally return user to browser
    return user;
  },
  async signin(parent, { email, password }, ctx, info) {
    // 1. check if there is a user with such an email
    const user = await ctx.db.query.user({ where: { email } });
    if (!user) {
      throw new Error(`No user found with email ${email}`);
    }
    // 2. check if user password matches
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error("Invalid Password");
    }
    // 3. generate the Jwt token
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    // 4. set the cookie with the token
    ctx.response.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365, // 1 yaer cookie
    });
    // 5. return User
    return user;
  },
  signout(parent, args, ctx, info) {
    ctx.response.clearCookie("token");
    return { message: "Goodbye" };
  },
  async requestReset(parent, { email }, ctx, info) {
    // 1. check if it's a real user
    const user = await ctx.db.query.user({ where: { email } });
    if (!user) {
      throw new Error(`No user found with email ${email}`);
    }
    // 2. generate resetToken
    const randomeBytesPromisified = promisify(randomBytes);
    const resetToken = (await randomeBytesPromisified(20)).toString("hex");
    const resetTokenExpiry = Date.now() + 360000; // 1 hour from now
    const res = await ctx.db.mutation.updateUser({
      where: { email },
      data: { resetToken, resetTokenExpiry },
    });

    // 3. send email with generated token
    const mailRes = await transport.sendMail({
      from: "wes@wesbos.com",
      to: user.email,
      subject: "Your Password Reset Token",
      html: makeANiceEmail(`Your Password Reset Token is here!
      \n\n
      <a href="${process.env.FRONTEND_URL}/reset?resetToken=${resetToken}">Click Here to Reset</a>`),
    });

    // 4. Return the message
    return { message: "Thanks!" };
  },
  async resetPassword(
    parent,
    { resetToken, password, confirmPassword },
    ctx,
    info
  ) {
    // 1. check that confirmPassword matches password
    if (password !== confirmPassword) {
      throw new Error("Passwords don't match");
    }

    // 2. find user with that token
    // 3. check if token is not expired
    const [user] = await ctx.db.query.users({
      where: {
        resetToken,
        resetTokenExpiry_gte: Date.now - 360000,
      },
    });
    if (!user) {
      throw new Error(`Invalid Token: "${resetToken}"`);
    }
    // 4. hash new password
    const salt = 10;
    const passwordHash = await bcrypt.hash(password, salt);

    // 5. reset user password and remove old resetToken
    const updatedUser = await ctx.db.mutation.updateUser({
      where: { email: user.email },
      data: {
        password: passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });
    // 6. generate JWT
    const token = jwt.sign({ userId: updatedUser.id }, process.env.APP_SECRET);
    // 7. set JWT to cookie
    ctx.response.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365, // 1 yaer cookie
    });
    // return new user
    return updatedUser;
  },
  async updatePermissions(parent, args, ctx, info) {
    // 1. check if they are logged in
    if (!ctx.request.userId) {
      throw new Error("You must be logged in!");
    }
    // 2. check if they have permissions  to update query
    hasPermission(ctx.request.user, ["ADMIN", "PERMISSIONUPDATE"]);

    // 3. updatePermissions
    return await ctx.db.mutation.updateUser(
      {
        where: {
          id: args.id,
        },
        data: {
          permissions: {
            set: args.permissions,
          },
        },
      },
      info
    );
  },
  async addToCart(parent, args, ctx, info) {
    // 1. Make sure they are loged in
    const { userId } = ctx.request;
    if (!userId) {
      throw new Error("You must be logged in!");
    }
    // 2. Query the user current cart
    const [existedCartItem] = await ctx.db.query.cartItems({
      where: {
        user: { id: userId },
        item: { id: args.id },
      },
    });
    // 3. Check if item is already in the cart and increment quantity if it is
    if (existedCartItem) {
      return ctx.db.mutation.updateCartItem(
        {
          where: { id: existedCartItem.id },
          data: { quantity: existedCartItem.quantity + 1 },
        },
        info
      );
    }
    // 4. Create a fresh item if it's not
    return ctx.db.mutation.createCartItem(
      {
        data: {
          user: {
            connect: { id: userId },
          },
          item: {
            connect: { id: args.id },
          },
        },
      },
      info
    );
  },
  async removeFromCart(parent, args, ctx, info) {
    // 1. find cart item
    const cartItem = await ctx.db.query.cartItem(
      { where: { id: args.id } },
      `{ id user { id } }`
    );
    // 2. make sure cart item exists
    if (!cartItem) {
      throw new Error(`Cart item with id: ${args.id} doesn't exist`);
    }
    // 3. make sure user own this cart item
    if (cartItem.user.id !== ctx.request.userId) {
      throw new Error("You don't own that cart item");
    }
    // 4. remove cart item
    return ctx.db.mutation.deleteCartItem({ where: { id: args.id } }, info);
  },
  async createOrder(parent, args, ctx, info) {
    // 1. Query the current user and make sure they are signed
    const { userId } = ctx.request;
    if (!userId) throw new Error("You must to sign in to complete this order.");
    const user = await ctx.db.query.user(
      { where: { id: userId } },
      `{id name email cart {id quantity item {title price id description image largeImage}}}`
    );
    // 2. re-calculate total price
    const amount = user.cart.reduce(
      (tally, cartItem) => tally + cartItem.item.price * cartItem.quantity,
      0
    );
    console.log("goint to charge for, ", amount);
    // 3. create Stripe charge
    const charge = await stripe.charges.create({
      amount,
      currency: "USD",
      source: args.token,
    });
    // 4. convert the CartItems to OrderItems
    const orderItems = user.cart.map(cartItem => {
      const orderItem = {
        ...cartItem.item,
        quantity: cartItem.quantity,
        user: { connect: { id: userId } },
      };
      delete orderItem.id;
      return orderItem;
    });
    // 5. create the order
    const order = await ctx.db.mutation.createOrder({
      data: {
        total: charge.amount,
        charge: charge.id,
        items: { create: orderItems },
        user: { connect: { id: userId } },
      },
    });

    // 6. clean up - clear the user cart
    const cartItemsIds = user.cart.map(cartItem => cartItem.id);
    await ctx.db.mutation.deleteManyCartItems({
      where: { id_in: cartItemsIds },
    });
    // return Order

    return order;
  },
};

module.exports = Mutation;
