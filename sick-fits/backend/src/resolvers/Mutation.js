const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { randomBytes } = require("crypto");
const { promisify } = require("util");

const Mutation = {
  async createItem(parent, args, ctx, info) {
    // TODO: check if they are logged in
    const item = await ctx.db.mutation.createItem(
      {
        data: {
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
      `{id title}`
    );
    // check if they has right to delete this item
    // TODO check it when we add users

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

    return {
      message: "Thanks",
    };
    // 3. send email with generated token
  },
  async resetPassword(parent, { resetToken, password, confirmPassword }, ctx, info) {
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
    const token = jwt.sign({ UserID: updatedUser.id }, process.env.APP_SECRET);
    // 7. set JWT to cookie
    ctx.response.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365, // 1 yaer cookie
    });
    // return new user
    return updatedUser;
  },
};

module.exports = Mutation;
