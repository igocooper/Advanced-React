import React from "react";
import { adopt } from "react-adopt";
import { Mutation } from "react-apollo";
import StripeCheckout from "react-stripe-checkout";
import Router from "next/router";
import NProgress from "nprogress";
import gql from "graphql-tag";
import calcTotalPrice from "../lib/calcTotalPrice";
import Error from "./ErrorMessage";
import User, { CURRENT_USER_QUERY } from "./User";
import { STRIPE_PUBLIC_KEY } from "../config";

const calcItems = (items) =>
  items.reduce((tally, cartItem) => tally + cartItem.quantity, 0);

const CREATE_ORDER_MUTATION = gql`
  mutation CREATE_ORDER_MUTATION($token: String!) {
    createOrder(token: $token) {
      id
      charge
      total
      items {
        id
        title
      }
    }
  }
`;

const Composed = adopt({
  user: ({ render }) => <User>{render}</User>,
  createOrder: ({ render }) => (
    <Mutation
      mutation={CREATE_ORDER_MUTATION}
      refetchQueries={[{ query: CURRENT_USER_QUERY }]}
    >
      {render}
    </Mutation>
  ),
});

class TakeMyMoney extends React.Component {
  onToken = async (res, createOrder) => {
    NProgress.start();
    const order = await createOrder({
      variables: {
        token: res.id,
      },
    }).catch((err) => alert(err.message));
    Router.push({
      pathname: '/order',
      query: { id: order.data.createOrder.id}
    });
  };

  render() {
    const { children } = this.props;
    return (
      <Composed>
        {({ user, createOrder }) => {
          const {
            data: { me },
          } = user;
          return (
            <StripeCheckout
              amount={calcTotalPrice(me.cart)}
              name="Sick Fits"
              description={`Order of ${calcItems(me.cart)} items`}
              image={me.cart.length && me.cart[0].item && me.cart[0].item.image}
              stripeKey={STRIPE_PUBLIC_KEY}
              email={me.email}
              currency="USD"
              token={(res) => this.onToken(res, createOrder)}
            >
              {children}
            </StripeCheckout>
          );
        }}
      </Composed>
    );
  }
}

export default TakeMyMoney;
